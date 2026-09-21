import { notFound } from 'next/navigation';
import { PublicIdSchema } from '@compy/shared';
import { getTranslations } from 'next-intl/server';
import { ComparisonViewModeToggle } from '@/components/comparison/comparison-view-mode-toggle';
import { CreateEntryDialog } from '@/components/entries/create-entry-dialog';
import { EntriesView } from '@/components/entries/entries-view';
import { loadOpenComparison } from '@/lib/load-comparison';

export default async function EntriesPage({
  params,
}: PageProps<'/comparisons/[publicId]/entries'>) {
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="min-w-0 text-sm text-muted-foreground">{t('entriesBlurb')}</p>
        <div className="flex shrink-0 items-center gap-2">
          <ComparisonViewModeToggle />
          <CreateEntryDialog
            publicId={publicId}
            criteria={open.comparison.criteria}
          />
        </div>
      </div>
      <EntriesView
        publicId={publicId}
        criteria={open.comparison.criteria}
        entries={open.comparison.entries}
      />
    </div>
  );
}
