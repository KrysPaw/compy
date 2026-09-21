'use client';

import { useTranslations } from 'next-intl';
import { Collapse } from '@/components/criteria/collapse';
import { CreateCriterionEnumOptions } from '@/components/criteria/create-criterion-enum-options';
import { CreateCriterionRatingFields } from '@/components/criteria/create-criterion-rating-fields';
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
import { DialogFooter } from '@/components/ui/dialog';

export type ComparableType = 'number' | 'boolean' | 'rating' | 'enum';

export const TYPE_KEYS: ComparableType[] = ['number', 'boolean', 'rating', 'enum'];

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
          <CreateCriterionRatingFields
            idPrefix={idPrefix}
            ratingMin={state.ratingMin}
            ratingMax={state.ratingMax}
            required={state.isComparable && state.type === 'rating'}
            onRatingMinChange={(ratingMin) => update({ ratingMin })}
            onRatingMaxChange={(ratingMax) => update({ ratingMax })}
          />
        </Collapse>

        <Collapse open={state.isComparable && state.type === 'enum'}>
          <CreateCriterionEnumOptions
            enumOptions={state.enumOptions}
            required={state.isComparable && state.type === 'enum'}
            onEnumOptionsChange={(enumOptions) => update({ enumOptions })}
          />
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
