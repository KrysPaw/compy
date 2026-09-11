'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ComparisonTabs({ comparisonId }: { comparisonId: number }) {
  const t = useTranslations('tabs');
  const pathname = usePathname();
  const entriesPath = `/comparisons/${comparisonId}/entries`;
  const criteriaPath = `/comparisons/${comparisonId}/criteria`;
  const rulesPath = `/comparisons/${comparisonId}/rules`;
  const resultsPath = `/comparisons/${comparisonId}/results`;

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

  return (
    <Tabs value={activeTab} className="absolute left-1/2 -translate-x-1/2">
      <TabsList variant="line">
        <TabsTrigger value="criteria" asChild>
          <Link href={criteriaPath}>{t('criteria')}</Link>
        </TabsTrigger>
        <TabsTrigger value="entries" asChild>
          <Link href={entriesPath}>{t('entries')}</Link>
        </TabsTrigger>
        <TabsTrigger value="rules" asChild>
          <Link href={rulesPath}>{t('rules')}</Link>
        </TabsTrigger>
        <TabsTrigger value="results" asChild>
          <Link href={resultsPath}>{t('results')}</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
