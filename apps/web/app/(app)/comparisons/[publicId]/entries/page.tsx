import { notFound } from 'next/navigation';
import { PublicIdSchema } from '@compy/shared';
import { getTranslations } from 'next-intl/server';
import { ComparisonDataTable } from '@/components/comparison-data-table';
import { CreateEntryDialog } from '@/components/create-entry-dialog';
import { getComparisonByPublicId } from '@/lib/api';

export default async function EntriesPage({
  params,
}: PageProps<'/comparisons/[publicId]/entries'>) {
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
        <p className="text-sm text-muted-foreground">{t('entriesBlurb')}</p>
        <CreateEntryDialog
          publicId={publicId}
          criteria={comparison.criteria}
        />
      </div>
      <ComparisonDataTable
        publicId={publicId}
        criteria={comparison.criteria}
        entries={comparison.entries}
      />
    </div>
  );
}
