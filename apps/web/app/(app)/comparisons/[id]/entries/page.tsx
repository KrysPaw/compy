import { notFound } from 'next/navigation';
import { ComparisonDataTable } from '@/components/comparison-data-table';
import { CreateEntryDialog } from '@/components/create-entry-dialog';
import { getComparisonById } from '@/lib/api';

export default async function EntriesPage({
  params,
}: PageProps<'/comparisons/[id]/entries'>) {
  const { id } = await params;
  const comparisonId = Number(id);

  if (!Number.isInteger(comparisonId) || comparisonId <= 0) {
    notFound();
  }

  const comparison = await getComparisonById(comparisonId);

  if (comparison === null) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Entries are the items you compare against your criteria.
        </p>
        <CreateEntryDialog
          comparisonId={comparisonId}
          criteria={comparison.criteria}
        />
      </div>
      <ComparisonDataTable
        comparisonId={comparisonId}
        criteria={comparison.criteria}
        entries={comparison.entries}
      />
    </div>
  );
}
