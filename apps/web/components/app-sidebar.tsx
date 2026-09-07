import * as React from 'react';
import { SidebarLogo } from '@/components/sidebar-logo';
import { SidebarComparisonsMenu } from '@/components/sidebar-comparisons-menu';
import { getComparisons } from '@/lib/api';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const comparisons = await getComparisons();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>My Comparisons</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarComparisonsMenu comparisons={comparisons} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
