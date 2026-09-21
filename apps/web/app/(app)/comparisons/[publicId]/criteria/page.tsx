import { notFound } from 'next/navigation';
import { PublicIdSchema } from '@compy/shared';
import { getTranslations } from 'next-intl/server';
import { CriteriaDataTable } from '@/components/criteria/criteria-data-table';
import { CreateCriterionDialog } from '@/components/criteria/create-criterion-dialog';
import { loadOpenComparison } from '@/lib/load-comparison';

export default async function CriteriaPage({
  params,
}: PageProps<'/comparisons/[publicId]/criteria'>) {
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

  const t = await getTranslations('pages');

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{t('criteriaBlurb')}</p>
        <CreateCriterionDialog publicId={publicId} />
      </div>
      <CriteriaDataTable
        publicId={publicId}
        criteria={open.comparison.criteria}
      />
    </div>
  );
}
