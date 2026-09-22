'use client';

import { useTranslations } from 'next-intl';
import type { ResultsInfoColumn, ResultsTableRow } from '@/lib/results';
import { ResultCard } from '@/components/results/result-card';
import { displayScore } from '@/components/results/results-score';

export function ResultsCardList({
  infoColumns,
  rows,
}: {
  infoColumns: ResultsInfoColumn[];
  rows: ResultsTableRow[];
}) {
  const t = useTranslations('results');
  const displayScores = rows.map((row) => displayScore(row.rate));

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border bg-background px-4 py-10 text-center text-sm text-muted-foreground">
        {t('empty')}
      </p>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3"
      data-testid="results-card-list"
    >
      {rows.map((row, index) => (
        <ResultCard
          key={row.entryId}
          row={row}
          index={index}
          displayScores={displayScores}
          infoColumns={infoColumns}
        />
      ))}
    </div>
  );
}
