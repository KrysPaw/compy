'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PlusIcon, XIcon } from 'lucide-react';
import { createCriterion } from '@/lib/actions';
import { cn } from '@/lib/utils';
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

type ComparableType = 'number' | 'boolean' | 'rating' | 'enum';

const TYPE_KEYS: ComparableType[] = ['number', 'boolean', 'rating', 'enum'];

export type CreateCriterionFormState = {
  name: string;
  isComparable: boolean;
  type: ComparableType;
  ratingMin: string;
  ratingMax: string;
  enumOptions: string[];
};

export const CREATE_CRITERION_INITIAL_STATE: CreateCriterionFormState = {
  name: '',
  isComparable: false,
  type: 'number',
  ratingMin: '',
  ratingMax: '',
  enumOptions: [''],
};

// Animates height from 0 without unmounting, so fields stay in the DOM for layout transitions.
function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows] duration-200 ease-out',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}
    >
      <div className="overflow-hidden">
        <div
          className={cn(
            'flex flex-col gap-4 transition-opacity duration-150',
            open ? 'opacity-100' : 'opacity-0',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function CreateCriterionForm({
  state,
  onStateChange,
  error,
  isPending = false,
  onSubmit,
  idPrefix = 'criterion',
  showFooter = true,
}: {
  state: CreateCriterionFormState;
  onStateChange: (next: CreateCriterionFormState) => void;
  error?: string;
  isPending?: boolean;
  onSubmit: () => void;
  idPrefix?: string;
  showFooter?: boolean;
}) {
  const t = useTranslations();

  function update(partial: Partial<CreateCriterionFormState>) {
    onStateChange({ ...state, ...partial });
  }

  function updateEnumOption(index: number, value: string) {
    update({
      enumOptions: state.enumOptions.map((option, i) =>
        i === index ? value : option,
      ),
    });
  }

  function addEnumOption() {
    update({ enumOptions: [...state.enumOptions, ''] });
  }

  function removeEnumOption(index: number) {
    update({
      enumOptions: state.enumOptions.filter((_, i) => i !== index),
    });
  }

  return (
    <form
      action={onSubmit}
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-name`}>{t('common.name')}</Label>
        <Input
          id={`${idPrefix}-name`}
          value={state.name}
          onChange={(event) => update({ name: event.target.value })}
          placeholder={t('createCriterion.placeholder')}
          required
          maxLength={200}
          autoFocus={idPrefix === 'criterion'}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor={`${idPrefix}-comparable`}>
          {t('createCriterion.comparable')}
        </Label>
        <Switch
          id={`${idPrefix}-comparable`}
          checked={state.isComparable}
          onCheckedChange={(checked) => update({ isComparable: checked })}
        />
      </div>

      <Collapse open={state.isComparable}>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-type`}>{t('createCriterion.type')}</Label>
          <Select
            value={state.type}
            onValueChange={(value) =>
              update({ type: value as ComparableType })
            }
          >
            <SelectTrigger id={`${idPrefix}-type`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_KEYS.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`createCriterion.types.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Collapse open={state.isComparable && state.type === 'rating'}>
          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor={`${idPrefix}-rating-min`}>
                {t('createCriterion.min')}
              </Label>
              <Input
                id={`${idPrefix}-rating-min`}
                type="number"
                value={state.ratingMin}
                onChange={(event) => update({ ratingMin: event.target.value })}
                required={state.isComparable && state.type === 'rating'}
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor={`${idPrefix}-rating-max`}>
                {t('createCriterion.max')}
              </Label>
              <Input
                id={`${idPrefix}-rating-max`}
                type="number"
                value={state.ratingMax}
                onChange={(event) => update({ ratingMax: event.target.value })}
                required={state.isComparable && state.type === 'rating'}
              />
            </div>
          </div>
        </Collapse>

        <Collapse open={state.isComparable && state.type === 'enum'}>
          <div className="flex flex-col gap-2">
            <Label>{t('createCriterion.options')}</Label>
            <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
              {state.enumOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(event) =>
                      updateEnumOption(index, event.target.value)
                    }
                    placeholder={t('createCriterion.optionPlaceholder', {
                      n: index + 1,
                    })}
                    required={state.isComparable && state.type === 'enum'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={state.enumOptions.length === 1}
                    onClick={() => removeEnumOption(index)}
                  >
                    <XIcon />
                    <span className="sr-only">
                      {t('createCriterion.removeOption')}
                    </span>
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEnumOption}
            >
              {t('createCriterion.addOption')}
            </Button>
          </div>
        </Collapse>
      </Collapse>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {showFooter ? (
        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? t('common.creating') : t('common.create')}
          </Button>
        </DialogFooter>
      ) : null}
    </form>
  );
}

export function CreateCriterionDialog({
  publicId,
}: {
  publicId: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState(CREATE_CRITERION_INITIAL_STATE);

  function reset() {
    setState(CREATE_CRITERION_INITIAL_STATE);
    setError(undefined);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
    }
  }

  function handleSubmit() {
    const payload = state.isComparable
      ? state.type === 'rating'
        ? {
            name: state.name,
            is_comparable: true,
            type: 'rating',
            config: {
              min: Number(state.ratingMin),
              max: Number(state.ratingMax),
            },
          }
        : state.type === 'enum'
          ? {
              name: state.name,
              is_comparable: true,
              type: 'enum',
              config: {
                options: state.enumOptions
                  .map((option) => option.trim())
                  .filter((option) => option.length > 0),
              },
            }
          : { name: state.name, is_comparable: true, type: state.type }
      : { name: state.name, is_comparable: false, type: 'text' };

    startTransition(async () => {
      const result = await createCriterion(publicId, payload);

      if (result.criterionId === undefined) {
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
          {t('createCriterion.add')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('createCriterion.title')}</DialogTitle>
          <DialogDescription>
            {t('createCriterion.description')}
          </DialogDescription>
        </DialogHeader>
        <CreateCriterionForm
          state={state}
          onStateChange={setState}
          error={error}
          isPending={isPending}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
