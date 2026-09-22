'use client';

import { useTranslations } from 'next-intl';
import type { ComparisonDetailsResponse } from '@compy/shared';
import { EntryCard } from '@/components/entries/entry-card';

type Criterion = ComparisonDetailsResponse['criteria'][number];
type Entry = ComparisonDetailsResponse['entries'][number];

export function EntriesCardList({
  publicId,
  criteria,
  entries,
}: {
  publicId: string;
  criteria: Criterion[];
  entries: Entry[];
}) {
  const t = useTranslations('comparisonTable');

  if (entries.length === 0) {
    return (
      <p className="rounded-xl border bg-background px-4 py-10 text-center text-sm text-muted-foreground">
        {t('empty')}
      </p>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3"
      data-testid="entries-card-list"
    >
      {entries.map((entry) => (
        <EntryCard
          key={entry.id}
          publicId={publicId}
          entry={entry}
          criteria={criteria}
        />
      ))}
    </div>
  );
}
