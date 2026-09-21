'use client';

import { useTranslations } from 'next-intl';
import type { AccessRequestResponse } from '@compy/shared';
import { Button } from '@/components/ui/button';

export function SharePendingRequests({
  pendingRequests,
  isPending,
  onAccept,
  onReject,
}: {
  pendingRequests: AccessRequestResponse[];
  isPending: boolean;
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
}) {
  const t = useTranslations('sharing');

  return (
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
                  onClick={() => onAccept(request.id)}
                >
                  {t('accept')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => onReject(request.id)}
                >
                  {t('reject')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
