'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { ComparisonDetailsResponse } from '@compy/shared';
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

function rawValue(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function SortIcon({ direction }: { direction: 'asc' | 'desc' | null }) {
  if (direction === 'asc') {
    return <ArrowUp aria-hidden="true" className="size-3.5" />;
  }

  if (direction === 'desc') {
    return <ArrowDown aria-hidden="true" className="size-3.5" />;
  }

  return <ArrowUpDown aria-hidden="true" className="size-3.5" />;
}

export function ComparisonDataTable({
  criteria,
  entries,
}: Pick<ComparisonDetailsResponse, 'criteria' | 'entries'>) {
  const [sort, setSort] = useState<{
    criterionId: number;
    direction: 'asc' | 'desc';
  } | null>(null);

  const sortedEntries = [...entries].sort((left, right) => {
    if (sort === null) {
      return 0;
    }

    const leftValue = rawValue(
      left.entryValues.find((value) => value.criterionId === sort.criterionId)
        ?.value,
    );
    const rightValue = rawValue(
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={criteria.length || 1}
                  className="h-24 text-center text-muted-foreground"
                >
                  No entries yet.
                </TableCell>
              </TableRow>
            ) : (
              sortedEntries.map((entry: Entry) => (
                <TableRow key={entry.id}>
                  {criteria.map((criterion: Criterion) => (
                    <TableCell key={criterion.id}>
                      {rawValue(
                        entry.entryValues.find(
                          (value) => value.criterionId === criterion.id,
                        )?.value,
                      ) || '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
