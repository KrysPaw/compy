'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ComparisonDetailsResponse } from '@compy/shared';
import { EntryActionsMenu } from '@/components/entries/entry-actions-menu';
import { EntryCellValue } from '@/components/entries/entry-cell-value';
import {
  entryLabel,
  nextEntrySort,
  sortEntries,
  type EntrySort,
} from '@/components/entries/entry-sort';
import { SortIcon } from '@/components/entries/sort-icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Criterion = ComparisonDetailsResponse['criteria'][number];
type Entry = ComparisonDetailsResponse['entries'][number];

export function ComparisonDataTable({
  publicId,
  criteria,
  entries,
  sort: sortProp,
  onSortChange,
}: Pick<ComparisonDetailsResponse, 'criteria' | 'entries'> & {
  publicId: string;
  sort?: EntrySort | null;
  onSortChange?: (next: EntrySort | null) => void;
}) {
  const t = useTranslations('comparisonTable');
  const [internalSort, setInternalSort] = useState<EntrySort | null>(null);
  const sort = sortProp !== undefined ? sortProp : internalSort;
  const setSort = onSortChange ?? setInternalSort;
  const sortedEntries = sortEntries(entries, sort);
  const columnCount = criteria.length + 1;

  return (
    <div
      className="overflow-hidden rounded-xl border bg-background"
      data-testid="entries-data-table"
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {criteria.map((criterion: Criterion) => {
                const direction =
                  sort?.criterionId === criterion.id ? sort.direction : null;

                return (
                  <TableHead key={criterion.id}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 font-medium text-foreground hover:text-primary"
                      onClick={() =>
                        setSort(nextEntrySort(sort, criterion.id))
                      }
                    >
                      {criterion.name}
                      <SortIcon direction={direction} />
                    </button>
                  </TableHead>
                );
              })}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t('empty')}
                </TableCell>
              </TableRow>
            ) : (
              sortedEntries.map((entry: Entry) => (
                <TableRow key={entry.id}>
                  {criteria.map((criterion: Criterion) => (
                    <TableCell key={criterion.id}>
                      <EntryCellValue
                        criterion={criterion}
                        value={
                          entry.entryValues.find(
                            (entryValue) =>
                              entryValue.criterionId === criterion.id,
                          )?.value
                        }
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <EntryActionsMenu
                      publicId={publicId}
                      entryId={entry.id}
                      entryLabel={entryLabel(entry, criteria)}
                      criteria={criteria}
                      entryValues={entry.entryValues}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
