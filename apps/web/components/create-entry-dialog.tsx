'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon } from 'lucide-react';
import { createEntry } from '@/lib/actions';
import {
  buildCreateEntryValues,
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
      setError(payload.error);
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
          Add entry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New entry</DialogTitle>
          <DialogDescription>
            Name is required. Other criterion values can be filled in later.
          </DialogDescription>
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
              {isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
