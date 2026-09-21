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

export function RenameComparisonDialog({
  publicId,
  open,
  name,
  error,
  isPending,
  onOpenChange,
  onNameChange,
  onSave,
}: {
  publicId: string;
  open: boolean;
  name: string;
  error?: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
}) {
  const t = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('comparisonActions.renameTitle')}</DialogTitle>
          <DialogDescription>
            {t('comparisonActions.renameDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`rename-comparison-${publicId}`}>
            {t('common.name')}
          </Label>
          <Input
            id={`rename-comparison-${publicId}`}
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            maxLength={200}
            autoComplete="off"
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            type="button"
            disabled={isPending || name.trim().length === 0}
            onClick={onSave}
          >
            {isPending ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
