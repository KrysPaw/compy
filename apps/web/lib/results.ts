import {
  prosConsByEntry,
  type ComparisonDetailsResponse,
  type HighlightItem,
} from '@compy/shared';

type Criterion = ComparisonDetailsResponse['criteria'][number];

export type ResultsInfoColumn = {
  id: number;
  name: string;
};

export type ResultsTableRow = {
  entryId: number;
  keyLabel: string;
  infoValues: string[];
  pros: HighlightItem[];
  cons: HighlightItem[];
  rate: number;
};

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

  const highlights = prosConsByEntry(comparison.criteria, comparison.entries);

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
