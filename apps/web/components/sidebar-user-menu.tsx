'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { CheckIcon, ChevronUpIcon, LanguagesIcon, LogInIcon, Trash2Icon } from 'lucide-react';
import {
  localeCookieSetter,
  locales,
  type Locale,
} from '@/i18n/config';
import { DeleteAccountDialog } from '@/components/delete-account-dialog';
import { SignInDialog } from '@/components/sign-in-dialog';
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

type ActiveDialog = 'signIn' | 'deleteAccount' | null;

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

              {kind === 'guest' ? (
                <DropdownMenuItem onSelect={() => setActiveDialog('signIn')}>
                  <LogInIcon />
                  {tAuth('signIn')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setActiveDialog('deleteAccount')}
                >
                  <Trash2Icon />
                  {tAuth('deleteAccount')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SignInDialog
        open={activeDialog === 'signIn'}
        onOpenChange={handleDialogOpenChange}
      />
      <DeleteAccountDialog
        open={activeDialog === 'deleteAccount'}
        onOpenChange={handleDialogOpenChange}
      />
    </>
  );
}
