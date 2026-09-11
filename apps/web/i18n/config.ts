export const locales = ['en', 'pl'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeCookieName = 'locale';

/** About one year, in seconds. */
export const localeCookieMaxAge = 60 * 60 * 24 * 365;

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'en' || value === 'pl';
}

export function localeCookieSetter(locale: Locale): string {
  return `${localeCookieName}=${locale}; path=/; max-age=${localeCookieMaxAge}; SameSite=Lax`;
}

/** Highest-quality tag that we support; Polish wins only when it outranks English. */
export function localeFromAcceptLanguage(
  header: string | null | undefined,
): Locale {
  if (!header) {
    return defaultLocale;
  }

  const parsed = header.split(',').map((part) => {
    const [tagPart, ...params] = part.trim().split(';');
    const tag = tagPart.trim().toLowerCase();
    const qParam = params.find((param) => param.trim().startsWith('q='));
    const quality = qParam ? Number(qParam.trim().slice(2)) : 1;
    return {
      tag,
      quality: Number.isFinite(quality) ? quality : 0,
    };
  });

  parsed.sort((left, right) => right.quality - left.quality);

  for (const { tag, quality } of parsed) {
    if (quality <= 0) {
      continue;
    }

    const base = tag.split('-')[0];
    if (base === 'pl') {
      return 'pl';
    }
    if (base === 'en') {
      return 'en';
    }
  }

  return defaultLocale;
}

export function resolveLocale(
  cookieValue: string | undefined,
  acceptLanguage: string | null | undefined,
): Locale {
  if (isLocale(cookieValue)) {
    return cookieValue;
  }

  return localeFromAcceptLanguage(acceptLanguage);
}
