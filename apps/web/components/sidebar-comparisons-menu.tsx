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
            isActive={pathname.startsWith(`/comparisons/${comparison.publicId}`)}
          >
            <Link href={`/comparisons/${comparison.publicId}`}>
              {comparison.name}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
