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
import { DeleteEntryDialog } from '@/components/entries/delete-entry-dialog';
import { EditEntryDialog } from '@/components/entries/edit-entry-dialog';
import { Button } from '@/components/ui/button';
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
  publicId: string;
  entryId: number;
  entryLabel: string;
  criteria: Criterion[];
  entryValues: EntryValue[];
};

type ActiveDialog = 'edit' | 'delete' | null;

export function EntryActionsMenu({
  publicId,
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
      const result = await updateEntry(publicId, entryId, payload, clearIds);

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
      const result = await deleteEntry(publicId, entryId);

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

      <EditEntryDialog
        entryId={entryId}
        open={activeDialog === 'edit'}
        fieldsCriteria={fieldsCriteria}
        fields={fields}
        error={error}
        isPending={isPending}
        onOpenChange={handleDialogOpenChange}
        onFieldChange={(criterionId, value) =>
          setFields((prev) => ({ ...prev, [criterionId]: value }))
        }
        onSave={handleSave}
      />

      <DeleteEntryDialog
        label={label}
        open={activeDialog === 'delete'}
        error={error}
        isPending={isPending}
        onOpenChange={handleDialogOpenChange}
        onDelete={handleDelete}
      />
    </>
  );
}
