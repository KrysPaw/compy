import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  getResultsConfigAlertState,
  WEIGHT_POOL_TOTAL,
  type ResultsConfigAlertState,
} from '@/lib/results-config-alert';
import type { ComparisonDetailsResponse } from '@compy/shared';

type Criterion = ComparisonDetailsResponse['criteria'][number];

export function ResultsConfigAlertView({
  comparisonId,
  state,
  labels,
}: {
  comparisonId: number;
  state: ResultsConfigAlertState;
  labels: {
    weightsZero: string;
    weightsPartial: string;
    rulesUnset: string;
    setRules: string;
  };
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-foreground"
    >
      <div className="flex flex-col gap-1">
        {state.weightIssue === 'zero' ? (
          <p>{labels.weightsZero}</p>
        ) : null}
        {state.weightIssue === 'partial' ? (
          <p>{labels.weightsPartial}</p>
        ) : null}
        {state.rulesIncomplete ? <p>{labels.rulesUnset}</p> : null}
      </div>
      <Link
        href={`/comparisons/${comparisonId}/rules`}
        className="w-fit text-sm font-medium text-foreground underline underline-offset-4"
      >
        {labels.setRules}
      </Link>
    </div>
  );
}

export async function ResultsConfigAlert({
  comparisonId,
  criteria,
}: {
  comparisonId: number;
  criteria: ReadonlyArray<Criterion>;
}) {
  const state = getResultsConfigAlertState(criteria);
  if (state === null) {
    return null;
  }

  const t = await getTranslations('results');

  return (
    <ResultsConfigAlertView
      comparisonId={comparisonId}
      state={state}
      labels={{
        weightsZero: t('configAlert.weightsZero'),
        weightsPartial: t('configAlert.weightsPartial', {
          remaining: state.remaining,
          total: WEIGHT_POOL_TOTAL,
        }),
        rulesUnset: t('configAlert.rulesUnset'),
        setRules: t('configAlert.setRules'),
      }}
    />
  );
}
