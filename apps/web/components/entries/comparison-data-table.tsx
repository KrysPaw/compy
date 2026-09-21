'use client';

import { useTranslations } from 'next-intl';
import type { ComparisonDetailsResponse } from '@compy/shared';
import { EntryActionsMenu } from '@/components/entries/entry-actions-menu';
import { EntryCellValue } from '@/components/entries/entry-cell-value';
import { entryLabel } from '@/components/entries/entry-sort';
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
}: Pick<ComparisonDetailsResponse, 'criteria' | 'entries'> & {
  publicId: string;
}) {
  const t = useTranslations('comparisonTable');
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
              {criteria.map((criterion: Criterion) => (
                <TableHead key={criterion.id}>{criterion.name}</TableHead>
              ))}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t('empty')}
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry: Entry) => (
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
