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
import { ShareInviteSection } from '@/components/comparison/share-invite-section';
import { SharePendingRequests } from '@/components/comparison/share-pending-requests';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
          <ShareInviteSection
            publicId={publicId}
            email={email}
            inviteOk={inviteOk}
            isPending={isPending}
            onEmailChange={setEmail}
            onInvite={handleInvite}
          />

          <SharePendingRequests
            pendingRequests={pendingRequests}
            isPending={isPending}
            onAccept={handleAccept}
            onReject={handleReject}
          />

          {error !== undefined ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
