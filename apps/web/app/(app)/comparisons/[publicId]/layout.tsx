import { notFound } from 'next/navigation';
import { PublicIdSchema } from '@compy/shared';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ComparisonActionsMenu } from '@/components/comparison-actions-menu';
import { ComparisonTabs } from '@/components/comparison-tabs';
import { getComparisonByPublicId } from '@/lib/api';

export default async function ComparisonLayout({
  children,
  params,
}: LayoutProps<'/comparisons/[publicId]'>) {
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

  return (
    <>
      <header className="relative flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <div>{comparison.name}</div>
        <ComparisonTabs publicId={publicId} />
        <div className="ml-auto">
          <ComparisonActionsMenu
            publicId={publicId}
            comparisonName={comparison.name}
          />
        </div>
      </header>
      {children}
    </>
  );
}
