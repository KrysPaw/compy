'use client';

import { useTranslations } from 'next-intl';
import { Collapse } from '@/components/criteria/collapse';
import { CreateCriterionEnumOptions } from '@/components/criteria/create-criterion-enum-options';
import { CreateCriterionRatingFields } from '@/components/criteria/create-criterion-rating-fields';
import {
  CreateCriterionTypeCards,
  selectedCriterionTypeCard,
  typeCardSelectionPatch,
} from '@/components/criteria/create-criterion-type-cards';
import { CreateCriterionUnitField } from '@/components/criteria/create-criterion-unit-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';

export type ComparableType = 'number' | 'boolean' | 'rating' | 'enum';

export type CreateCriterionFormState = {
  name: string;
  isComparable: boolean;
  type: ComparableType;
  unit: string;
  ratingMin: string;
  ratingMax: string;
  enumOptions: string[];
};

export const CREATE_CRITERION_INITIAL_STATE: CreateCriterionFormState = {
  name: '',
  isComparable: false,
  type: 'number',
  unit: '',
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
  const typeSectionId = `${idPrefix}-type-section`;

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

      <div className="flex flex-col gap-2">
        <Label id={typeSectionId}>{t('createCriterion.typeSection')}</Label>
        <CreateCriterionTypeCards
          labelledBy={typeSectionId}
          selected={selectedCriterionTypeCard(state.isComparable, state.type)}
          onSelect={(id) => update(typeCardSelectionPatch(id))}
        />
      </div>

      <Collapse open={state.isComparable && state.type === 'number'}>
        <CreateCriterionUnitField
          idPrefix={idPrefix}
          unit={state.unit}
          onUnitChange={(unit) => update({ unit })}
        />
      </Collapse>

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
