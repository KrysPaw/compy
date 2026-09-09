import type { ComparisonDetailsResponse } from '@compy/shared';

type Criterion = ComparisonDetailsResponse['criteria'][number];

function hasDirection(
  ruleConfig: unknown,
): ruleConfig is { direction: 'higher' | 'lower' } {
  return (
    typeof ruleConfig === 'object' &&
    ruleConfig !== null &&
    'direction' in ruleConfig &&
    (ruleConfig.direction === 'higher' || ruleConfig.direction === 'lower')
  );
}

function hasPreferredValue(
  ruleConfig: unknown,
): ruleConfig is { preferredValue: boolean } {
  return (
    typeof ruleConfig === 'object' &&
    ruleConfig !== null &&
    'preferredValue' in ruleConfig &&
    typeof ruleConfig.preferredValue === 'boolean'
  );
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
      ? 'higher is better'
      : 'lower is better';
  }

  if (criterion.type === 'boolean' && hasPreferredValue(ruleConfig)) {
    return ruleConfig.preferredValue ? 'yes is better' : 'no is better';
  }

  return '—';
}
