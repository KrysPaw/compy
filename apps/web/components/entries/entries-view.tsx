'use client';

import { useState } from 'react';
import type { ComparisonDetailsResponse } from '@compy/shared';
import { ComparisonDataTable } from '@/components/entries/comparison-data-table';
import { EntriesCardList } from '@/components/entries/entries-card-list';
import { EntriesSortControl } from '@/components/entries/entries-sort-control';
import {
  sortEntries,
  type EntrySort,
} from '@/components/entries/entry-sort';
import { useComparisonViewMode } from '@/hooks/use-comparison-view-mode';

export function EntriesView({
  publicId,
  criteria,
  entries,
}: Pick<ComparisonDetailsResponse, 'criteria' | 'entries'> & {
  publicId: string;
}) {
  const { effectiveMode } = useComparisonViewMode();
  const [sort, setSort] = useState<EntrySort | null>(null);
  const sortedEntries = sortEntries(entries, sort);

  if (effectiveMode === 'cards') {
    return (
      <div className="flex flex-col gap-3">
        {criteria.length > 0 ? (
          <EntriesSortControl
            criteria={criteria}
            sort={sort}
            onSortChange={setSort}
          />
        ) : null}
        <EntriesCardList
          publicId={publicId}
          criteria={criteria}
          entries={sortedEntries}
        />
      </div>
    );
  }

  return (
    <ComparisonDataTable
      publicId={publicId}
      criteria={criteria}
      entries={entries}
      sort={sort}
      onSortChange={setSort}
    />
  );
}
