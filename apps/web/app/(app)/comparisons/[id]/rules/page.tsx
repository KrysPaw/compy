import { notFound } from 'next/navigation';
import { RulesDataTable } from '@/components/rules-data-table';
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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <p className="text-sm text-muted-foreground">
        Rules define how comparable criteria affect ranking and how much each
        counts.
      </p>
      <RulesDataTable
        comparisonId={comparison.id}
        criteria={comparison.criteria}
      />
    </div>
  );
}
