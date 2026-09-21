'use client';

import { useTranslations } from 'next-intl';
import { StarIcon } from 'lucide-react';
import type { ComparisonDetailsResponse } from '@compy/shared';
import {
  formatValueWithUnit,
  ratingBoundsOf,
  unitOf,
} from '@/lib/create-entry';

type Criterion = ComparisonDetailsResponse['criteria'][number];

export function rawEntryValue(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

export function EntryCellValue({
  criterion,
  value,
}: {
  criterion: Criterion;
  value: unknown;
}) {
  const t = useTranslations('common');
  const text = rawEntryValue(value);
  if (text.length === 0) {
    return t('emDash');
  }

  if (criterion.type === 'rating') {
    const { max } = ratingBoundsOf(criterion);
    const label = typeof max === 'number' ? `${text} / ${max}` : text;

    return (
      <span className="inline-flex items-center gap-1">
        {label}
        <StarIcon
          aria-hidden
          className="size-3.5 shrink-0 text-amber-500"
          fill="currentColor"
          fillOpacity={0.35}
        />
      </span>
    );
  }

  if (criterion.type === 'number') {
    return formatValueWithUnit(text, unitOf(criterion));
  }

  return text;
}
