'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon } from 'lucide-react';
import { createEntry } from '@/lib/actions';
import {
  buildCreateEntryValues,
  enumOptionsOf,
  initialEntryFields,
  orderedCriteria,
  ratingBoundsOf,
  type Criterion,
  type EntryFieldValue,
} from '@/lib/create-entry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function fieldId(criterion: Criterion) {
  return `entry-field-${criterion.id}`;
}

function EntryValueField({
  criterion,
  value,
  onChange,
}: {
  criterion: Criterion;
  value: EntryFieldValue;
  onChange: (value: EntryFieldValue) => void;
}) {
  const type = criterion.type;
  const id = fieldId(criterion);
  const required = criterion.is_key;

  if (type === 'boolean') {
    return (
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{criterion.name}</Label>
        <Switch id={id} checked={value === true} onCheckedChange={onChange} />
      </div>
    );
  }

  if (type === 'enum') {
    const options = enumOptionsOf(criterion);
    const selected = typeof value === 'string' ? value : '';

    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>{criterion.name}</Label>
        <Select value={selected || undefined} onValueChange={onChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  const textValue = typeof value === 'string' ? value : '';

  if (type === 'number' || type === 'rating') {
    const bounds = type === 'rating' ? ratingBoundsOf(criterion) : {};

    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>{criterion.name}</Label>
        <Input
          id={id}
          type="number"
          step="any"
          min={bounds.min}
          max={bounds.max}
          value={textValue}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{criterion.name}</Label>
      <Input
        id={id}
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        placeholder={required ? 'Pixel 8' : undefined}
        required={required}
        maxLength={200}
        autoFocus={required}
      />
    </div>
  );
}

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
