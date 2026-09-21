'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ComparisonDetailsResponse } from '@compy/shared';
import { EntryActionsMenu } from '@/components/entries/entry-actions-menu';
import {
  EntryCellValue,
  rawEntryValue,
} from '@/components/entries/entry-cell-value';
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

function entryLabel(entry: Entry, criteria: Criterion[]) {
  const keyCriterion = criteria.find((criterion) => criterion.is_key);
  if (keyCriterion === undefined) {
    return '';
  }

  return rawEntryValue(
    entry.entryValues.find((value) => value.criterionId === keyCriterion.id)
      ?.value,
  );
}

export function ComparisonDataTable({
  publicId,
  criteria,
  entries,
}: Pick<ComparisonDetailsResponse, 'criteria' | 'entries'> & {
  publicId: string;
}) {
  const t = useTranslations('comparisonTable');
  const [sort, setSort] = useState<{
    criterionId: number;
    direction: 'asc' | 'desc';
  } | null>(null);

  const sortedEntries = [...entries].sort((left, right) => {
    if (sort === null) {
      return 0;
    }

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

  function toggleSort(criterionId: number) {
    setSort((current) => {
      if (current?.criterionId !== criterionId) {
        return { criterionId, direction: 'asc' };
      }

      return {
        criterionId,
        direction: current.direction === 'asc' ? 'desc' : 'asc',
      };
    });
  }

  const columnCount = criteria.length + 1;

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
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
                      onClick={() => toggleSort(criterion.id)}
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
