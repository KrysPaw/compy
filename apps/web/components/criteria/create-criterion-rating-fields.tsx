'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateCriterionRatingFields({
  idPrefix,
  ratingMin,
  ratingMax,
  required,
  onRatingMinChange,
  onRatingMaxChange,
}: {
  idPrefix: string;
  ratingMin: string;
  ratingMax: string;
  required: boolean;
  onRatingMinChange: (value: string) => void;
  onRatingMaxChange: (value: string) => void;
}) {
  const t = useTranslations();

  return (
    <div className="flex gap-4">
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor={`${idPrefix}-rating-min`}>
          {t('createCriterion.min')}
        </Label>
        <Input
          id={`${idPrefix}-rating-min`}
          type="number"
          value={ratingMin}
          onChange={(event) => onRatingMinChange(event.target.value)}
          required={required}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor={`${idPrefix}-rating-max`}>
          {t('createCriterion.max')}
        </Label>
        <Input
          id={`${idPrefix}-rating-max`}
          type="number"
          value={ratingMax}
          onChange={(event) => onRatingMaxChange(event.target.value)}
          required={required}
        />
      </div>
    </div>
  );
}
