import type { ComparisonDetailsResponse } from '@compy/shared';
import type { Role } from '@/components/criteria/role-icon';

type Criterion = ComparisonDetailsResponse['criteria'][number];

export function roleOf(criterion: Criterion): Role {
  if (criterion.is_key) {
    return 'key';
  }

  return criterion.is_comparable ? 'comparable' : 'identity';
}

export const CRITERION_ROLE_ORDER: Record<Role, number> = {
  key: 0,
  identity: 1,
  comparable: 2,
};

export function formatCriterionConfig(
  criterion: Criterion,
  moreOptions: (list: string, count: number) => string,
  emDash: string,
) {
  const config = criterion.config;

  if (criterion.type === 'rating' && config && typeof config === 'object') {
    const { min, max } = config as { min?: number; max?: number };
    if (typeof min === 'number' && typeof max === 'number') {
      return `${min}–${max}`;
    }
  }

  if (criterion.type === 'enum' && config && typeof config === 'object') {
    const { options } = config as { options?: string[] };
    if (Array.isArray(options)) {
      const shown = options.slice(0, 3);
      const remaining = options.length - shown.length;
      return remaining > 0
        ? moreOptions(shown.join(', '), remaining)
        : shown.join(', ');
    }
  }

  return emDash;
}

export function sortCriteriaByRole(criteria: Criterion[]) {
  return [...criteria].sort(
    (left, right) =>
      CRITERION_ROLE_ORDER[roleOf(left)] - CRITERION_ROLE_ORDER[roleOf(right)] ||
      left.id - right.id,
  );
}
