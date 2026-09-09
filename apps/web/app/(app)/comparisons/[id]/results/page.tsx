import { notFound } from 'next/navigation';
import { rankEntries } from '@compy/shared';
import {
  buildResultsRows,
  ResultsDataTable,
  resultsInfoColumns,
} from '@/components/results-data-table';
import { getComparisonById } from '@/lib/api';

export default async function ResultsPage({
  params,
}: PageProps<'/comparisons/[id]/results'>) {
  const { id } = await params;
  const comparisonId = Number(id);

  if (!Number.isInteger(comparisonId) || comparisonId <= 0) {
    notFound();
  }

  const comparison = await getComparisonById(comparisonId);

  if (comparison === null) {
    notFound();
  }

  const ranked = rankEntries(comparison.criteria, comparison.entries);
  const infoColumns = resultsInfoColumns(comparison.criteria);
  const rows = buildResultsRows(comparison, ranked, infoColumns);
  const keyCriterion = comparison.criteria.find(
    (criterion) => criterion.is_key,
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <p className="text-sm text-muted-foreground">
        Results rank entries by weighted rules. Best match is at the top.
      </p>
      <ResultsDataTable
        keyCriterionName={keyCriterion?.name ?? 'Entry'}
        infoColumns={infoColumns}
        rows={rows}
      />
    </div>
  );
}
