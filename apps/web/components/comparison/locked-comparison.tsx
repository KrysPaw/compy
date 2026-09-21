'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { applyForAccess } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LockedComparisonProps = {
  publicId: string;
};

export function LockedComparison({ publicId }: LockedComparisonProps) {
  const t = useTranslations('sharing');
  const [error, setError] = useState<string>();
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await applyForAccess(publicId, formData);

      if (result.error !== undefined) {
        setError(result.error);
        return;
      }

      setError(undefined);
      setSubmitted(true);
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t('lockedTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('lockedDescription')}</p>
      </div>

      {submitted ? (
        <p className="text-sm">{t('applySent')}</p>
      ) : (
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="access-display-name">{t('displayName')}</Label>
            <Input
              id="access-display-name"
              name="displayName"
              required
              maxLength={200}
              autoComplete="name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="access-message">{t('message')}</Label>
            <textarea
              id="access-message"
              name="message"
              maxLength={1000}
              rows={3}
              className="w-full min-w-0 border border-transparent border-b-input bg-transparent px-0 py-1 text-base outline-none placeholder:text-muted-foreground focus-visible:border-b-ring disabled:opacity-50 md:text-sm"
            />
          </div>
          {error !== undefined ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <Button type="submit" disabled={isPending}>
            {isPending ? t('applying') : t('apply')}
          </Button>
        </form>
      )}
    </div>
  );
}
