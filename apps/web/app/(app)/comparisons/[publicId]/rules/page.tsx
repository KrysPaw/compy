import { notFound } from 'next/navigation';
import { PublicIdSchema } from '@compy/shared';
import { getTranslations } from 'next-intl/server';
import { RulesDataTable } from '@/components/rules-data-table';
import { WeightQuestionnaireDialog } from '@/components/weight-questionnaire-dialog';
import { getComparisonByPublicId } from '@/lib/api';

export default async function RulesPage({
  params,
}: PageProps<'/comparisons/[publicId]/rules'>) {
  const { publicId: rawPublicId } = await params;
  const parsed = PublicIdSchema.safeParse(rawPublicId);

  if (!parsed.success) {
    notFound();
  }

  const publicId = parsed.data;
  const comparison = await getComparisonByPublicId(publicId);

  if (comparison === null) {
    notFound();
  }

  const t = await getTranslations('pages');

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{t('rulesBlurb')}</p>
        <WeightQuestionnaireDialog
          publicId={publicId}
          criteria={comparison.criteria}
        />
      </div>
      <RulesDataTable
        publicId={publicId}
        criteria={comparison.criteria}
      />
    </div>
  );
}
