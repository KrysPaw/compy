import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

type AuthErrorPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const params = await searchParams;
  const t = await getTranslations('auth');

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold">{t('errorTitle')}</h1>
      <p className="text-sm text-muted-foreground">
        {params.reason === 'oauth_unavailable'
          ? t('oauthUnavailable')
          : t('errorBody')}
      </p>
      <Button asChild>
        <Link href="/">{t('backHome')}</Link>
      </Button>
    </main>
  );
}
