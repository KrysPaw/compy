import {
  remainingWeightPool,
  WEIGHT_POOL_TOTAL,
  type ComparisonDetailsResponse,
} from '@compy/shared';
import {
  createEnumRuleDraft,
  hasDirection,
  hasPreferredValue,
  isEnumRuleDraftComplete,
} from '@/lib/format-rule';

type Criterion = ComparisonDetailsResponse['criteria'][number];
type Entry = ComparisonDetailsResponse['entries'][number];

export type ResultsConfigWeightIssue = 'zero' | 'partial';

export type ResultsConfigAlertState = {
  weightIssue: ResultsConfigWeightIssue | null;
  remaining: number;
  rulesIncomplete: boolean;
  valuesMissing: boolean;
};

function entryValueForCriterion(
  entry: Entry,
  criterionId: number,
): unknown | undefined {
  const found = entry.entryValues.find(
    (item) => item.criterionId === criterionId,
  );
  return found?.value;
}

/**
 * True when a weighted comparable criterion has at least one null/undefined
 * entry value (including a missing entryValues row). Empty strings do not count.
 */
export function hasMissingWeightedValues(
  criteria: ReadonlyArray<Criterion>,
  entries: ReadonlyArray<Entry>,
): boolean {
  if (entries.length === 0) {
    return false;
  }

  const weighted = criteria.filter(
    (criterion) => criterion.is_comparable && criterion.weight > 0,
  );

  for (const criterion of weighted) {
    for (const entry of entries) {
      const value = entryValueForCriterion(entry, criterion.id);
      if (value === null || value === undefined) {
        return true;
      }
    }
  }

  return false;
}

function enumOptions(config: unknown): string[] {
  if (
    typeof config !== 'object' ||
    config === null ||
    !('options' in config) ||
    !Array.isArray(config.options)
  ) {
    return [];
  }

  return config.options.filter((option): option is string => typeof option === 'string');
}

export function isCriterionRuleIncomplete(criterion: Criterion): boolean {
  if (!criterion.is_comparable) {
    return false;
  }

  if (
    criterion.type === 'number' ||
    criterion.type === 'rating'
  ) {
    return !hasDirection(criterion.ruleConfig);
  }

  if (criterion.type === 'boolean') {
    return !hasPreferredValue(criterion.ruleConfig);
  }

  if (criterion.type === 'enum') {
    const options = enumOptions(criterion.config);
    const draft = createEnumRuleDraft(options, criterion.ruleConfig);
    return !isEnumRuleDraftComplete(draft, options);
  }

  // text (and any other non-scorable type) has no ranking rule to set
  return false;
}

/**
 * Incomplete Rules/Data configuration that can make Results misleading.
 * Returns null when there is nothing to warn about (or no comparable criteria).
 */
export function getResultsConfigAlertState(
  criteria: ReadonlyArray<Criterion>,
  entries: ReadonlyArray<Entry> = [],
): ResultsConfigAlertState | null {
  const comparable = criteria.filter((criterion) => criterion.is_comparable);

  if (comparable.length === 0) {
    return null;
  }

  const remaining = remainingWeightPool(comparable);
  const totalWeight = comparable.reduce(
    (sum, criterion) => sum + criterion.weight,
    0,
  );

  let weightIssue: ResultsConfigWeightIssue | null = null;
  if (totalWeight === 0) {
    weightIssue = 'zero';
  } else if (remaining > 0) {
    weightIssue = 'partial';
  }

  const rulesIncomplete = comparable.some(isCriterionRuleIncomplete);
  const valuesMissing = hasMissingWeightedValues(criteria, entries);

  if (weightIssue === null && !rulesIncomplete && !valuesMissing) {
    return null;
  }

  return {
    weightIssue,
    remaining: Math.max(0, remaining),
    rulesIncomplete,
    valuesMissing,
  };
}

export { WEIGHT_POOL_TOTAL };
