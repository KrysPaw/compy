import * as React from 'react';
import { getTranslations } from 'next-intl/server';
import { SidebarLogo } from '@/components/sidebar-logo';
import { SidebarComparisonsMenu } from '@/components/sidebar-comparisons-menu';
import { CreateComparisonDialog } from '@/components/create-comparison-dialog';
import { DeleteAccountDialog } from '@/components/delete-account-dialog';
import { LanguageSwitcher } from '@/components/language-switcher';
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
            <SidebarComparisonsMenu comparisons={comparisons} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {principal?.kind === 'registered' ? (
          <DeleteAccountDialog displayName={principal.displayName} />
        ) : null}
        <LanguageSwitcher />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
