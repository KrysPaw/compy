import { notFound } from 'next/navigation';
import { PublicIdSchema } from '@compy/shared';
import { getTranslations } from 'next-intl/server';
import { rankEntries } from '@compy/shared';
import { ComparisonViewModeToggle } from '@/components/comparison/comparison-view-mode-toggle';
import { ResultsConfigAlert } from '@/components/results/results-config-alert';
import { ResultsView } from '@/components/results/results-view';
import { loadOpenComparison } from '@/lib/load-comparison';
import { buildResultsRows, resultsInfoColumns } from '@/lib/results';

export default async function ResultsPage({
  params,
}: PageProps<'/comparisons/[publicId]/results'>) {
  const { publicId: rawPublicId } = await params;
  const parsed = PublicIdSchema.safeParse(rawPublicId);

  if (!parsed.success) {
    notFound();
  }

  const publicId = parsed.data;
  const open = await loadOpenComparison(publicId);

  if (open === null) {
    return null;
  }

  const comparison = open.comparison;
  const ranked = rankEntries(comparison.criteria, comparison.entries);
  const infoColumns = resultsInfoColumns(comparison.criteria);
  const rows = buildResultsRows(comparison, ranked, infoColumns);
  const keyCriterion = comparison.criteria.find(
    (criterion) => criterion.is_key,
  );
  const t = await getTranslations();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="min-w-0 text-sm text-muted-foreground">
          {t('pages.resultsBlurb')}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <ComparisonViewModeToggle />
        </div>
      </div>
      <ResultsConfigAlert
        publicId={publicId}
        criteria={comparison.criteria}
        entries={comparison.entries}
      />
      <ResultsView
        keyCriterionName={keyCriterion?.name ?? t('common.entry')}
        infoColumns={infoColumns}
        rows={rows}
      />
    </div>
  );
}
