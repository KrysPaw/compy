'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';

export function ShareInviteSection({
  publicId,
  email,
  inviteOk,
  isPending,
  onEmailChange,
  onInvite,
}: {
  publicId: string;
  email: string;
  inviteOk: boolean;
  isPending: boolean;
  onEmailChange: (email: string) => void;
  onInvite: () => void;
}) {
  const t = useTranslations('sharing');

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`invite-email-${publicId}`}>{t('inviteEmail')}</Label>
      <Input
        id={`invite-email-${publicId}`}
        type="email"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder={t('inviteEmailPlaceholder')}
        autoComplete="email"
      />
      <DialogFooter className="sm:justify-start">
        <Button
          type="button"
          disabled={isPending || email.trim().length === 0}
          onClick={onInvite}
        >
          {isPending ? t('inviting') : t('invite')}
        </Button>
      </DialogFooter>
      {inviteOk ? (
        <p className="text-sm text-muted-foreground">{t('inviteSent')}</p>
      ) : null}
    </div>
  );
}
