'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ComparisonTabs({ publicId }: { publicId: string }) {
  const t = useTranslations('tabs');
  const pathname = usePathname();
  const entriesPath = `/comparisons/${publicId}/entries`;
  const criteriaPath = `/comparisons/${publicId}/criteria`;
  const rulesPath = `/comparisons/${publicId}/rules`;
  const resultsPath = `/comparisons/${publicId}/results`;

  let activeTab: 'rules' | 'criteria' | 'entries' | 'results';

  if (pathname.endsWith('/rules')) {
    activeTab = 'rules';
  } else if (pathname.endsWith('/criteria')) {
    activeTab = 'criteria';
  } else if (pathname.endsWith('/results')) {
    activeTab = 'results';
  } else {
    activeTab = 'entries';
  }

  const triggerClassName =
    'min-w-0 px-1 tracking-wide sm:px-4 sm:tracking-wider';

  return (
    <Tabs value={activeTab} className="min-w-0 w-full">
      <TabsList variant="line" className="grid w-full grid-cols-4 gap-0">
        <TabsTrigger value="criteria" asChild className={triggerClassName}>
          <Link href={criteriaPath}>{t('criteria')}</Link>
        </TabsTrigger>
        <TabsTrigger value="entries" asChild className={triggerClassName}>
          <Link href={entriesPath}>{t('entries')}</Link>
        </TabsTrigger>
        <TabsTrigger value="rules" asChild className={triggerClassName}>
          <Link href={rulesPath}>{t('rules')}</Link>
        </TabsTrigger>
        <TabsTrigger value="results" asChild className={triggerClassName}>
          <Link href={resultsPath}>{t('results')}</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
