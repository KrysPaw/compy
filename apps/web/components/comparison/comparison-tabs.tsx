'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  comparisonTabHref,
  type ComparisonTab,
} from '@/components/comparison/comparison-tab';

const TAB_ORDER: ComparisonTab[] = [
  'criteria',
  'entries',
  'rules',
  'results',
];

export function ComparisonTabs({
  publicId,
  activeTab,
  onNavigate,
}: {
  publicId: string;
  activeTab: ComparisonTab;
  onNavigate: (tab: ComparisonTab, href: string) => void;
}) {
  const t = useTranslations('tabs');
  const triggerClassName =
    'min-w-0 px-1 tracking-wide sm:px-4 sm:tracking-wider';

  return (
    <Tabs value={activeTab} className="min-w-0 w-full">
      <TabsList variant="line" className="grid w-full grid-cols-4 gap-0">
        {TAB_ORDER.map((tab) => {
          const href = comparisonTabHref(publicId, tab);
          return (
            <TabsTrigger
              key={tab}
              value={tab}
              asChild
              className={triggerClassName}
            >
              <Link
                href={href}
                onClick={(event) => {
                  if (
                    event.defaultPrevented ||
                    event.button !== 0 ||
                    event.metaKey ||
                    event.altKey ||
                    event.ctrlKey ||
                    event.shiftKey
                  ) {
                    return;
                  }
                  event.preventDefault();
                  onNavigate(tab, href);
                }}
              >
                {t(tab)}
              </Link>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
