import {
  BooleanRuleConfigSchema,
  EnumRuleConfigSchema,
  NumberRuleConfigSchema,
  RatingRuleConfigSchema,
  type RuleDirection,
} from "./criterion.js";

const NEUTRAL_SCORE = 0.5;

export type ScorableCriterion = {
  id: number;
  type: "text" | "number" | "enum" | "boolean" | "rating";
  is_comparable: boolean;
  weight: number;
  config: unknown;
  ruleConfig: unknown;
};

export type ScorableEntry = {
  id: number;
  entryValues: ReadonlyArray<{
    criterionId: number;
    value: unknown;
  }>;
};

export type RankedEntry = {
  entryId: number;
  rate: number;
};

function valueOf(
  entry: ScorableEntry,
  criterionId: number,
): unknown | undefined {
  const found = entry.entryValues.find(
    (item) => item.criterionId === criterionId,
  );
  return found?.value;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeRange(
  value: number,
  min: number,
  max: number,
  direction: RuleDirection,
): number {
  if (min === max) {
    return 1;
  }

  const higherScore = (value - min) / (max - min);
  return direction === "higher" ? higherScore : 1 - higherScore;
}

function numberDirection(ruleConfig: unknown): RuleDirection {
  const parsed = NumberRuleConfigSchema.safeParse(ruleConfig);
  return parsed.success ? parsed.data.direction : "higher";
}

function ratingRule(ruleConfig: unknown, config: unknown) {
  const parsed = RatingRuleConfigSchema.safeParse(ruleConfig);
  if (parsed.success) {
    return parsed.data;
  }

  const fromConfig =
    typeof config === "object" &&
    config !== null &&
    "min" in config &&
    "max" in config &&
    typeof config.min === "number" &&
    typeof config.max === "number" &&
    config.min < config.max
      ? { min: config.min, max: config.max }
      : { min: 1, max: 5 };

  return {
    direction: "higher" as const,
    min: fromConfig.min,
    max: fromConfig.max,
  };
}

function preferredBoolean(ruleConfig: unknown): boolean {
  const parsed = BooleanRuleConfigSchema.safeParse(ruleConfig);
  return parsed.success ? parsed.data.preferredValue : true;
}

function enumTierRank(
  ruleConfig: unknown,
  value: string,
): number | null {
  const parsed = EnumRuleConfigSchema.safeParse(ruleConfig);
  if (!parsed.success) {
    return null;
  }

  for (const tier of parsed.data.tiers) {
    if (tier.values.includes(value)) {
      return tier.rank;
    }
  }

  return null;
}

function enumRanks(ruleConfig: unknown): number[] {
  const parsed = EnumRuleConfigSchema.safeParse(ruleConfig);
  if (!parsed.success) {
    return [];
  }

  return parsed.data.tiers.map((tier) => tier.rank);
}

function normalizeCriterionScores(
  criterion: ScorableCriterion,
  entries: ReadonlyArray<ScorableEntry>,
): Map<number, number> {
  const scores = new Map<number, number>();

  if (!criterion.is_comparable || criterion.weight === 0) {
    for (const entry of entries) {
      scores.set(entry.id, 0);
    }
    return scores;
  }

  if (criterion.type === "number") {
    const direction = numberDirection(criterion.ruleConfig);
    const present = entries
      .map((entry) => ({
        entryId: entry.id,
        value: asFiniteNumber(valueOf(entry, criterion.id)),
      }))
      .filter(
        (item): item is { entryId: number; value: number } =>
          item.value !== null,
      );

    const values = present.map((item) => item.value);
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;
    const presentIds = new Set(present.map((item) => item.entryId));

    for (const entry of entries) {
      if (!presentIds.has(entry.id)) {
        scores.set(entry.id, NEUTRAL_SCORE);
        continue;
      }

      const value = asFiniteNumber(valueOf(entry, criterion.id));
      scores.set(
        entry.id,
        value === null
          ? NEUTRAL_SCORE
          : normalizeRange(value, min, max, direction),
      );
    }

    return scores;
  }

  if (criterion.type === "rating") {
    const rule = ratingRule(criterion.ruleConfig, criterion.config);

    for (const entry of entries) {
      const value = asFiniteNumber(valueOf(entry, criterion.id));
      if (value === null) {
        scores.set(entry.id, NEUTRAL_SCORE);
        continue;
      }

      scores.set(
        entry.id,
        normalizeRange(value, rule.min, rule.max, rule.direction),
      );
    }

    return scores;
  }

  if (criterion.type === "boolean") {
    const preferred = preferredBoolean(criterion.ruleConfig);

    for (const entry of entries) {
      const value = asBoolean(valueOf(entry, criterion.id));
      if (value === null) {
        scores.set(entry.id, NEUTRAL_SCORE);
        continue;
      }

      scores.set(entry.id, value === preferred ? 1 : 0);
    }

    return scores;
  }

  if (criterion.type === "enum") {
    const ranks = enumRanks(criterion.ruleConfig);
    const minRank = ranks.length > 0 ? Math.min(...ranks) : 1;
    const maxRank = ranks.length > 0 ? Math.max(...ranks) : 1;

    for (const entry of entries) {
      const value = asString(valueOf(entry, criterion.id));
      if (value === null) {
        scores.set(entry.id, NEUTRAL_SCORE);
        continue;
      }

      const rank = enumTierRank(criterion.ruleConfig, value);
      if (rank === null) {
        scores.set(entry.id, NEUTRAL_SCORE);
        continue;
      }

      // Rank 1 is best; higher ranks are worse.
      scores.set(
        entry.id,
        normalizeRange(rank, minRank, maxRank, "lower"),
      );
    }

    return scores;
  }

  for (const entry of entries) {
    scores.set(entry.id, 0);
  }

  return scores;
}

/** Weighted ranking: higher rate is a better match. */
export function rankEntries(
  criteria: ReadonlyArray<ScorableCriterion>,
  entries: ReadonlyArray<ScorableEntry>,
): RankedEntry[] {
  const contributions = new Map<number, number>();

  for (const entry of entries) {
    contributions.set(entry.id, 0);
  }

  for (const criterion of criteria) {
    if (!criterion.is_comparable || criterion.weight === 0) {
      continue;
    }

    const normalized = normalizeCriterionScores(criterion, entries);

    for (const entry of entries) {
      const score = normalized.get(entry.id) ?? NEUTRAL_SCORE;
      contributions.set(
        entry.id,
        (contributions.get(entry.id) ?? 0) + criterion.weight * score,
      );
    }
  }

  return [...entries]
    .map((entry) => ({
      entryId: entry.id,
      rate: contributions.get(entry.id) ?? 0,
    }))
    .sort((left, right) => {
      if (right.rate !== left.rate) {
        return right.rate - left.rate;
      }

      return left.entryId - right.entryId;
    });
}
