export type MagicLinkMailLocale = 'en' | 'pl';

export type MagicLinkMailCopy = {
  subject: string;
  text: string;
};

const catalogs: Record<
  MagicLinkMailLocale,
  { subject: string; text: (url: string) => string }
> = {
  en: {
    subject: 'Sign in to Compy',
    text: (url) =>
      `Open this link to sign in to Compy (expires in 15 minutes):\n\n${url}\n`,
  },
  pl: {
    subject: 'Zaloguj się do Compy',
    text: (url) =>
      `Otwórz ten link, aby zalogować się do Compy (wygasa za 15 minut):\n\n${url}\n`,
  },
};

export function magicLinkMailCopy(
  locale: MagicLinkMailLocale,
  magicLinkUrl: string,
): MagicLinkMailCopy {
  const catalog = catalogs[locale] ?? catalogs.en;
  return {
    subject: catalog.subject,
    text: catalog.text(magicLinkUrl),
  };
}
