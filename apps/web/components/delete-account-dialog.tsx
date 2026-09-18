'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { deleteAccount } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type DeleteAccountDialogProps = {
  displayName: string | null | undefined;
};

export function DeleteAccountDialog({ displayName }: DeleteAccountDialogProps) {
  const t = useTranslations('auth');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAccount();

      if (result?.error !== undefined) {
        setError(result.error);
      }
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(undefined);
    }
  }

  return (
    <div className="flex flex-col gap-1 px-2">
      {displayName ? (
        <p className="text-xs text-muted-foreground">{displayName}</p>
      ) : null}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-auto justify-start px-0 text-xs text-destructive">
            {t('deleteAccount')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteAccountTitle')}</DialogTitle>
            <DialogDescription>{t('deleteAccountDescription')}</DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? t('deletingAccount') : t('confirmDeleteAccount')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
