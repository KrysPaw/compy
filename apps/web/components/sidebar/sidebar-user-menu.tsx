'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { CheckIcon, ChevronUpIcon, InfoIcon, LanguagesIcon, LogOutIcon, Trash2Icon } from 'lucide-react';
import {
  localeCookieSetter,
  locales,
  type Locale,
} from '@/i18n/config';
import { AboutDialog } from '@/components/about/about-dialog';
import { DeleteAccountDialog } from '@/components/sidebar/delete-account-dialog';
import { logout } from '@/lib/actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

type SidebarUserMenuProps = {
  kind: 'guest' | 'registered';
  displayName?: string | null;
};

type ActiveDialog = 'about' | 'deleteAccount' | null;

export function SidebarUserMenu({ kind, displayName }: SidebarUserMenuProps) {
  const tSidebar = useTranslations('sidebar');
  const tAuth = useTranslations('auth');
  const tLanguage = useTranslations('languageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  const label =
    kind === 'registered' && displayName
      ? displayName
      : kind === 'registered'
        ? tSidebar('account')
        : tSidebar('guest');

  function selectLocale(next: Locale) {
    if (next === locale) {
      return;
    }

    document.cookie = localeCookieSetter(next);
    router.refresh();
  }

  function handleDialogOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setActiveDialog(null);
    }
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton tooltip={label}>
                <span className="truncate">{label}</span>
                <ChevronUpIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
              side="top"
              align="start"
            >
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <LanguagesIcon />
                  {tSidebar('language')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {locales.map((code) => (
                    <DropdownMenuItem
                      key={code}
                      onSelect={() => selectLocale(code)}
                    >
                      <span className="flex size-4 shrink-0 items-center justify-center text-[10px] font-semibold">
                        {code.toUpperCase()}
                      </span>
                      {tLanguage(code)}
                      {locale === code ? (
                        <CheckIcon className="ml-auto" />
                      ) : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuItem onSelect={() => setActiveDialog('about')}>
                <InfoIcon />
                {tSidebar('about')}
              </DropdownMenuItem>

              {kind === 'registered' ? (
                <>
                  <DropdownMenuItem
                    onSelect={() => {
                      void logout();
                    }}
                  >
                    <LogOutIcon />
                    {tAuth('logout')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setActiveDialog('deleteAccount')}
                  >
                    <Trash2Icon />
                    {tAuth('deleteAccount')}
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AboutDialog
        open={activeDialog === 'about'}
        onOpenChange={handleDialogOpenChange}
      />
      <DeleteAccountDialog
        open={activeDialog === 'deleteAccount'}
        onOpenChange={handleDialogOpenChange}
      />
    </>
  );
}
