'use client';

import { ArrowDownWideNarrowIcon, ArrowUpNarrowWideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComparisonDetailsResponse } from '@compy/shared';
import type { EntrySort } from '@/components/entries/entry-sort';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Criterion = ComparisonDetailsResponse['criteria'][number];

export function EntriesSortControl({
  criteria,
  sort,
  onSortChange,
}: {
  criteria: Criterion[];
  sort: EntrySort | null;
  onSortChange: (next: EntrySort | null) => void;
}) {
  const t = useTranslations('comparisonTable');
  const criterionId = sort?.criterionId;
  const direction = sort?.direction ?? 'asc';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={criterionId !== undefined ? String(criterionId) : undefined}
        onValueChange={(value) => {
          if (value === null || value === undefined) {
            onSortChange(null);
            return;
          }
          onSortChange({
            criterionId: Number(value),
            direction,
          });
        }}
      >
        <SelectTrigger
          size="sm"
          className="min-w-40"
          aria-label={t('sortBy')}
        >
          <SelectValue placeholder={t('sortBy')} />
        </SelectTrigger>
        <SelectContent>
          {criteria.map((criterion) => (
            <SelectItem key={criterion.id} value={String(criterion.id)}>
              {criterion.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={criterionId === undefined}
        aria-label={
          direction === 'asc' ? t('sortAscending') : t('sortDescending')
        }
        onClick={() => {
          if (criterionId === undefined) {
            return;
          }
          onSortChange({
            criterionId,
            direction: direction === 'asc' ? 'desc' : 'asc',
          });
        }}
      >
        {direction === 'asc' ? (
          <ArrowUpNarrowWideIcon className="size-4" />
        ) : (
          <ArrowDownWideNarrowIcon className="size-4" />
        )}
      </Button>
    </div>
  );
}
