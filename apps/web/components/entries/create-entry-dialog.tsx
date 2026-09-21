'use client';

import { useRef, useState, useTransition } from 'react';
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
import { EntryValueField } from '@/components/entries/entry-value-field';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function CreateEntryDialog({
  publicId,
  criteria,
}: {
  publicId: string;
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
  const [addNext, setAddNext] = useState(false);
  const addNextRef = useRef(addNext);
  addNextRef.current = addNext;

  function reset() {
    setFields(initialEntryFields(fieldsCriteria));
    setError(undefined);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
      setAddNext(false);
    }
  }

  function handleSubmit() {
    const payload = buildCreateEntryValues(fieldsCriteria, fields);

    if ('error' in payload) {
      setError(entryValidationText(t, payload.error));
      return;
    }

    startTransition(async () => {
      const result = await createEntry(publicId, payload);

      if (result.entryId === undefined) {
        setError(result.error);
        return;
      }

      if (addNextRef.current) {
        reset();
        router.refresh();
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
        <form
          action={handleSubmit}
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
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
            <div className="flex items-center gap-2">
              <Switch
                id="entry-add-next"
                checked={addNext}
                onCheckedChange={setAddNext}
              />
              <Label htmlFor="entry-add-next">{t('common.addNext')}</Label>
              <Button type="submit" disabled={isPending}>
                {isPending ? t('common.creating') : t('common.create')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
