import { notFound } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ComparisonActionsMenu } from '@/components/comparison-actions-menu';
import { ComparisonTabs } from '@/components/comparison-tabs';
import { getComparisonById } from '@/lib/api';

export default async function ComparisonLayout({
  children,
  params,
}: LayoutProps<'/comparisons/[id]'>) {
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
    <>
      <header className="relative flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <div>{comparison.name}</div>
        <ComparisonTabs comparisonId={comparison.id} />
        <div className="ml-auto">
          <ComparisonActionsMenu
            comparisonId={comparison.id}
            comparisonName={comparison.name}
          />
        </div>
      </header>
      {children}
    </>
  );
}
