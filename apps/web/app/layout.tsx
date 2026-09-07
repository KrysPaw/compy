import type { Metadata } from 'next';
import './globals.css';
import { Noto_Sans, Playfair_Display } from 'next/font/google';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';

const playfairDisplayHeading = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading',
});

const notoSans = Noto_Sans({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Compy',
  description: 'Comparison app',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={cn(
        'h-full antialiased',
        'font-sans',
        notoSans.variable,
        playfairDisplayHeading.variable,
      )}
    >
      <body className={`min-h-full flex flex-col`}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
