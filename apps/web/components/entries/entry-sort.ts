import type { ComparisonDetailsResponse } from '@compy/shared';
import { rawEntryValue } from '@/components/entries/entry-cell-value';

type Criterion = ComparisonDetailsResponse['criteria'][number];
type Entry = ComparisonDetailsResponse['entries'][number];

export type EntrySort = {
  criterionId: number;
  direction: 'asc' | 'desc';
};

export function entryLabel(entry: Entry, criteria: Criterion[]) {
  const keyCriterion = criteria.find((criterion) => criterion.is_key);
  if (keyCriterion === undefined) {
    return '';
  }

  return rawEntryValue(
    entry.entryValues.find((value) => value.criterionId === keyCriterion.id)
      ?.value,
  );
}

export function sortEntries(
  entries: Entry[],
  sort: EntrySort | null,
): Entry[] {
  if (sort === null) {
    return entries;
  }

  return [...entries].sort((left, right) => {
    const leftValue = rawEntryValue(
      left.entryValues.find((value) => value.criterionId === sort.criterionId)
        ?.value,
    );
    const rightValue = rawEntryValue(
      right.entryValues.find((value) => value.criterionId === sort.criterionId)
        ?.value,
    );
    const comparison = leftValue.localeCompare(rightValue, undefined, {
      numeric: true,
      sensitivity: 'base',
    });

    return sort.direction === 'asc' ? comparison : -comparison;
  });
}
