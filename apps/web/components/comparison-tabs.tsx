'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ComparisonTabs({ comparisonId }: { comparisonId: number }) {
  const pathname = usePathname();
  const entriesPath = `/comparisons/${comparisonId}/entries`;
  const criteriaPath = `/comparisons/${comparisonId}/criteria`;
  const rulesPath = `/comparisons/${comparisonId}/rules`;

  let activeTab: 'rules' | 'criteria' | 'entries';

  if (pathname.endsWith('/rules')) {
    activeTab = 'rules';
  } else if (pathname.endsWith('/criteria')) {
    activeTab = 'criteria';
  } else {
    activeTab = 'entries';
  }

  return (
    <Tabs value={activeTab} className="absolute left-1/2 -translate-x-1/2">
      <TabsList variant="line">
        <TabsTrigger value="criteria" asChild>
          <Link href={criteriaPath}>Criteria</Link>
        </TabsTrigger>
        <TabsTrigger value="entries" asChild>
          <Link href={entriesPath}>Entries</Link>
        </TabsTrigger>
        <TabsTrigger value="rules" asChild>
          <Link href={rulesPath}>Rules</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
