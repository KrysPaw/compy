'use client';

import { useState, useTransition, type ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { requestMagicLink } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type SignInDialogProps = {
  trigger?: ReactNode;
};

export function SignInDialog({ trigger }: SignInDialogProps) {
  const t = useTranslations('auth');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [devMagicLinkUrl, setDevMagicLinkUrl] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await requestMagicLink(formData);

      if (result.error !== undefined) {
        setError(result.error);
        setSent(false);
        return;
      }

      setError(undefined);
      setSent(true);
      setDevMagicLinkUrl(result.devMagicLinkUrl);
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(undefined);
      setSent(false);
      setDevMagicLinkUrl(undefined);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">{t('signIn')}</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Button asChild variant="outline">
            <Link href="/auth/google">{t('continueWithGoogle')}</Link>
          </Button>

          <div className="relative text-center text-xs text-muted-foreground">
            <span className="bg-background px-2">{t('or')}</span>
          </div>

          {sent ? (
            <div className="flex flex-col gap-2 text-sm">
              <p>{t('magicLinkSent')}</p>
              {devMagicLinkUrl !== undefined ? (
                <p className="break-all text-muted-foreground">
                  {t('devLink')}:{' '}
                  <a className="underline" href={devMagicLinkUrl}>
                    {devMagicLinkUrl}
                  </a>
                </p>
              ) : null}
            </div>
          ) : (
            <form action={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sign-in-email">{t('email')}</Label>
                <Input
                  id="sign-in-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder={t('emailPlaceholder')}
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? t('sending') : t('emailMeALink')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
