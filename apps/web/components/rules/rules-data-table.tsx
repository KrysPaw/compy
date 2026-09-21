'use client';

import type { ComparisonDetailsResponse } from '@compy/shared';
import { RulesTable } from '@/components/rules/rules-table';
import { useRulesDataTableState } from '@/components/rules/use-rules-data-table-state';

export function RulesDataTable({
  publicId,
  criteria,
}: {
  publicId: string;
} & Pick<ComparisonDetailsResponse, 'criteria'>) {
  const {
    comparableCriteria,
    weights,
    ruleConfigs,
    remaining,
    error,
    applyWeight,
    applyRule,
  } = useRulesDataTableState(publicId, criteria);

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <RulesTable
        criteria={comparableCriteria}
        weights={weights}
        ruleConfigs={ruleConfigs}
        remaining={remaining}
        onRuleChange={applyRule}
        onWeightChange={applyWeight}
      />
    </div>
  );
}
