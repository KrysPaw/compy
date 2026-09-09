import { describe, expect, it } from 'vitest';
import type { ComparisonDetailsResponse } from '@compy/shared';
import {
  formatRuleMessage,
  nextBooleanRuleConfig,
  nextDirectionRuleConfig,
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
    ).toBe('Lower is better');

    expect(
      formatRuleMessage(
        criterion({
          id: 2,
          name: 'Rating',
          type: 'rating',
          ruleConfig: { direction: 'higher' },
        }),
      ),
    ).toBe('Higher is better');
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
    ).toBe('yes is better');

    expect(
      formatRuleMessage(
        criterion({
          id: 4,
          name: 'Used',
          type: 'boolean',
          ruleConfig: { preferredValue: false },
        }),
      ),
    ).toBe('no is better');
  });

  it('shows a dash for enum and missing rule config', () => {
    expect(
      formatRuleMessage(
        criterion({
          id: 5,
          name: 'Fuel',
          type: 'enum',
          ruleConfig: { tiers: [] },
        }),
      ),
    ).toBe('—');

    expect(
      formatRuleMessage(
        criterion({
          id: 6,
          name: 'Year',
          type: 'number',
          ruleConfig: null,
        }),
      ),
    ).toBe('—');
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
