import { prosConsByEntry, rankEntries } from '@compy/shared';
import { describe, expect, it } from 'vitest';

function criterion(
  overrides: Partial<{
    id: number;
    name: string;
    type: 'text' | 'number' | 'enum' | 'boolean' | 'rating';
    is_comparable: boolean;
    weight: number;
    config: unknown;
    ruleConfig: unknown;
  }> = {},
) {
  return {
    id: 1,
    name: 'Score',
    type: 'number' as const,
    is_comparable: true,
    weight: 100,
    config: null,
    ruleConfig: { direction: 'higher' as const },
    ...overrides,
  };
}

function entry(
  id: number,
  values: Array<{ criterionId: number; value: unknown }>,
) {
  return { id, entryValues: values };
}

describe('rankEntries', () => {
  it('sorts higher-is-better numbers with the best rate first', () => {
    const ranked = rankEntries(
      [criterion({ id: 1, ruleConfig: { direction: 'higher' } })],
      [
        entry(10, [{ criterionId: 1, value: 10 }]),
        entry(11, [{ criterionId: 1, value: 30 }]),
        entry(12, [{ criterionId: 1, value: 20 }]),
      ],
    );

    expect(ranked.map((item) => item.entryId)).toEqual([11, 12, 10]);
    expect(ranked[0]?.rate).toBe(100);
    expect(ranked[1]?.rate).toBe(50);
    expect(ranked[2]?.rate).toBe(0);
  });

  it('sorts lower-is-better numbers with the lowest value first', () => {
    const ranked = rankEntries(
      [criterion({ id: 1, ruleConfig: { direction: 'lower' } })],
      [
        entry(10, [{ criterionId: 1, value: 10 }]),
        entry(11, [{ criterionId: 1, value: 30 }]),
      ],
    );

    expect(ranked.map((item) => item.entryId)).toEqual([10, 11]);
    expect(ranked[0]?.rate).toBe(100);
    expect(ranked[1]?.rate).toBe(0);
  });

  it('treats missing values as neutral 0.5', () => {
    const ranked = rankEntries(
      [criterion({ id: 1, weight: 100 })],
      [
        entry(10, [{ criterionId: 1, value: 0 }]),
        entry(11, []),
        entry(12, [{ criterionId: 1, value: 100 }]),
      ],
    );

    expect(ranked.find((item) => item.entryId === 11)?.rate).toBe(50);
  });

  it('scores booleans by preferred value', () => {
    const ranked = rankEntries(
      [
        criterion({
          id: 1,
          type: 'boolean',
          ruleConfig: { preferredValue: true },
        }),
      ],
      [
        entry(10, [{ criterionId: 1, value: false }]),
        entry(11, [{ criterionId: 1, value: true }]),
      ],
    );

    expect(ranked.map((item) => item.entryId)).toEqual([11, 10]);
    expect(ranked[0]?.rate).toBe(100);
    expect(ranked[1]?.rate).toBe(0);
  });

  it('scores enum tiers with rank 1 as best', () => {
    const ranked = rankEntries(
      [
        criterion({
          id: 1,
          type: 'enum',
          ruleConfig: {
            tiers: [
              { rank: 1, values: ['Electric'] },
              { rank: 2, values: ['Hybrid'] },
              { rank: 3, values: ['Petrol'] },
            ],
          },
        }),
      ],
      [
        entry(10, [{ criterionId: 1, value: 'Petrol' }]),
        entry(11, [{ criterionId: 1, value: 'Electric' }]),
        entry(12, [{ criterionId: 1, value: 'Hybrid' }]),
      ],
    );

    expect(ranked.map((item) => item.entryId)).toEqual([11, 12, 10]);
  });

  it('normalizes ratings on the configured scale', () => {
    const ranked = rankEntries(
      [
        criterion({
          id: 1,
          type: 'rating',
          config: { min: 1, max: 5 },
          ruleConfig: { direction: 'higher', min: 1, max: 5 },
        }),
      ],
      [
        entry(10, [{ criterionId: 1, value: 1 }]),
        entry(11, [{ criterionId: 1, value: 5 }]),
        entry(12, [{ criterionId: 1, value: 3 }]),
      ],
    );

    expect(ranked.map((item) => item.entryId)).toEqual([11, 12, 10]);
    expect(ranked[0]?.rate).toBe(100);
    expect(ranked[1]?.rate).toBe(50);
    expect(ranked[2]?.rate).toBe(0);
  });

  it('sums weighted contributions across comparable criteria', () => {
    const ranked = rankEntries(
      [
        criterion({
          id: 1,
          weight: 60,
          ruleConfig: { direction: 'higher' },
        }),
        criterion({
          id: 2,
          type: 'boolean',
          weight: 40,
          ruleConfig: { preferredValue: true },
        }),
      ],
      [
        entry(10, [
          { criterionId: 1, value: 100 },
          { criterionId: 2, value: false },
        ]),
        entry(11, [
          { criterionId: 1, value: 0 },
          { criterionId: 2, value: true },
        ]),
      ],
    );

    // entry 10: 60*1 + 40*0 = 60
    // entry 11: 60*0 + 40*1 = 40
    expect(ranked.map((item) => item.entryId)).toEqual([10, 11]);
    expect(ranked[0]?.rate).toBe(60);
    expect(ranked[1]?.rate).toBe(40);
  });
});

describe('prosConsByEntry', () => {
  it('lists strong and weak criteria with type-aware labels', () => {
    const byEntry = prosConsByEntry(
      [
        criterion({
          id: 1,
          name: 'Price',
          weight: 25,
          ruleConfig: { direction: 'lower' },
        }),
        criterion({
          id: 2,
          name: 'Fuel',
          type: 'enum',
          weight: 25,
          ruleConfig: {
            tiers: [
              { rank: 1, values: ['Hybrid'] },
              { rank: 2, values: ['Electric'] },
              { rank: 3, values: ['Petrol'] },
            ],
          },
        }),
        criterion({
          id: 3,
          name: 'electric',
          type: 'boolean',
          weight: 25,
          ruleConfig: { preferredValue: true },
        }),
        criterion({
          id: 4,
          name: 'rate',
          type: 'rating',
          weight: 25,
          config: { min: 1, max: 5 },
          ruleConfig: { direction: 'higher', min: 1, max: 5 },
        }),
      ],
      [
        entry(10, [
          { criterionId: 1, value: 100 },
          { criterionId: 2, value: 'Hybrid' },
          { criterionId: 3, value: true },
          { criterionId: 4, value: 5 },
        ]),
        entry(11, [
          { criterionId: 1, value: 900 },
          { criterionId: 2, value: 'Petrol' },
          { criterionId: 3, value: false },
          { criterionId: 4, value: 1 },
        ]),
      ],
    );

    expect(byEntry.get(10)).toEqual({
      pros: ['Low Price', 'Fuel is Hybrid', 'electric', 'High rate'],
      cons: [],
    });
    expect(byEntry.get(11)).toEqual({
      pros: [],
      cons: ['High Price', 'Fuel is Petrol', 'Not electric', 'Low rate'],
    });
  });

  it('skips mid-range scores and zero-weight criteria', () => {
    const byEntry = prosConsByEntry(
      [
        criterion({
          id: 1,
          name: 'Price',
          weight: 100,
          ruleConfig: { direction: 'higher' },
        }),
        criterion({
          id: 2,
          name: 'Ignored',
          weight: 0,
          ruleConfig: { direction: 'higher' },
        }),
      ],
      [
        entry(10, [
          { criterionId: 1, value: 50 },
          { criterionId: 2, value: 1 },
        ]),
        entry(11, [
          { criterionId: 1, value: 0 },
          { criterionId: 2, value: 100 },
        ]),
        entry(12, [
          { criterionId: 1, value: 100 },
          { criterionId: 2, value: 0 },
        ]),
      ],
    );

    expect(byEntry.get(10)).toEqual({ pros: [], cons: [] });
    expect(byEntry.get(11)).toEqual({ pros: [], cons: ['Low Price'] });
    expect(byEntry.get(12)).toEqual({ pros: ['High Price'], cons: [] });
  });
});
