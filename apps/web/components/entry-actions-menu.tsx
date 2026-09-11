'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EllipsisIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { deleteEntry, updateEntry } from '@/lib/actions';
import {
  buildCreateEntryValues,
  clearedCriterionIds,
  entryValidationText,
  fieldsFromEntryValues,
  orderedCriteria,
  type Criterion,
  type EntryFieldValue,
} from '@/lib/create-entry';
import { EntryValueField } from '@/components/entry-value-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type EntryValue = {
  criterionId: number;
  value: unknown;
};

type EntryActionsMenuProps = {
  comparisonId: number;
  entryId: number;
  entryLabel: string;
  criteria: Criterion[];
  entryValues: EntryValue[];
};

type ActiveDialog = 'edit' | 'delete' | null;

export function EntryActionsMenu({
  comparisonId,
  entryId,
  entryLabel,
  criteria,
  entryValues,
}: EntryActionsMenuProps) {
  const router = useRouter();
  const t = useTranslations();
  const fieldsCriteria = orderedCriteria(criteria);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [fields, setFields] = useState<Record<number, EntryFieldValue>>(() =>
    fieldsFromEntryValues(fieldsCriteria, entryValues),
  );
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function closeDialog() {
    setActiveDialog(null);
    setFields(fieldsFromEntryValues(fieldsCriteria, entryValues));
    setError(undefined);
  }

  function handleDialogOpenChange(isOpen: boolean) {
    if (!isOpen) {
      closeDialog();
    }
  }

  function openEdit() {
    setFields(fieldsFromEntryValues(fieldsCriteria, entryValues));
    setError(undefined);
    setActiveDialog('edit');
  }

  function handleSave() {
    const payload = buildCreateEntryValues(fieldsCriteria, fields);

    if ('error' in payload) {
      setError(entryValidationText(t, payload.error));
      return;
    }

    const clearIds = clearedCriterionIds(
      fieldsCriteria,
      entryValues,
      payload.values,
    );

    startTransition(async () => {
      const result = await updateEntry(
        comparisonId,
        entryId,
        payload,
        clearIds,
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      closeDialog();
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteEntry(comparisonId, entryId);

      if (result.error) {
        setError(result.error);
        return;
      }

      closeDialog();
      router.refresh();
    });
  }

  const label = entryLabel || t('common.entry');

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('entryActions.menuLabel', { name: label })}
          >
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={openEdit}>
            <PencilIcon />
            {t('common.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setActiveDialog('delete')}
          >
            <Trash2Icon />
            {t('common.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={activeDialog === 'edit'}
        onOpenChange={handleDialogOpenChange}
      >
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
                onChange={(value) =>
                  setFields((prev) => ({ ...prev, [criterion.id]: value }))
                }
              />
            ))}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" disabled={isPending} onClick={handleSave}>
              {isPending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={activeDialog === 'delete'}
        onOpenChange={handleDialogOpenChange}
      >
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
              onClick={handleDelete}
            >
              {isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
