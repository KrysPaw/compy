import * as React from 'react';
import { getTranslations } from 'next-intl/server';
import { SidebarLogo } from '@/components/sidebar/sidebar-logo';
import { SidebarComparisonsMenu } from '@/components/sidebar/sidebar-comparisons-menu';
import { CreateComparisonDialog } from '@/components/comparison/create-comparison-dialog';
import { SidebarSignInButton } from '@/components/sidebar/sidebar-sign-in-button';
import { SidebarUserMenu } from '@/components/sidebar/sidebar-user-menu';
import { getComparisons, getCurrentPrincipal } from '@/lib/api';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const t = await getTranslations('sidebar');
  const comparisons = await getComparisons();
  const principal = await getCurrentPrincipal();
  const ownedComparisons = comparisons.filter(
    (comparison) => comparison.role === 'owner',
  );
  const sharedComparisons = comparisons.filter(
    (comparison) => comparison.role === 'editor',
  );

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('myComparisons')}</SidebarGroupLabel>
          <CreateComparisonDialog />
          <SidebarGroupContent>
            <SidebarComparisonsMenu comparisons={ownedComparisons} />
          </SidebarGroupContent>
        </SidebarGroup>
        {sharedComparisons.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>{t('sharedComparisons')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarComparisonsMenu comparisons={sharedComparisons} />
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        {principal?.kind !== 'registered' ? <SidebarSignInButton /> : null}
        <SidebarUserMenu
          kind={principal?.kind === 'registered' ? 'registered' : 'guest'}
          displayName={
            principal?.kind === 'registered' ? principal.displayName : null
          }
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
