'use client';

import { useTranslations } from 'next-intl';
import type { ResultsInfoColumn, ResultsTableRow } from '@/lib/results';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { HighlightsCell } from '@/components/results/highlights-cell';
import { PlaceMedal } from '@/components/results/place-medal';

/**
 * Dense ranking for medals: equal *displayed* scores share a place, and the
 * next distinct score takes the next place (1st → 2nd → 3rd). Returns null
 * below 3rd. `scoresDescending` must already be sorted highest-first and should
 * use the same rounding as the Score column.
 */
export function denseMedalPlaceIndex(
  scoresDescending: ReadonlyArray<number>,
  index: number,
): number | null {
  const score = scoresDescending[index];
  if (score === undefined) {
    return null;
  }

  let placeIndex = 0;
  for (let i = 1; i <= index; i += 1) {
    if (scoresDescending[i] !== scoresDescending[i - 1]) {
      placeIndex += 1;
    }
  }

  return placeIndex <= 2 ? placeIndex : null;
}

/** Rounded score shown in the UI; medals must use this for ties. */
export function displayScore(rate: number): number {
  return Math.round(rate);
}

function formatScore(rate: number): string {
  return String(displayScore(rate));
}

export function ResultsDataTable({
  keyCriterionName,
  infoColumns,
  rows,
}: {
  keyCriterionName: string;
  infoColumns: ResultsInfoColumn[];
  rows: ResultsTableRow[];
}) {
  const t = useTranslations();
  const columnCount = 3 + infoColumns.length;
  const displayScores = rows.map((row) => displayScore(row.rate));

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{keyCriterionName}</TableHead>
              {infoColumns.map((column) => (
                <TableHead key={column.id}>{column.name}</TableHead>
              ))}
              <TableHead>{t('results.score')}</TableHead>
              <TableHead>{t('results.highlights')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t('results.empty')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={row.entryId}>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <PlaceMedal
                        placeIndex={denseMedalPlaceIndex(displayScores, index)}
                      />
                      {row.keyLabel || t('common.emDash')}
                    </span>
                  </TableCell>
                  {infoColumns.map((column, columnIndex) => (
                    <TableCell key={column.id}>
                      {row.infoValues[columnIndex] || t('common.emDash')}
                    </TableCell>
                  ))}
                  <TableCell>{formatScore(row.rate)}</TableCell>
                  <TableCell>
                    <HighlightsCell pros={row.pros} cons={row.cons} />
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
