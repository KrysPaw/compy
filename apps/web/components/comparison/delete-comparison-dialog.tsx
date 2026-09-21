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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DeleteComparisonDialog({
  comparisonName,
  open,
  confirmationName,
  error,
  isPending,
  onOpenChange,
  onConfirmationChange,
  onDelete,
}: {
  comparisonName: string;
  open: boolean;
  confirmationName: string;
  error?: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmationChange: (value: string) => void;
  onDelete: () => void;
}) {
  const t = useTranslations();
  const isNameConfirmed = confirmationName === comparisonName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('comparisonActions.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t.rich('comparisonActions.deleteDescription', {
              comparisonName,
              name: (chunks) => (
                <span className="font-mono font-semibold text-foreground">
                  {chunks}
                </span>
              ),
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="delete-comparison-name">
            {t('comparisonActions.nameLabel')}
          </Label>
          <Input
            id="delete-comparison-name"
            value={confirmationName}
            onChange={(event) => onConfirmationChange(event.target.value)}
            autoComplete="off"
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={!isNameConfirmed || isPending}
            onClick={onDelete}
          >
            {isPending ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
