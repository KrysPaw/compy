'use client';

import { useTranslations } from 'next-intl';
import {
  type Criterion,
  type EntryFieldValue,
} from '@/lib/create-entry';
import { EntryValueField } from '@/components/entries/entry-value-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function EditEntryDialog({
  entryId,
  open,
  fieldsCriteria,
  fields,
  error,
  isPending,
  onOpenChange,
  onFieldChange,
  onSave,
}: {
  entryId: number;
  open: boolean;
  fieldsCriteria: Criterion[];
  fields: Record<number, EntryFieldValue>;
  error?: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onFieldChange: (criterionId: number, value: EntryFieldValue) => void;
  onSave: () => void;
}) {
  const t = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('entryActions.editTitle')}</DialogTitle>
          <DialogDescription>
            {t('entryActions.editDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {fieldsCriteria.map((criterion) => (
            <EntryValueField
              key={criterion.id}
              criterion={criterion}
              idPrefix={`edit-entry-${entryId}`}
              value={
                fields[criterion.id] ??
                (criterion.type === 'boolean' ? false : '')
              }
              onChange={(value) => onFieldChange(criterion.id, value)}
            />
          ))}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" disabled={isPending} onClick={onSave}>
            {isPending ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
