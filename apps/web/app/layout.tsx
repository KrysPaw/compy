import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import './globals.css';
import { Noto_Sans, Playfair_Display } from 'next/font/google';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';

const playfairDisplayHeading = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-heading',
});

const notoSans = Noto_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: 'Compy',
    description: t('description'),
  };
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={cn(
        'h-full antialiased',
        'font-sans',
        notoSans.variable,
        playfairDisplayHeading.variable,
      )}
    >
      <body className={`min-h-full flex flex-col`}>
        <NextIntlClientProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
