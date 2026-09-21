'use client';

import { useTranslations } from 'next-intl';
import type { ComparisonDetailsResponse } from '@compy/shared';
import { EntryCellValue } from '@/components/entries/entry-cell-value';
import { EntryActionsMenu } from '@/components/entries/entry-actions-menu';
import { entryLabel } from '@/components/entries/entry-sort';

type Criterion = ComparisonDetailsResponse['criteria'][number];
type Entry = ComparisonDetailsResponse['entries'][number];

export function EntryCard({
  publicId,
  entry,
  criteria,
}: {
  publicId: string;
  entry: Entry;
  criteria: Criterion[];
}) {
  const t = useTranslations('common');
  const label = entryLabel(entry, criteria) || t('emDash');

  return (
    <article className="rounded-xl border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-base font-medium text-foreground">
          {label}
        </h3>
        <EntryActionsMenu
          publicId={publicId}
          entryId={entry.id}
          entryLabel={entryLabel(entry, criteria)}
          criteria={criteria}
          entryValues={entry.entryValues}
        />
      </div>
      <dl className="mt-3 space-y-2">
        {criteria.map((criterion) => (
          <div
            key={criterion.id}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 text-sm"
          >
            <dt className="text-muted-foreground">{criterion.name}</dt>
            <dd className="min-w-0 text-right text-foreground">
              <EntryCellValue
                criterion={criterion}
                value={
                  entry.entryValues.find(
                    (entryValue) => entryValue.criterionId === criterion.id,
                  )?.value
                }
              />
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
