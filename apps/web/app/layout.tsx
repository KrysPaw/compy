import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { Analytics } from '@vercel/analytics/next';
import { getLocale, getTranslations } from 'next-intl/server';
import './globals.css';
import { Noto_Sans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';

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
      )}
    >
      <body className={`min-h-full flex flex-col`}>
        <NextIntlClientProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
