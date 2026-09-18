'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { AccessRequestResponse } from '@compy/shared';
import {
  acceptAccessRequest,
  inviteByEmail,
  rejectAccessRequest,
} from '@/lib/actions';
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
} from '@/components/ui/dialog';

type ShareComparisonDialogProps = {
  publicId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingRequests: AccessRequestResponse[];
};

export function ShareComparisonDialog({
  publicId,
  open,
  onOpenChange,
  pendingRequests,
}: ShareComparisonDialogProps) {
  const router = useRouter();
  const t = useTranslations('sharing');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [inviteOk, setInviteOk] = useState(false);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setEmail('');
    setError(undefined);
    setInviteOk(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
    }
    onOpenChange(next);
  }

  function handleInvite() {
    startTransition(async () => {
      const result = await inviteByEmail(publicId, email);

      if (result.error !== undefined) {
        setError(result.error);
        setInviteOk(false);
        return;
      }

      setError(undefined);
      setInviteOk(true);
      setEmail('');
      router.refresh();
    });
  }

  function handleAccept(requestId: number) {
    startTransition(async () => {
      const result = await acceptAccessRequest(publicId, requestId);
      if (result.error !== undefined) {
        setError(result.error);
        return;
      }
      setError(undefined);
      router.refresh();
    });
  }

  function handleReject(requestId: number) {
    startTransition(async () => {
      const result = await rejectAccessRequest(publicId, requestId);
      if (result.error !== undefined) {
        setError(result.error);
        return;
      }
      setError(undefined);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('shareTitle')}</DialogTitle>
          <DialogDescription>{t('shareDescription')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`invite-email-${publicId}`}>{t('inviteEmail')}</Label>
            <Input
              id={`invite-email-${publicId}`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('inviteEmailPlaceholder')}
              autoComplete="email"
            />
            <DialogFooter className="sm:justify-start">
              <Button
                type="button"
                disabled={isPending || email.trim().length === 0}
                onClick={handleInvite}
              >
                {isPending ? t('inviting') : t('invite')}
              </Button>
            </DialogFooter>
            {inviteOk ? (
              <p className="text-sm text-muted-foreground">{t('inviteSent')}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">{t('pendingRequests')}</h3>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noPendingRequests')}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {pendingRequests.map((request) => (
                  <li
                    key={request.id}
                    className="flex flex-col gap-2 border-b border-border pb-3 last:border-b-0"
                  >
                    <div className="text-sm">
                      <span className="font-medium">{request.displayName}</span>
                      {request.message !== null && request.message.length > 0 ? (
                        <p className="mt-1 text-muted-foreground">{request.message}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleAccept(request.id)}
                      >
                        {t('accept')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleReject(request.id)}
                      >
                        {t('reject')}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error !== undefined ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
