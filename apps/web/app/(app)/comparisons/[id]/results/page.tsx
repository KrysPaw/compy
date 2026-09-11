import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { rankEntries } from '@compy/shared';
import { ResultsDataTable } from '@/components/results-data-table';
import { getComparisonById } from '@/lib/api';
import { buildResultsRows, resultsInfoColumns } from '@/lib/results';

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
  const t = await getTranslations();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <p className="text-sm text-muted-foreground">{t('pages.resultsBlurb')}</p>
      <ResultsDataTable
        keyCriterionName={keyCriterion?.name ?? t('common.entry')}
        infoColumns={infoColumns}
        rows={rows}
      />
    </div>
  );
}
