'use client';

import { useTranslations } from 'next-intl';
import type { ComparisonDetailsResponse } from '@compy/shared';
import { CriterionCard } from '@/components/criteria/criterion-card';
import { sortCriteriaByRole } from '@/components/criteria/criterion-display';

type Criterion = ComparisonDetailsResponse['criteria'][number];

export function CriteriaCardList({
  publicId,
  criteria,
}: {
  publicId: string;
  criteria: Criterion[];
}) {
  const t = useTranslations('criteriaTable');
  const sortedCriteria = sortCriteriaByRole(criteria);

  if (sortedCriteria.length === 0) {
    return (
      <p className="rounded-xl border bg-background px-4 py-10 text-center text-sm text-muted-foreground">
        {t('empty')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3" data-testid="criteria-card-list">
      {sortedCriteria.map((criterion) => (
        <CriterionCard
          key={criterion.id}
          publicId={publicId}
          criterion={criterion}
        />
      ))}
    </div>
  );
}
