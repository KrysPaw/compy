import { notFound } from 'next/navigation';
import { CriteriaDataTable } from '@/components/criteria-data-table';
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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <CriteriaDataTable criteria={comparison.criteria} />
    </div>
  );
}
