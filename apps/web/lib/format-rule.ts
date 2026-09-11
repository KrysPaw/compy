import {
  defaultEnumRuleConfig,
  EnumRuleConfigSchema,
  type EnumRuleConfig,
  type ComparisonDetailsResponse,
} from '@compy/shared';

type Criterion = ComparisonDetailsResponse['criteria'][number];
type RuleDirection = 'higher' | 'lower';

export type EnumRuleBucketId = 'unassigned' | number;

export type EnumRuleDraft = {
  tiers: Array<{ rank: number; values: string[] }>;
  unassigned: string[];
};

const MIN_ENUM_TIERS = 2;
const MAX_ENUM_TIERS = 10;

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

export function parseEnumRuleConfig(ruleConfig: unknown): EnumRuleConfig | null {
  const parsed = EnumRuleConfigSchema.safeParse(ruleConfig);
  return parsed.success ? parsed.data : null;
}

function pickOne(values: string[]): string | undefined {
  return values[0];
}

export type RuleMessage =
  | { id: 'rules.emDash' }
  | { id: 'rules.higherIsBetter' }
  | { id: 'rules.lowerIsBetter' }
  | { id: 'rules.yesIsBetter' }
  | { id: 'rules.noIsBetter' }
  | { id: 'rules.enumSummary'; values: { best: string; worst: string } };

const EM_DASH: RuleMessage = { id: 'rules.emDash' };

/** Best = lowest-rank non-empty tier; worst = highest-rank non-empty. */
export function formatEnumRuleSummary(ruleConfig: unknown): RuleMessage {
  const parsed = parseEnumRuleConfig(ruleConfig);
  if (!parsed) {
    return EM_DASH;
  }

  const nonEmpty = [...parsed.tiers]
    .filter((tier) => tier.values.length > 0)
    .sort((a, b) => a.rank - b.rank);

  if (nonEmpty.length === 0) {
    return EM_DASH;
  }

  const best = pickOne(nonEmpty[0].values);
  const worst = pickOne(nonEmpty[nonEmpty.length - 1].values);

  if (!best || !worst) {
    return EM_DASH;
  }

  return { id: 'rules.enumSummary', values: { best, worst } };
}

export function createEnumRuleDraft(
  options: readonly string[],
  ruleConfig: unknown,
): EnumRuleDraft {
  const optionSet = new Set(options);
  const parsed = parseEnumRuleConfig(ruleConfig);
  const base = parsed ?? defaultEnumRuleConfig();

  const tiers = [...base.tiers]
    .sort((a, b) => a.rank - b.rank)
    .map((tier) => ({
      rank: tier.rank,
      values: tier.values.filter((value) => optionSet.has(value)),
    }));

  const assigned = new Set(tiers.flatMap((tier) => tier.values));
  const unassigned = options.filter((option) => !assigned.has(option));

  return { tiers, unassigned };
}

export function addEnumTier(draft: EnumRuleDraft): EnumRuleDraft {
  if (draft.tiers.length >= MAX_ENUM_TIERS) {
    return draft;
  }

  const nextRank =
    draft.tiers.reduce((max, tier) => Math.max(max, tier.rank), 0) + 1;

  return {
    ...draft,
    tiers: [...draft.tiers, { rank: nextRank, values: [] }],
  };
}

export function removeEnumTier(draft: EnumRuleDraft): EnumRuleDraft {
  if (draft.tiers.length <= MIN_ENUM_TIERS) {
    return draft;
  }

  const sorted = [...draft.tiers].sort((a, b) => a.rank - b.rank);
  const removed = sorted[sorted.length - 1];
  const remaining = sorted.slice(0, -1);

  return {
    tiers: remaining,
    unassigned: [...draft.unassigned, ...removed.values],
  };
}

export function moveEnumValue(
  draft: EnumRuleDraft,
  value: string,
  to: EnumRuleBucketId,
): EnumRuleDraft {
  const withoutValue: EnumRuleDraft = {
    unassigned: draft.unassigned.filter((item) => item !== value),
    tiers: draft.tiers.map((tier) => ({
      ...tier,
      values: tier.values.filter((item) => item !== value),
    })),
  };

  if (to === 'unassigned') {
    if (withoutValue.unassigned.includes(value)) {
      return withoutValue;
    }

    return {
      ...withoutValue,
      unassigned: [...withoutValue.unassigned, value],
    };
  }

  return {
    ...withoutValue,
    tiers: withoutValue.tiers.map((tier) =>
      tier.rank === to
        ? { ...tier, values: [...tier.values, value] }
        : tier,
    ),
  };
}

export function enumRuleDraftToConfig(draft: EnumRuleDraft): EnumRuleConfig {
  return {
    tiers: draft.tiers.map((tier) => ({
      rank: tier.rank,
      values: [...tier.values],
    })),
  };
}

export function isEnumRuleDraftComplete(
  draft: EnumRuleDraft,
  options: readonly string[],
): boolean {
  if (draft.unassigned.length > 0) {
    return false;
  }

  const assigned = draft.tiers.flatMap((tier) => tier.values);
  if (assigned.length !== options.length) {
    return false;
  }

  const assignedSet = new Set(assigned);
  if (assignedSet.size !== assigned.length) {
    return false;
  }

  return options.every((option) => assignedSet.has(option));
}

/** Short human-readable rule for the Rules table. */
export function formatRuleMessage(criterion: Criterion): RuleMessage {
  if (criterion.type === 'enum') {
    return formatEnumRuleSummary(criterion.ruleConfig);
  }

  const { ruleConfig } = criterion;

  if (
    (criterion.type === 'number' || criterion.type === 'rating') &&
    hasDirection(ruleConfig)
  ) {
    return ruleConfig.direction === 'higher'
      ? { id: 'rules.higherIsBetter' }
      : { id: 'rules.lowerIsBetter' };
  }

  if (criterion.type === 'boolean' && hasPreferredValue(ruleConfig)) {
    return ruleConfig.preferredValue
      ? { id: 'rules.yesIsBetter' }
      : { id: 'rules.noIsBetter' };
  }

  return EM_DASH;
}
