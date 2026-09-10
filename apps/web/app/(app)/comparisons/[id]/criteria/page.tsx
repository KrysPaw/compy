import { notFound } from 'next/navigation';
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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Criteria identify an entry or let you compare entries.
        </p>
        <CreateCriterionDialog comparisonId={comparisonId} />
      </div>
      <CriteriaDataTable
        comparisonId={comparisonId}
        criteria={comparison.criteria}
      />
    </div>
  );
}
