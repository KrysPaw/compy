import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { RulesDataTable } from '@/components/rules-data-table';
import { WeightQuestionnaireDialog } from '@/components/weight-questionnaire-dialog';
import { getComparisonById } from '@/lib/api';

export default async function RulesPage({
  params,
}: PageProps<'/comparisons/[id]/rules'>) {
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
        <p className="text-sm text-muted-foreground">{t('rulesBlurb')}</p>
        <WeightQuestionnaireDialog
          comparisonId={comparison.id}
          criteria={comparison.criteria}
        />
      </div>
      <RulesDataTable
        comparisonId={comparison.id}
        criteria={comparison.criteria}
      />
    </div>
  );
}
