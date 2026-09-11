import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { resolveLocale, type Locale } from './config';
import type en from '../messages/en.json';

const catalogs: Record<Locale, () => Promise<{ default: typeof en }>> = {
  en: () => import('../messages/en.json'),
  pl: () => import('../messages/pl.json'),
};

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = resolveLocale(
    cookieStore.get('locale')?.value,
    headerStore.get('accept-language'),
  );
  const messages = (await catalogs[locale]()).default;

  return { locale, messages };
});
