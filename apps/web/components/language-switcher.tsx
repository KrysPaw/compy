'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  localeCookieSetter,
  locales,
  type Locale,
} from '@/i18n/config';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function LanguageSwitcher() {
  const t = useTranslations('languageSwitcher');
  const locale = useLocale();
  const router = useRouter();

  function select(next: Locale) {
    if (next === locale) {
      return;
    }

    document.cookie = localeCookieSetter(next);
    router.refresh();
  }

  return (
    <SidebarMenu>
      {locales.map((code) => (
        <SidebarMenuItem key={code}>
          <SidebarMenuButton
            isActive={locale === code}
            tooltip={t(code)}
            onClick={() => select(code)}
          >
            <span className="flex size-4 shrink-0 items-center justify-center text-[10px] font-semibold">
              {code.toUpperCase()}
            </span>
            <span>{t(code)}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
