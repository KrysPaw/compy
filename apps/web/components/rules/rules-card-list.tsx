'use client';

import { useTranslations } from 'next-intl';
import { WEIGHT_POOL_TOTAL } from '@compy/shared';
import { RuleCard } from '@/components/rules/rule-card';
import type { Criterion } from '@/components/rules/rule-editor';

export function RulesCardList({
  criteria,
  weights,
  ruleConfigs,
  remaining,
  onRuleChange,
  onWeightChange,
}: {
  criteria: Criterion[];
  weights: Record<number, number>;
  ruleConfigs: Record<number, unknown>;
  remaining: number;
  onRuleChange: (criterion: Criterion, next: unknown) => void;
  onWeightChange: (criterionId: number, next: number) => void;
}) {
  const t = useTranslations('rules');

  if (criteria.length === 0) {
    return (
      <p className="rounded-xl border bg-background px-4 py-10 text-center text-sm text-muted-foreground">
        {t('empty')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3" data-testid="rules-card-list">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {t.rich('remaining', {
          remaining,
          total: WEIGHT_POOL_TOTAL,
          bold: (chunks) => <b>{chunks}</b>,
        })}
      </p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {criteria.map((criterion) => {
          const weight = weights[criterion.id] ?? criterion.weight;

          return (
            <RuleCard
              key={criterion.id}
              criterion={criterion}
              weight={weight}
              remaining={remaining}
              ruleConfig={ruleConfigs[criterion.id] ?? criterion.ruleConfig}
              onRuleChange={onRuleChange}
              onWeightChange={onWeightChange}
            />
          );
        })}
      </div>
    </div>
  );
}
