import type { ComparisonDetailsResponse } from '@compy/shared';
import { MedalIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Criterion = ComparisonDetailsResponse['criteria'][number];

export type ResultsInfoColumn = {
  id: number;
  name: string;
};

export type ResultsTableRow = {
  entryId: number;
  keyLabel: string;
  infoValues: string[];
  pros: string;
  cons: string;
  rate: number;
};

const PLACE_MEDALS = [
  { label: '1st place', color: '#D4AF37' },
  { label: '2nd place', color: '#A8A9AD' },
  { label: '3rd place', color: '#CD7F32' },
] as const;

function PlaceMedal({ placeIndex }: { placeIndex: number }) {
  const medal = PLACE_MEDALS[placeIndex];
  if (!medal) {
    return null;
  }

  return (
    <MedalIcon
      aria-label={medal.label}
      className="size-4 shrink-0"
      color={medal.color}
      fill={medal.color}
      fillOpacity={0.35}
      stroke={medal.color}
    />
  );
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

/** Non-key criteria that do not participate in ranking. */
export function resultsInfoColumns(
  criteria: ReadonlyArray<Criterion>,
): ResultsInfoColumn[] {
  return criteria
    .filter((criterion) => !criterion.is_key && !criterion.is_comparable)
    .map((criterion) => ({ id: criterion.id, name: criterion.name }));
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
  const columnCount = 3 + infoColumns.length;

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
              <TableHead>Pros</TableHead>
              <TableHead>Cons</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  No entries yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={row.entryId}>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <PlaceMedal placeIndex={index} />
                      {row.keyLabel || '—'}
                    </span>
                  </TableCell>
                  {infoColumns.map((column, columnIndex) => (
                    <TableCell key={column.id}>
                      {row.infoValues[columnIndex] || '—'}
                    </TableCell>
                  ))}
                  <TableCell>{row.pros || '—'}</TableCell>
                  <TableCell>{row.cons || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function buildResultsRows(
  comparison: Pick<ComparisonDetailsResponse, 'criteria' | 'entries'>,
  ranked: ReadonlyArray<{ entryId: number; rate: number }>,
  infoColumns: ReadonlyArray<ResultsInfoColumn> = resultsInfoColumns(
    comparison.criteria,
  ),
): ResultsTableRow[] {
  const keyCriterion = comparison.criteria.find(
    (criterion) => criterion.is_key,
  );

  const entriesById = new Map(
    comparison.entries.map((entry) => [entry.id, entry]),
  );

  return ranked.map((item) => {
    const entry = entriesById.get(item.entryId);
    const raw = entry?.entryValues.find(
      (value) => value.criterionId === keyCriterion?.id,
    )?.value;

    return {
      entryId: item.entryId,
      keyLabel: displayValue(raw),
      infoValues: infoColumns.map((column) => {
        const value = entry?.entryValues.find(
          (itemValue) => itemValue.criterionId === column.id,
        )?.value;
        return displayValue(value);
      }),
      pros: '',
      cons: '',
      rate: item.rate,
    };
  });
}
