'use client';

import { useTranslations } from 'next-intl';
import type { Criterion, EntryFieldValue } from '@/lib/create-entry';
import { enumOptionsOf, ratingBoundsOf, unitOf } from '@/lib/create-entry';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function fieldId(criterion: Criterion, idPrefix: string) {
  return `${idPrefix}-${criterion.id}`;
}

export function EntryValueField({
  criterion,
  value,
  onChange,
  idPrefix = 'entry-field',
}: {
  criterion: Criterion;
  value: EntryFieldValue;
  onChange: (value: EntryFieldValue) => void;
  idPrefix?: string;
}) {
  const type = criterion.type;
  const id = fieldId(criterion, idPrefix);
  const required = criterion.is_key;
  const t = useTranslations('createEntry');

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
            <SelectValue placeholder={t('selectOption')} />
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

  if (type === 'number') {
    const unit = unitOf(criterion);

    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>{criterion.name}</Label>
        {unit ? (
          <InputGroup>
            <InputGroupInput
              id={id}
              type="number"
              step="any"
              value={textValue}
              onChange={(event) => onChange(event.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>{unit}</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        ) : (
          <Input
            id={id}
            type="number"
            step="any"
            value={textValue}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </div>
    );
  }

  if (type === 'rating') {
    const bounds = ratingBoundsOf(criterion);

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
        placeholder={required ? t('namePlaceholder') : undefined}
        required={required}
        maxLength={200}
        autoFocus={required}
      />
    </div>
  );
}
