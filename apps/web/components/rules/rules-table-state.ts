import type { Criterion } from '@/components/rules/rule-editor';

export function weightsFrom(criteria: Criterion[]) {
  return Object.fromEntries(
    criteria
      .filter((criterion) => criterion.is_comparable)
      .map((criterion) => [criterion.id, criterion.weight]),
  );
}

export function ruleConfigsFrom(criteria: Criterion[]) {
  return Object.fromEntries(
    criteria
      .filter((criterion) => criterion.is_comparable)
      .map((criterion) => [criterion.id, criterion.ruleConfig]),
  );
}

export function sameRuleConfig(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}
