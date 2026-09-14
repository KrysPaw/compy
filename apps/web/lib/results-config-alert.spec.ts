import { describe, expect, it } from 'vitest';
import type { ComparisonDetailsResponse } from '@compy/shared';
import {
  getResultsConfigAlertState,
  hasMissingWeightedValues,
  isCriterionRuleIncomplete,
  WEIGHT_POOL_TOTAL,
} from './results-config-alert';

type Criterion = ComparisonDetailsResponse['criteria'][number];
type Entry = ComparisonDetailsResponse['entries'][number];

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

function entry(
  id: number,
  entryValues: Entry['entryValues'] = [],
): Entry {
  return { id, entryValues };
}

describe('isCriterionRuleIncomplete', () => {
  it('treats unset number/rating/boolean rules as incomplete', () => {
    expect(
      isCriterionRuleIncomplete(
        criterion({ id: 1, name: 'Price', type: 'number' }),
      ),
    ).toBe(true);
    expect(
      isCriterionRuleIncomplete(
        criterion({
          id: 2,
          name: 'Price',
          type: 'number',
          ruleConfig: { direction: 'lower' },
        }),
      ),
    ).toBe(false);
    expect(
      isCriterionRuleIncomplete(
        criterion({ id: 3, name: 'On sale', type: 'boolean' }),
      ),
    ).toBe(true);
  });

  it('treats incomplete enum assignment as incomplete', () => {
    const options = ['Petrol', 'Hybrid', 'Electric'];
    expect(
      isCriterionRuleIncomplete(
        criterion({
          id: 4,
          name: 'Fuel',
          type: 'enum',
          config: { options },
          ruleConfig: {
            tiers: [
              { rank: 1, values: ['Electric'] },
              { rank: 2, values: [] },
              { rank: 3, values: [] },
            ],
          },
        }),
      ),
    ).toBe(true);

    expect(
      isCriterionRuleIncomplete(
        criterion({
          id: 5,
          name: 'Fuel',
          type: 'enum',
          config: { options },
          ruleConfig: {
            tiers: [
              { rank: 1, values: ['Electric'] },
              { rank: 2, values: ['Hybrid'] },
              { rank: 3, values: ['Petrol'] },
            ],
          },
        }),
      ),
    ).toBe(false);
  });

  it('ignores non-comparable and text criteria', () => {
    expect(
      isCriterionRuleIncomplete(
        criterion({
          id: 6,
          name: 'Notes',
          type: 'text',
          is_comparable: true,
        }),
      ),
    ).toBe(false);
    expect(
      isCriterionRuleIncomplete(
        criterion({
          id: 7,
          name: 'Brand',
          type: 'text',
          is_comparable: false,
        }),
      ),
    ).toBe(false);
  });
});

describe('hasMissingWeightedValues', () => {
  const price = criterion({
    id: 1,
    name: 'Price',
    type: 'number',
    weight: 100,
    ruleConfig: { direction: 'lower' },
  });

  it('returns false when there are no entries', () => {
    expect(hasMissingWeightedValues([price], [])).toBe(false);
  });

  it('detects null, undefined, and missing entryValues rows', () => {
    expect(
      hasMissingWeightedValues(
        [price],
        [entry(1, [{ criterionId: 1, value: null }])],
      ),
    ).toBe(true);
    expect(
      hasMissingWeightedValues(
        [price],
        [entry(1, [{ criterionId: 1, value: undefined }])],
      ),
    ).toBe(true);
    expect(hasMissingWeightedValues([price], [entry(1, [])])).toBe(true);
  });

  it('ignores empty strings and zero-weight criteria', () => {
    expect(
      hasMissingWeightedValues(
        [price],
        [entry(1, [{ criterionId: 1, value: '' }])],
      ),
    ).toBe(false);
    expect(
      hasMissingWeightedValues(
        [
          criterion({
            id: 1,
            name: 'Price',
            type: 'number',
            weight: 0,
            ruleConfig: { direction: 'lower' },
          }),
        ],
        [entry(1, [])],
      ),
    ).toBe(false);
  });
});

describe('getResultsConfigAlertState', () => {
  it('returns null when there are no comparable criteria', () => {
    expect(
      getResultsConfigAlertState([
        criterion({
          id: 1,
          name: 'Name',
          type: 'text',
          is_key: true,
          is_comparable: false,
        }),
      ]),
    ).toBeNull();
  });

  it('flags zero weights separately from a partial pool', () => {
    expect(
      getResultsConfigAlertState([
        criterion({
          id: 1,
          name: 'Price',
          type: 'number',
          weight: 0,
          ruleConfig: { direction: 'lower' },
        }),
        criterion({
          id: 2,
          name: 'Rating',
          type: 'rating',
          weight: 0,
          config: { min: 1, max: 5 },
          ruleConfig: { direction: 'higher', min: 1, max: 5 },
        }),
      ]),
    ).toEqual({
      weightIssue: 'zero',
      remaining: WEIGHT_POOL_TOTAL,
      rulesIncomplete: false,
      valuesMissing: false,
    });

    expect(
      getResultsConfigAlertState([
        criterion({
          id: 1,
          name: 'Price',
          type: 'number',
          weight: 40,
          ruleConfig: { direction: 'lower' },
        }),
        criterion({
          id: 2,
          name: 'Rating',
          type: 'rating',
          weight: 20,
          config: { min: 1, max: 5 },
          ruleConfig: { direction: 'higher', min: 1, max: 5 },
        }),
      ]),
    ).toEqual({
      weightIssue: 'partial',
      remaining: 40,
      rulesIncomplete: false,
      valuesMissing: false,
    });
  });

  it('can combine weight and rules issues in one state', () => {
    expect(
      getResultsConfigAlertState([
        criterion({
          id: 1,
          name: 'Price',
          type: 'number',
          weight: 60,
          ruleConfig: null,
        }),
      ]),
    ).toEqual({
      weightIssue: 'partial',
      remaining: 40,
      rulesIncomplete: true,
      valuesMissing: false,
    });
  });

  it('returns null when weights, rules, and values are complete', () => {
    expect(
      getResultsConfigAlertState(
        [
          criterion({
            id: 1,
            name: 'Price',
            type: 'number',
            weight: 60,
            ruleConfig: { direction: 'lower' },
          }),
          criterion({
            id: 2,
            name: 'Rating',
            type: 'rating',
            weight: 40,
            config: { min: 1, max: 5 },
            ruleConfig: { direction: 'higher', min: 1, max: 5 },
          }),
        ],
        [
          entry(1, [
            { criterionId: 1, value: 10 },
            { criterionId: 2, value: 4 },
          ]),
        ],
      ),
    ).toBeNull();
  });

  it('shows only rules line when the weight pool is full', () => {
    expect(
      getResultsConfigAlertState([
        criterion({
          id: 1,
          name: 'Price',
          type: 'number',
          weight: 100,
          ruleConfig: null,
        }),
      ]),
    ).toEqual({
      weightIssue: null,
      remaining: 0,
      rulesIncomplete: true,
      valuesMissing: false,
    });
  });

  it('flags missing values when weights and rules are otherwise complete', () => {
    expect(
      getResultsConfigAlertState(
        [
          criterion({
            id: 1,
            name: 'Price',
            type: 'number',
            weight: 100,
            ruleConfig: { direction: 'lower' },
          }),
        ],
        [entry(1, [{ criterionId: 1, value: null }])],
      ),
    ).toEqual({
      weightIssue: null,
      remaining: 0,
      rulesIncomplete: false,
      valuesMissing: true,
    });
  });
});
