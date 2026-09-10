import { prosConsByEntry, type ComparisonDetailsResponse } from '@compy/shared';
import { MedalIcon, MinusIcon, PlusIcon } from 'lucide-react';
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
  pros: string[];
  cons: string[];
  rate: number;
};

const PLACE_MEDALS = [
  { label: '1st place', color: '#D4AF37' },
  { label: '2nd place', color: '#A8A9AD' },
  { label: '3rd place', color: '#CD7F32' },
] as const;

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

function PlaceMedal({ placeIndex }: { placeIndex: number | null }) {
  if (placeIndex === null) {
    return null;
  }

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

/** Rounded score shown in the UI; medals must use this for ties. */
export function displayScore(rate: number): number {
  return Math.round(rate);
}

function formatScore(rate: number): string {
  return String(displayScore(rate));
}

function HighlightItems({
  items,
  kind,
}: {
  items: string[];
  kind: 'pro' | 'con';
}) {
  const Icon = kind === 'pro' ? PlusIcon : MinusIcon;
  const iconClass =
    kind === 'pro'
      ? 'size-3.5 shrink-0 text-emerald-600'
      : 'size-3.5 shrink-0 text-red-600';

  return items.map((item) => (
    <li key={`${kind}:${item}`} className="inline-flex items-center gap-1.5">
      <Icon aria-hidden className={iconClass} />
      <span>{item}</span>
    </li>
  ));
}

function HighlightsCell({
  pros,
  cons,
}: {
  pros: string[];
  cons: string[];
}) {
  if (pros.length === 0 && cons.length === 0) {
    return '—';
  }

  return (
    <ul className="flex list-none flex-col gap-1 p-0">
      <HighlightItems items={pros} kind="pro" />
      <HighlightItems items={cons} kind="con" />
    </ul>
  );
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
              <TableHead>Score</TableHead>
              <TableHead>Highlights</TableHead>
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
                      <PlaceMedal
                        placeIndex={denseMedalPlaceIndex(displayScores, index)}
                      />
                      {row.keyLabel || '—'}
                    </span>
                  </TableCell>
                  {infoColumns.map((column, columnIndex) => (
                    <TableCell key={column.id}>
                      {row.infoValues[columnIndex] || '—'}
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

  const highlights = prosConsByEntry(
    comparison.criteria,
    comparison.entries,
  );

  return ranked.map((item) => {
    const entry = entriesById.get(item.entryId);
    const raw = entry?.entryValues.find(
      (value) => value.criterionId === keyCriterion?.id,
    )?.value;
    const entryHighlights = highlights.get(item.entryId);

    return {
      entryId: item.entryId,
      keyLabel: displayValue(raw),
      infoValues: infoColumns.map((column) => {
        const value = entry?.entryValues.find(
          (itemValue) => itemValue.criterionId === column.id,
        )?.value;
        return displayValue(value);
      }),
      pros: entryHighlights?.pros ?? [],
      cons: entryHighlights?.cons ?? [],
      rate: item.rate,
    };
  });
}
