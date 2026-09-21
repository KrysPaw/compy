'use client';

import type { ComparisonDetailsResponse } from '@compy/shared';
import { CriteriaCardList } from '@/components/criteria/criteria-card-list';
import { CriteriaDataTable } from '@/components/criteria/criteria-data-table';
import { useComparisonViewMode } from '@/hooks/use-comparison-view-mode';

export function CriteriaView({
  publicId,
  criteria,
}: {
  publicId: string;
} & Pick<ComparisonDetailsResponse, 'criteria'>) {
  const { effectiveMode } = useComparisonViewMode();

  if (effectiveMode === 'cards') {
    return <CriteriaCardList publicId={publicId} criteria={criteria} />;
  }

  return <CriteriaDataTable publicId={publicId} criteria={criteria} />;
}
