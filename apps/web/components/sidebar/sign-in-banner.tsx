import { getTranslations } from 'next-intl/server';
import { SignInDialog } from '@/components/sidebar/sign-in-dialog';
import { Button } from '@/components/ui/button';
import { getCurrentPrincipal } from '@/lib/api';

export async function SignInBanner() {
  const principal = await getCurrentPrincipal();

  if (principal === null || principal.kind !== 'guest') {
    return null;
  }

  const t = await getTranslations('auth');

  return (
    <div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-2 text-sm">
      <p className="text-muted-foreground">{t('guestBanner')}</p>
      <SignInDialog
        trigger={
          <Button size="sm" variant="outline">
            {t('signIn')}
          </Button>
        }
      />
    </div>
  );
}
