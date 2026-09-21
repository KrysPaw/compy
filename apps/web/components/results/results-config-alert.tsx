import { getTranslations } from 'next-intl/server';
import {
  getResultsConfigAlertState,
  WEIGHT_POOL_TOTAL,
} from '@/lib/results-config-alert';
import type { ComparisonDetailsResponse } from '@compy/shared';
import { ResultsConfigAlertView } from '@/components/results/results-config-alert-view';

type Criterion = ComparisonDetailsResponse['criteria'][number];
type Entry = ComparisonDetailsResponse['entries'][number];

export async function ResultsConfigAlert({
  publicId,
  criteria,
  entries,
}: {
  publicId: string;
  criteria: ReadonlyArray<Criterion>;
  entries: ReadonlyArray<Entry>;
}) {
  const state = getResultsConfigAlertState(criteria, entries);
  if (state === null) {
    return null;
  }

  const t = await getTranslations('results');

  return (
    <ResultsConfigAlertView
      publicId={publicId}
      state={state}
      labels={{
        weightsZero: t('configAlert.weightsZero'),
        weightsPartial: t('configAlert.weightsPartial', {
          remaining: state.remaining,
          total: WEIGHT_POOL_TOTAL,
        }),
        rulesUnset: t('configAlert.rulesUnset'),
        valuesMissing: t('configAlert.valuesMissing'),
        setRules: t('configAlert.setRules'),
        completeEntries: t('configAlert.completeEntries'),
      }}
    />
  );
}
