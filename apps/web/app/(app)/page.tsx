import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PlusIcon } from 'lucide-react';
import { CreateComparisonDialog } from '@/components/comparison/create-comparison-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { getComparisons } from '@/lib/api';

export default async function Home() {
  const comparisons = await getComparisons();

  if (comparisons.length > 0) {
    redirect(`/comparisons/${comparisons[0].publicId}`);
  }

  const t = await getTranslations('home');

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <div>{t('title')}</div>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="flex max-w-md flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('emptyTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('emptyDescription')}
          </p>
        </div>
        <CreateComparisonDialog
          trigger={
            <Button>
              <PlusIcon />
              {t('createCta')}
            </Button>
          }
        />
      </div>
    </>
  );
}
