'use client';

import { useTranslations } from 'next-intl';
import type { ResultsInfoColumn, ResultsTableRow } from '@/lib/results';
import { HighlightsCell } from '@/components/results/highlights-cell';
import { PlaceMedal } from '@/components/results/place-medal';
import {
  denseMedalPlaceIndex,
  displayScore,
} from '@/components/results/results-score';

export function ResultCard({
  row,
  index,
  displayScores,
  infoColumns,
}: {
  row: ResultsTableRow;
  index: number;
  displayScores: number[];
  infoColumns: ResultsInfoColumn[];
}) {
  const t = useTranslations();

  return (
    <article className="rounded-xl border bg-background p-4">
      <div className="flex items-center gap-2">
        <PlaceMedal
          placeIndex={denseMedalPlaceIndex(displayScores, index)}
        />
        <h3 className="min-w-0 text-base font-medium text-foreground">
          {row.keyLabel || t('common.emDash')}
        </h3>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        {infoColumns.map((column, columnIndex) => (
          <div
            key={column.id}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2"
          >
            <dt className="text-muted-foreground">{column.name}</dt>
            <dd className="min-w-0 text-right text-foreground">
              {row.infoValues[columnIndex] || t('common.emDash')}
            </dd>
          </div>
        ))}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2">
          <dt className="text-muted-foreground">{t('results.score')}</dt>
          <dd className="text-right text-foreground">
            {String(displayScore(row.rate))}
          </dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-muted-foreground">{t('results.highlights')}</dt>
          <dd>
            <HighlightsCell pros={row.pros} cons={row.cons} />
          </dd>
        </div>
      </dl>
    </article>
  );
}
