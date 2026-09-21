'use client';

import { useTranslations } from 'next-intl';
import { WEIGHT_POOL_TOTAL } from '@compy/shared';
import { RuleEditor, type Criterion } from '@/components/rules/rule-editor';
import { WeightStepper } from '@/components/rules/weight-stepper';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function RulesTable({
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
  const t = useTranslations();

  return (
    <div
      className="overflow-hidden rounded-xl border bg-background"
      data-testid="rules-data-table"
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('rules.name')}</TableHead>
              <TableHead>{t('rules.rule')}</TableHead>
              <TableHead>
                <div className="flex flex-col gap-0.5">
                  <span>{t('rules.weight')}</span>
                  <span
                    className="text-xs font-normal text-muted-foreground"
                    aria-live="polite"
                  >
                    {t.rich('rules.remaining', {
                      remaining,
                      total: WEIGHT_POOL_TOTAL,
                      bold: (chunks) => <b>{chunks}</b>,
                    })}
                  </span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {criteria.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t('rules.empty')}
                </TableCell>
              </TableRow>
            ) : (
              criteria.map((criterion) => {
                const weight = weights[criterion.id] ?? criterion.weight;

                return (
                  <TableRow key={criterion.id}>
                    <TableCell className="font-medium text-foreground">
                      {criterion.name}
                    </TableCell>
                    <TableCell>
                      <RuleEditor
                        criterion={criterion}
                        ruleConfig={
                          ruleConfigs[criterion.id] ?? criterion.ruleConfig
                        }
                        onChange={(nextRuleConfig) =>
                          onRuleChange(criterion, nextRuleConfig)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <WeightStepper
                        name={criterion.name}
                        value={weight}
                        remaining={remaining}
                        onChange={(nextWeight) =>
                          onWeightChange(criterion.id, nextWeight)
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
