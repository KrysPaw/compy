import type { ComparisonDetailsResponse } from '@compy/shared';

type Criterion = ComparisonDetailsResponse['criteria'][number];
type RuleDirection = 'higher' | 'lower';

export function hasDirection(
  ruleConfig: unknown,
): ruleConfig is { direction: RuleDirection } {
  return (
    typeof ruleConfig === 'object' &&
    ruleConfig !== null &&
    'direction' in ruleConfig &&
    (ruleConfig.direction === 'higher' || ruleConfig.direction === 'lower')
  );
}

export function hasPreferredValue(
  ruleConfig: unknown,
): ruleConfig is { preferredValue: boolean } {
  return (
    typeof ruleConfig === 'object' &&
    ruleConfig !== null &&
    'preferredValue' in ruleConfig &&
    typeof ruleConfig.preferredValue === 'boolean'
  );
}

function integerBounds(
  value: unknown,
): { min: number; max: number } | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  if (!('min' in value) || !('max' in value)) {
    return undefined;
  }

  const { min, max } = value;

  if (
    typeof min !== 'number' ||
    typeof max !== 'number' ||
    !Number.isInteger(min) ||
    !Number.isInteger(max) ||
    min >= max
  ) {
    return undefined;
  }

  return { min, max };
}

export function nextDirectionRuleConfig(
  criterion: Criterion,
  direction: RuleDirection,
  ruleConfig: unknown = criterion.ruleConfig,
) {
  if (criterion.type === 'rating') {
    return {
      direction,
      ...(integerBounds(ruleConfig) ??
        integerBounds(criterion.config) ?? { min: 1, max: 5 }),
    };
  }

  return { direction };
}

export function nextBooleanRuleConfig(preferredValue: boolean) {
  return { preferredValue };
}

/** Short human-readable rule for the Rules table (enum is deferred). */
export function formatRuleMessage(criterion: Criterion): string {
  if (criterion.type === 'enum') {
    return '—';
  }

  const { ruleConfig } = criterion;

  if (
    (criterion.type === 'number' || criterion.type === 'rating') &&
    hasDirection(ruleConfig)
  ) {
    return ruleConfig.direction === 'higher'
      ? 'Higher is better'
      : 'Lower is better';
  }

  if (criterion.type === 'boolean' && hasPreferredValue(ruleConfig)) {
    return ruleConfig.preferredValue ? 'yes is better' : 'no is better';
  }

  return '—';
}
