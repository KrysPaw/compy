'use client';

import { useTranslations } from 'next-intl';
import { RuleEditor, type Criterion } from '@/components/rules/rule-editor';
import { WeightStepper } from '@/components/rules/weight-stepper';

export function RuleCard({
  criterion,
  weight,
  remaining,
  ruleConfig,
  onRuleChange,
  onWeightChange,
}: {
  criterion: Criterion;
  weight: number;
  remaining: number;
  ruleConfig: unknown;
  onRuleChange: (criterion: Criterion, next: unknown) => void;
  onWeightChange: (criterionId: number, next: number) => void;
}) {
  const t = useTranslations();

  return (
    <article className="rounded-xl border bg-background p-4">
      <h3 className="text-base font-medium text-foreground">{criterion.name}</h3>
      <dl className="mt-3 space-y-3 text-sm">
        <div className="flex flex-col gap-1.5">
          <dt className="text-muted-foreground">{t('rules.rule')}</dt>
          <dd>
            <RuleEditor
              criterion={criterion}
              ruleConfig={ruleConfig}
              onChange={(nextRuleConfig) =>
                onRuleChange(criterion, nextRuleConfig)
              }
            />
          </dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-muted-foreground">{t('rules.weight')}</dt>
          <dd>
            <WeightStepper
              name={criterion.name}
              value={weight}
              remaining={remaining}
              onChange={(nextWeight) =>
                onWeightChange(criterion.id, nextWeight)
              }
            />
          </dd>
        </div>
      </dl>
    </article>
  );
}
