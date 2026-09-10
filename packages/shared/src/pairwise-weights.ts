import { z } from "zod";
import { IdSchema } from "./common/primitives.js";
import { CriterionWeightSchema, WEIGHT_POOL_TOTAL } from "./criterion.js";

export type PairwiseAnswer = "a" | "b" | "both";

export type CriterionPair = Readonly<{
  a: number;
  b: number;
}>;

export type PairwiseAskedAnswers = Readonly<
  Partial<Record<string, PairwiseAnswer>>
>;

export type CriterionWeightAssignment = {
  criterionId: number;
  weight: number;
};

type Preference = "gt" | "lt" | "eq";

export function pairKey(pair: CriterionPair): string {
  return `${pair.a}:${pair.b}`;
}

function parsePairKey(key: string): CriterionPair {
  const [a, b] = key.split(":").map(Number);
  return { a: a!, b: b! };
}

function oppositePreference(preference: Preference): Preference {
  if (preference === "gt") {
    return "lt";
  }

  if (preference === "lt") {
    return "gt";
  }

  return "eq";
}

function composePreferences(
  left: Preference,
  right: Preference,
): Preference | undefined {
  if (left === "eq") {
    return right;
  }

  if (right === "eq") {
    return left;
  }

  if (left === right) {
    return left;
  }

  return undefined;
}

function preferenceFromAnswer(answer: PairwiseAnswer): Preference {
  if (answer === "a") {
    return "gt";
  }

  if (answer === "b") {
    return "lt";
  }

  return "eq";
}

function answerFromPreference(preference: Preference): PairwiseAnswer {
  if (preference === "gt") {
    return "a";
  }

  if (preference === "lt") {
    return "b";
  }

  return "both";
}

function criterionIdsFromPairs(pairs: ReadonlyArray<CriterionPair>): number[] {
  const ids: number[] = [];
  const seen = new Set<number>();

  for (const pair of pairs) {
    for (const id of [pair.a, pair.b]) {
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }

  return ids;
}

function askedEntries(
  askedAnswers: PairwiseAskedAnswers,
): Array<{ pair: CriterionPair; answer: PairwiseAnswer }> {
  const entries: Array<{ pair: CriterionPair; answer: PairwiseAnswer }> = [];

  for (const [key, answer] of Object.entries(askedAnswers)) {
    if (answer === undefined) {
      continue;
    }

    entries.push({ pair: parsePairKey(key), answer });
  }

  return entries;
}

function buildPreferenceRelation(
  askedAnswers: PairwiseAskedAnswers,
): Map<string, Preference> {
  const relation = new Map<string, Preference>();
  const ids = new Set<number>();

  function setPreference(from: number, to: number, preference: Preference) {
    const key = `${from}:${to}`;
    const existing = relation.get(key);

    if (existing !== undefined) {
      return existing === preference;
    }

    relation.set(key, preference);
    relation.set(`${to}:${from}`, oppositePreference(preference));
    return true;
  }

  for (const { pair, answer } of askedEntries(askedAnswers)) {
    ids.add(pair.a);
    ids.add(pair.b);
    setPreference(pair.a, pair.b, preferenceFromAnswer(answer));
  }

  const criterionIds = [...ids];
  let changed = true;

  while (changed) {
    changed = false;

    for (const from of criterionIds) {
      for (const via of criterionIds) {
        if (from === via) {
          continue;
        }

        const first = relation.get(`${from}:${via}`);
        if (first === undefined) {
          continue;
        }

        for (const to of criterionIds) {
          if (to === from || to === via) {
            continue;
          }

          const second = relation.get(`${via}:${to}`);
          if (second === undefined) {
            continue;
          }

          const next = composePreferences(first, second);
          if (next === undefined) {
            continue;
          }

          const existing = relation.get(`${from}:${to}`);
          if (existing === undefined) {
            setPreference(from, to, next);
            changed = true;
          }
        }
      }
    }
  }

  return relation;
}

export function comparablePairs(
  criteria: ReadonlyArray<{ id: number; is_comparable: boolean }>,
): CriterionPair[] {
  const comparable = criteria.filter((criterion) => criterion.is_comparable);
  const pairs: CriterionPair[] = [];

  for (let i = 0; i < comparable.length; i += 1) {
    for (let j = i + 1; j < comparable.length; j += 1) {
      pairs.push({ a: comparable[i]!.id, b: comparable[j]!.id });
    }
  }

  return pairs;
}

export function inferredAnswer(
  askedAnswers: PairwiseAskedAnswers,
  pair: CriterionPair,
): PairwiseAnswer | undefined {
  const asked = askedAnswers[pairKey(pair)];
  if (asked !== undefined) {
    return asked;
  }

  const preference = buildPreferenceRelation(askedAnswers).get(
    `${pair.a}:${pair.b}`,
  );
  if (preference === undefined) {
    return undefined;
  }

  return answerFromPreference(preference);
}

export function nextUndecidedPair(
  pairs: ReadonlyArray<CriterionPair>,
  askedAnswers: PairwiseAskedAnswers,
): CriterionPair | undefined {
  return pairs.find(
    (pair) => inferredAnswer(askedAnswers, pair) === undefined,
  );
}

export function completeAnswers(
  pairs: ReadonlyArray<CriterionPair>,
  askedAnswers: PairwiseAskedAnswers,
): Record<string, PairwiseAnswer> {
  const completed: Record<string, PairwiseAnswer> = {};

  for (const pair of pairs) {
    const answer = inferredAnswer(askedAnswers, pair);
    if (answer !== undefined) {
      completed[pairKey(pair)] = answer;
    }
  }

  return completed;
}

export function scoresFromPairwiseAnswers(
  pairs: ReadonlyArray<CriterionPair>,
  answers: PairwiseAskedAnswers,
): number[] {
  const ids = criterionIdsFromPairs(pairs);
  const scores = new Map<number, number>(ids.map((id) => [id, 0]));

  for (const pair of pairs) {
    const answer = answers[pairKey(pair)];
    if (answer === undefined) {
      continue;
    }

    if (answer === "a" || answer === "both") {
      scores.set(pair.a, (scores.get(pair.a) ?? 0) + 1);
    }

    if (answer === "b" || answer === "both") {
      scores.set(pair.b, (scores.get(pair.b) ?? 0) + 1);
    }
  }

  return ids.map((id) => scores.get(id) ?? 0);
}

export function weightsFromScores(scores: ReadonlyArray<number>): number[] {
  const count = scores.length;
  if (count === 0) {
    return [];
  }

  const total = scores.reduce((sum, score) => sum + score, 0);
  const raw =
    total === 0
      ? scores.map(() => WEIGHT_POOL_TOTAL / count)
      : scores.map((score) => (score / total) * WEIGHT_POOL_TOTAL);
  const floors = raw.map((value) => Math.floor(value));
  const leftover =
    WEIGHT_POOL_TOTAL - floors.reduce((sum, value) => sum + value, 0);

  const order = raw
    .map((value, index) => ({
      index,
      fraction: value - Math.floor(value),
    }))
    .sort(
      (left, right) =>
        right.fraction - left.fraction || left.index - right.index,
    );

  const weights = [...floors];
  for (let i = 0; i < leftover; i += 1) {
    const next = order[i];
    if (next === undefined) {
      break;
    }

    weights[next.index] = (weights[next.index] ?? 0) + 1;
  }

  return weights;
}

export function weightsFromPairwiseAnswers(
  pairs: ReadonlyArray<CriterionPair>,
  askedAnswers: PairwiseAskedAnswers,
): CriterionWeightAssignment[] {
  const answers = completeAnswers(pairs, askedAnswers);
  const weights = weightsFromScores(scoresFromPairwiseAnswers(pairs, answers));

  return criterionIdsFromPairs(pairs).map((criterionId, index) => ({
    criterionId,
    weight: weights[index] ?? 0,
  }));
}

export const ReplaceCriterionWeightsSchema = z
  .object({
    weights: z
      .array(
        z.object({
          criterionId: IdSchema,
          weight: CriterionWeightSchema,
        }),
      )
      .superRefine((items, ctx) => {
        const ids = items.map((item) => item.criterionId);
        if (new Set(ids).size !== ids.length) {
          ctx.addIssue({
            code: "custom",
            message: "Criterion ids must be unique",
          });
        }

        const total = items.reduce((sum, item) => sum + item.weight, 0);
        if (total !== WEIGHT_POOL_TOTAL) {
          ctx.addIssue({
            code: "custom",
            message: "Weights must sum to 100",
          });
        }
      }),
  })
  .strict();
export type ReplaceCriterionWeightsInput = z.infer<
  typeof ReplaceCriterionWeightsSchema
>;
