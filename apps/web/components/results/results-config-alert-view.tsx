import Link from 'next/link';
import type { ResultsConfigAlertState } from '@/lib/results-config-alert';

export function ResultsConfigAlertView({
  publicId,
  state,
  labels,
}: {
  publicId: string;
  state: ResultsConfigAlertState;
  labels: {
    weightsZero: string;
    weightsPartial: string;
    rulesUnset: string;
    valuesMissing: string;
    setRules: string;
    completeEntries: string;
  };
}) {
  const showRulesLink =
    state.weightIssue !== null || state.rulesIncomplete;
  const showEntriesLink = state.valuesMissing;

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
        {state.valuesMissing ? <p>{labels.valuesMissing}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {showRulesLink ? (
          <Link
            href={`/comparisons/${publicId}/rules`}
            className="w-fit text-sm font-medium text-foreground underline underline-offset-4"
          >
            {labels.setRules}
          </Link>
        ) : null}
        {showRulesLink && showEntriesLink ? (
          <span className="select-none text-muted-foreground" aria-hidden>
            ·
          </span>
        ) : null}
        {showEntriesLink ? (
          <Link
            href={`/comparisons/${publicId}/entries`}
            className="w-fit text-sm font-medium text-foreground underline underline-offset-4"
          >
            {labels.completeEntries}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
