'use client';

import {
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from 'cn';
import { ComparisonTabs } from '@/components/comparison/comparison-tabs';
import {
  comparisonTabFromPathname,
  type ComparisonTab,
} from '@/components/comparison/comparison-tab';

export function ComparisonTabShell({
  publicId,
  header,
  children,
}: {
  publicId: string;
  header: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const committedTab = comparisonTabFromPathname(pathname);
  const [targetTab, setTargetTab] = useState<ComparisonTab | null>(null);
  const [isTransitionPending, startTransition] = useTransition();
  const displayTab = targetTab ?? committedTab;
  // Dim from click until Next finishes the transition and the URL matches.
  // Pathname alone can update before RSC children, which broke display≠committed.
  const isPending = targetTab !== null;

  useEffect(() => {
    if (
      targetTab !== null &&
      !isTransitionPending &&
      committedTab === targetTab
    ) {
      setTargetTab(null);
    }
  }, [targetTab, isTransitionPending, committedTab]);

  function onNavigate(tab: ComparisonTab, href: string) {
    if (tab === displayTab) {
      return;
    }
    setTargetTab(tab);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <>
      <header className="shrink-0 border-b">
        {header}
        <div className="px-4 pb-2">
          <ComparisonTabs
            publicId={publicId}
            activeTab={displayTab}
            onNavigate={onNavigate}
          />
        </div>
      </header>
      <div
        data-pending={isPending ? '' : undefined}
        aria-busy={isPending}
        className={cn(
          'flex min-h-0 flex-1 flex-col transition-opacity',
          isPending && 'pointer-events-none opacity-50',
        )}
      >
        {children}
      </div>
    </>
  );
}
