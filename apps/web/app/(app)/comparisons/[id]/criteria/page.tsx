import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CriteriaDataTable } from '@/components/criteria-data-table';
import { CreateCriterionDialog } from '@/components/create-criterion-dialog';
import { getComparisonById } from '@/lib/api';

export default async function CriteriaPage({
  params,
}: PageProps<'/comparisons/[id]/criteria'>) {
  const { id } = await params;
  const comparisonId = Number(id);

  if (!Number.isInteger(comparisonId) || comparisonId <= 0) {
    notFound();
  }

  const comparison = await getComparisonById(comparisonId);

  if (comparison === null) {
    notFound();
  }

  const t = await getTranslations('pages');

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{t('criteriaBlurb')}</p>
        <CreateCriterionDialog comparisonId={comparisonId} />
      </div>
      <CriteriaDataTable
        comparisonId={comparisonId}
        criteria={comparison.criteria}
      />
    </div>
  );
}
