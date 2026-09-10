import {
  comparablePairs,
  completeAnswers,
  inferredAnswer,
  nextUndecidedPair,
  pairKey,
  ReplaceCriterionWeightsSchema,
  scoresFromPairwiseAnswers,
  weightsFromPairwiseAnswers,
  weightsFromScores,
  type CriterionPair,
  type PairwiseAnswer,
  type PairwiseAskedAnswers,
} from '@compy/shared';
import { describe, expect, it } from 'vitest';

const A = 1;
const B = 2;
const C = 3;
const D = 4;

const AB: CriterionPair = { a: A, b: B };
const AC: CriterionPair = { a: A, b: C };
const BC: CriterionPair = { a: B, b: C };
const threePairs = [AB, AC, BC];

function asked(
  ...entries: Array<[CriterionPair, PairwiseAnswer]>
): PairwiseAskedAnswers {
  return Object.fromEntries(
    entries.map(([pair, answer]) => [pairKey(pair), answer]),
  );
}

describe('comparablePairs', () => {
  it('returns unordered comparable pairs in table order', () => {
    expect(
      comparablePairs([
        { id: 10, is_comparable: false },
        { id: A, is_comparable: true },
        { id: B, is_comparable: true },
        { id: 11, is_comparable: false },
        { id: C, is_comparable: true },
      ]),
    ).toEqual(threePairs);
  });
});

describe('transitivity', () => {
  it('infers A>C from A>B and B>C and matches asking all three', () => {
    const twoAsks = asked([AB, 'a'], [BC, 'a']);

    expect(inferredAnswer(twoAsks, AC)).toBe('a');
    expect(nextUndecidedPair(threePairs, twoAsks)).toBeUndefined();
    expect(completeAnswers(threePairs, twoAsks)).toEqual(
      asked([AB, 'a'], [AC, 'a'], [BC, 'a']),
    );
    expect(weightsFromPairwiseAnswers(threePairs, twoAsks)).toEqual(
      weightsFromPairwiseAnswers(
        threePairs,
        asked([AB, 'a'], [AC, 'a'], [BC, 'a']),
      ),
    );
    expect(weightsFromPairwiseAnswers(threePairs, twoAsks)).toEqual([
      { criterionId: A, weight: 67 },
      { criterionId: B, weight: 33 },
      { criterionId: C, weight: 0 },
    ]);
  });

  it('still asks A vs C when A>B and C>B', () => {
    const answers = asked([AB, 'a'], [BC, 'b']);

    expect(inferredAnswer(answers, AC)).toBeUndefined();
    expect(nextUndecidedPair(threePairs, answers)).toEqual(AC);
  });

  it('infers remaining ties from all-both answers', () => {
    const answers = asked([AB, 'both'], [AC, 'both']);

    expect(inferredAnswer(answers, BC)).toBe('both');
    expect(nextUndecidedPair(threePairs, answers)).toBeUndefined();
    expect(weightsFromPairwiseAnswers(threePairs, answers)).toEqual([
      { criterionId: A, weight: 34 },
      { criterionId: B, weight: 33 },
      { criterionId: C, weight: 33 },
    ]);
  });

  it('infers a strict preference through a tie', () => {
    expect(inferredAnswer(asked([AB, 'a'], [BC, 'both']), AC)).toBe('a');
    expect(inferredAnswer(asked([AB, 'both'], [BC, 'a']), AC)).toBe('a');
  });
});

describe('weightsFromPairwiseAnswers', () => {
  it('gives 100/0 when two criteria pick A', () => {
    expect(weightsFromPairwiseAnswers([AB], asked([AB, 'a']))).toEqual([
      { criterionId: A, weight: 100 },
      { criterionId: B, weight: 0 },
    ]);
  });

  it('gives 50/50 when two criteria pick both', () => {
    expect(weightsFromPairwiseAnswers([AB], asked([AB, 'both']))).toEqual([
      { criterionId: A, weight: 50 },
      { criterionId: B, weight: 50 },
    ]);
  });

  it('still scores a non-implied cycle', () => {
    const cycle = asked([AB, 'a'], [BC, 'a'], [AC, 'b']);

    expect(scoresFromPairwiseAnswers(threePairs, cycle)).toEqual([1, 1, 1]);
    expect(weightsFromScores([1, 1, 1])).toEqual([34, 33, 33]);
    expect(weightsFromPairwiseAnswers(threePairs, cycle)).toEqual([
      { criterionId: A, weight: 34 },
      { criterionId: B, weight: 33 },
      { criterionId: C, weight: 33 },
    ]);
  });
});

describe('nextUndecidedPair', () => {
  it('picks the first canonical pair that is not implied', () => {
    expect(nextUndecidedPair(threePairs, {})).toEqual(AB);
    expect(nextUndecidedPair(threePairs, asked([AB, 'a']))).toEqual(AC);

    const fourPairs = comparablePairs([
      { id: A, is_comparable: true },
      { id: B, is_comparable: true },
      { id: C, is_comparable: true },
      { id: D, is_comparable: true },
    ]);

    expect(
      nextUndecidedPair(fourPairs, asked([AB, 'a'], [AC, 'b'])),
    ).toEqual({ a: A, b: D });
  });
});

describe('ReplaceCriterionWeightsSchema', () => {
  it('accepts unique ids that sum to 100', () => {
    expect(
      ReplaceCriterionWeightsSchema.safeParse({
        weights: [
          { criterionId: 1, weight: 67 },
          { criterionId: 2, weight: 33 },
          { criterionId: 3, weight: 0 },
        ],
      }).success,
    ).toBe(true);
  });

  it('rejects a sum other than 100', () => {
    const parsed = ReplaceCriterionWeightsSchema.safeParse({
      weights: [
        { criterionId: 1, weight: 40 },
        { criterionId: 2, weight: 40 },
      ],
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects duplicate criterion ids', () => {
    const parsed = ReplaceCriterionWeightsSchema.safeParse({
      weights: [
        { criterionId: 1, weight: 50 },
        { criterionId: 1, weight: 50 },
      ],
    });

    expect(parsed.success).toBe(false);
  });
});
