'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PlusIcon } from 'lucide-react';
import { createEntry } from '@/lib/actions';
import {
  buildCreateEntryValues,
  entryValidationText,
  initialEntryFields,
  orderedCriteria,
  type Criterion,
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
  DialogTrigger,
} from '@/components/ui/dialog';

export function CreateEntryDialog({
  comparisonId,
  criteria,
}: {
  comparisonId: number;
  criteria: Criterion[];
}) {
  const router = useRouter();
  const t = useTranslations();
  const fieldsCriteria = orderedCriteria(criteria);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [fields, setFields] = useState(() =>
    initialEntryFields(fieldsCriteria),
  );

  function reset() {
    setFields(initialEntryFields(fieldsCriteria));
    setError(undefined);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
    }
  }

  function handleSubmit() {
    const payload = buildCreateEntryValues(fieldsCriteria, fields);

    if ('error' in payload) {
      setError(entryValidationText(t, payload.error));
      return;
    }

    startTransition(async () => {
      const result = await createEntry(comparisonId, payload);

      if (result.entryId === undefined) {
        setError(result.error);
        return;
      }

      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon />
          {t('createEntry.add')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('createEntry.title')}</DialogTitle>
          <DialogDescription>{t('createEntry.description')}</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          {fieldsCriteria.map((criterion) => (
            <EntryValueField
              key={criterion.id}
              criterion={criterion}
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
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.creating') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
