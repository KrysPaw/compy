'use client';

import { useTranslations } from 'next-intl';
import { LogInIcon } from 'lucide-react';
import { SignInDialog } from '@/components/sidebar/sign-in-dialog';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function SidebarSignInButton() {
  const t = useTranslations('auth');

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SignInDialog
          trigger={
            <SidebarMenuButton tooltip={t('signIn')}>
              <LogInIcon />
              <span>{t('signIn')}</span>
            </SidebarMenuButton>
          }
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
