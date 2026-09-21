'use client';

import type { ResultsInfoColumn, ResultsTableRow } from '@/lib/results';
import { ResultsCardList } from '@/components/results/results-card-list';
import { ResultsDataTable } from '@/components/results/results-data-table';
import { useComparisonViewMode } from '@/hooks/use-comparison-view-mode';

export function ResultsView({
  keyCriterionName,
  infoColumns,
  rows,
}: {
  keyCriterionName: string;
  infoColumns: ResultsInfoColumn[];
  rows: ResultsTableRow[];
}) {
  const { effectiveMode } = useComparisonViewMode();

  if (effectiveMode === 'cards') {
    return <ResultsCardList infoColumns={infoColumns} rows={rows} />;
  }

  return (
    <ResultsDataTable
      keyCriterionName={keyCriterionName}
      infoColumns={infoColumns}
      rows={rows}
    />
  );
}
