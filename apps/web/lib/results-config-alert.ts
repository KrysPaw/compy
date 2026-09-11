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

export type ResultsConfigWeightIssue = 'zero' | 'partial';

export type ResultsConfigAlertState = {
  weightIssue: ResultsConfigWeightIssue | null;
  remaining: number;
  rulesIncomplete: boolean;
};

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
 * Incomplete Rules-tab configuration that can make Results misleading.
 * Returns null when there is nothing to warn about (or no comparable criteria).
 */
export function getResultsConfigAlertState(
  criteria: ReadonlyArray<Criterion>,
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

  if (weightIssue === null && !rulesIncomplete) {
    return null;
  }

  return {
    weightIssue,
    remaining: Math.max(0, remaining),
    rulesIncomplete,
  };
}

export { WEIGHT_POOL_TOTAL };
