'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function DeleteEntryDialog({
  label,
  open,
  error,
  isPending,
  onOpenChange,
  onDelete,
}: {
  label: string;
  open: boolean;
  error?: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}) {
  const t = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('entryActions.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t.rich('entryActions.deleteDescription', {
              label,
              name: (chunks) => (
                <span className="font-semibold text-foreground">{chunks}</span>
              ),
            })}
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={onDelete}
          >
            {isPending ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
