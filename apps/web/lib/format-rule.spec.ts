import { describe, expect, it } from 'vitest';
import type { ComparisonDetailsResponse } from '@compy/shared';
import { formatRuleMessage } from './format-rule';

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
    ).toBe('lower is better');

    expect(
      formatRuleMessage(
        criterion({
          id: 2,
          name: 'Rating',
          type: 'rating',
          ruleConfig: { direction: 'higher' },
        }),
      ),
    ).toBe('higher is better');
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
});
