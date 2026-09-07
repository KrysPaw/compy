import { notFound } from 'next/navigation';
import { ComparisonDataTable } from '@/components/comparison-data-table';
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
      <ComparisonDataTable
        criteria={comparison.criteria}
        entries={comparison.entries}
      />
    </div>
  );
}
