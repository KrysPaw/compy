import { describe, expect, it } from 'vitest';
import type { ComparisonDetailsResponse } from '@compy/shared';
import {
  addEnumTier,
  createEnumRuleDraft,
  enumRuleDraftToConfig,
  formatEnumRuleSummary,
  formatRuleMessage,
  isEnumRuleDraftComplete,
  moveEnumValue,
  nextBooleanRuleConfig,
  nextDirectionRuleConfig,
  removeEnumTier,
} from './format-rule';

type Criterion = ComparisonDetailsResponse['criteria'][number];

function criterion(
  overrides: Partial<Criterion> & Pick<Criterion, 'id' | 'name' | 'type'>,
): Criterion {
  return {
    is_key: false,
    is_comparable: true,
    weight: 0,
    config: null,
    ruleConfig: null,
    ...overrides,
  };
}

describe('formatRuleMessage', () => {
  it('describes number and rating direction', () => {
    expect(
      formatRuleMessage(
        criterion({
          id: 1,
          name: 'Price',
          type: 'number',
          ruleConfig: { direction: 'lower' },
        }),
      ),
    ).toEqual({ id: 'rules.lowerIsBetter' });

    expect(
      formatRuleMessage(
        criterion({
          id: 2,
          name: 'Rating',
          type: 'rating',
          ruleConfig: { direction: 'higher' },
        }),
      ),
    ).toEqual({ id: 'rules.higherIsBetter' });
  });

  it('describes boolean preferred value', () => {
    expect(
      formatRuleMessage(
        criterion({
          id: 3,
          name: 'Electric',
          type: 'boolean',
          ruleConfig: { preferredValue: true },
        }),
      ),
    ).toEqual({ id: 'rules.yesIsBetter' });

    expect(
      formatRuleMessage(
        criterion({
          id: 4,
          name: 'Used',
          type: 'boolean',
          ruleConfig: { preferredValue: false },
        }),
      ),
    ).toEqual({ id: 'rules.noIsBetter' });
  });

  it('summarizes enum best and worst values', () => {
    expect(
      formatRuleMessage(
        criterion({
          id: 5,
          name: 'Fuel',
          type: 'enum',
          config: { options: ['Petrol', 'Diesel', 'Hybrid'] },
          ruleConfig: {
            tiers: [
              { rank: 1, values: ['Petrol'] },
              { rank: 2, values: ['Hybrid'] },
              { rank: 3, values: ['Diesel'] },
            ],
          },
        }),
      ),
    ).toEqual({
      id: 'rules.enumSummary',
      values: { best: 'Petrol', worst: 'Diesel' },
    });
  });

  it('shows a dash for missing or empty enum assignment', () => {
    expect(formatEnumRuleSummary({ tiers: [] })).toEqual({
      id: 'rules.emDash',
    });
    expect(
      formatEnumRuleSummary({
        tiers: [
          { rank: 1, values: [] },
          { rank: 2, values: [] },
        ],
      }),
    ).toEqual({ id: 'rules.emDash' });

    expect(
      formatRuleMessage(
        criterion({
          id: 6,
          name: 'Year',
          type: 'number',
          ruleConfig: null,
        }),
      ),
    ).toEqual({ id: 'rules.emDash' });
  });

  it('builds a number direction payload without extra fields', () => {
    expect(
      nextDirectionRuleConfig(
        criterion({
          id: 7,
          name: 'Price',
          type: 'number',
          ruleConfig: { direction: 'lower' },
        }),
        'higher',
      ),
    ).toEqual({ direction: 'higher' });
  });

  it('preserves rating bounds when changing direction', () => {
    expect(
      nextDirectionRuleConfig(
        criterion({
          id: 8,
          name: 'Score',
          type: 'rating',
          config: { min: 1, max: 10 },
          ruleConfig: { direction: 'higher', min: 1, max: 10 },
        }),
        'lower',
      ),
    ).toEqual({ direction: 'lower', min: 1, max: 10 });
  });

  it('builds a boolean preferred-value payload', () => {
    expect(nextBooleanRuleConfig(false)).toEqual({ preferredValue: false });
  });
});

describe('enum rule draft helpers', () => {
  const options = ['Petrol', 'Diesel', 'Hybrid'];

  it('starts from defaults and parks unknown options as unassigned', () => {
    const draft = createEnumRuleDraft(options, null);

    expect(draft.tiers).toHaveLength(3);
    expect(draft.unassigned).toEqual(options);
  });

  it('reuses saved tiers and keeps leftover options unassigned', () => {
    const draft = createEnumRuleDraft(options, {
      tiers: [
        { rank: 1, values: ['Petrol'] },
        { rank: 3, values: ['Diesel'] },
      ],
    });

    expect(draft.tiers.map((tier) => tier.rank)).toEqual([1, 3]);
    expect(draft.unassigned).toEqual(['Hybrid']);
  });

  it('moves values between buckets without duplicates', () => {
    const draft = createEnumRuleDraft(options, {
      tiers: [
        { rank: 1, values: [] },
        { rank: 2, values: [] },
      ],
    });

    const moved = moveEnumValue(draft, 'Petrol', 2);
    expect(moved.unassigned).toEqual(['Diesel', 'Hybrid']);
    expect(moved.tiers.find((tier) => tier.rank === 2)?.values).toEqual([
      'Petrol',
    ]);

    const back = moveEnumValue(moved, 'Petrol', 'unassigned');
    expect(back.unassigned).toContain('Petrol');
    expect(back.tiers.every((tier) => !tier.values.includes('Petrol'))).toBe(
      true,
    );
  });

  it('adds and removes tiers within 2–10 and returns values on remove', () => {
    let draft = createEnumRuleDraft(['A', 'B'], {
      tiers: [
        { rank: 1, values: ['A'] },
        { rank: 2, values: ['B'] },
      ],
    });

    draft = addEnumTier(draft);
    expect(draft.tiers).toHaveLength(3);

    draft = moveEnumValue(draft, 'B', 3);
    draft = removeEnumTier(draft);
    expect(draft.tiers).toHaveLength(2);
    expect(draft.unassigned).toContain('B');
  });

  it('requires every option assigned exactly once before save', () => {
    const incomplete = createEnumRuleDraft(options, {
      tiers: [
        { rank: 1, values: ['Petrol'] },
        { rank: 2, values: ['Diesel'] },
      ],
    });
    expect(isEnumRuleDraftComplete(incomplete, options)).toBe(false);

    const complete = moveEnumValue(incomplete, 'Hybrid', 2);
    expect(isEnumRuleDraftComplete(complete, options)).toBe(true);
    expect(enumRuleDraftToConfig(complete)).toEqual({
      tiers: [
        { rank: 1, values: ['Petrol'] },
        { rank: 2, values: ['Diesel', 'Hybrid'] },
      ],
    });
  });
});
