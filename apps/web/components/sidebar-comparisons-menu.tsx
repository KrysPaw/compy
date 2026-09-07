'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComparisonResponse } from '@compy/shared';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function SidebarComparisonsMenu({
  comparisons,
}: {
  comparisons: ComparisonResponse[];
}) {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {comparisons.map((comparison) => (
        <SidebarMenuItem key={comparison.id}>
          <SidebarMenuButton
            asChild
            isActive={pathname === `/comparisons/${comparison.id}`}
          >
            <Link href={`/comparisons/${comparison.id}`}>
              {comparison.name}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
