'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  comparablePairs,
  inferredAnswer,
  nextUndecidedPair,
  pairKey,
  weightsFromPairwiseAnswers,
  type ComparisonDetailsResponse,
  type CriterionPair,
  type PairwiseAnswer,
  type PairwiseAskedAnswers,
} from '@compy/shared';
import { replaceCriterionWeights } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type Criterion = ComparisonDetailsResponse['criteria'][number];

type AskedStep = {
  pair: CriterionPair;
  answer: PairwiseAnswer;
};

type DialogStep = 'intro' | 'questions';

function askedRecord(steps: AskedStep[]): PairwiseAskedAnswers {
  return Object.fromEntries(
    steps.map((step) => [pairKey(step.pair), step.answer]),
  );
}

function criterionName(criteria: Criterion[], id: number) {
  return criteria.find((criterion) => criterion.id === id)?.name ?? String(id);
}

export function WeightQuestionnaireDialog({
  comparisonId,
  criteria,
}: {
  comparisonId: number;
} & Pick<ComparisonDetailsResponse, 'criteria'>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<DialogStep>('intro');
  const [asked, setAsked] = useState<AskedStep[]>([]);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const comparableCriteria = criteria.filter(
    (criterion) => criterion.is_comparable,
  );
  const pairs = useMemo(() => comparablePairs(criteria), [criteria]);
  const canStart = comparableCriteria.length >= 2;
  const hasExistingWeights = comparableCriteria.some(
    (criterion) => criterion.weight > 0,
  );

  const answers = askedRecord(asked);
  const nextPair = nextUndecidedPair(pairs, answers);
  const currentPair = nextPair ?? asked[asked.length - 1]?.pair;
  const remaining = pairs.filter(
    (pair) => inferredAnswer(answers, pair) === undefined,
  ).length;
  const questionNumber = nextPair ? asked.length + 1 : asked.length;

  function reset() {
    setStep('intro');
    setAsked([]);
    setError(undefined);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
    }
  }

  function handleBack() {
    setError(undefined);
    setAsked((current) => current.slice(0, -1));
  }

  function handleAnswer(answer: PairwiseAnswer) {
    if (currentPair === undefined || isPending) {
      return;
    }

    const nextAsked = nextPair
      ? [...asked, { pair: currentPair, answer }]
      : asked.map((stepItem, index) =>
          index === asked.length - 1
            ? { pair: currentPair, answer }
            : stepItem,
        );
    const nextAnswers = askedRecord(nextAsked);

    setAsked(nextAsked);
    setError(undefined);

    if (nextUndecidedPair(pairs, nextAnswers) !== undefined) {
      return;
    }

    startTransition(async () => {
      const result = await replaceCriterionWeights(comparisonId, {
        weights: weightsFromPairwiseAnswers(pairs, nextAnswers),
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" disabled={!canStart}>
          Distribute weights
        </Button>
      </DialogTrigger>
      <DialogContent>
        {step === 'intro' ? (
          <>
            <DialogHeader>
              <DialogTitle>Distribute weights</DialogTitle>
              <DialogDescription>
                You will answer short preference questions about your
                comparable criteria. Each question asks which criterion
                matters more, or whether both matter equally.{' '}
                {`There will be at most ${pairs.length} question${pairs.length === 1 ? '' : 's'}.`}
                {hasExistingWeights
                  ? ' Your current weights will be replaced when you finish.'
                  : null}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={() => setStep('questions')}>
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>What is more important to you?</DialogTitle>
              <DialogDescription>
                Choose one criterion, or both if they matter equally.
              </DialogDescription>
            </DialogHeader>

            {currentPair ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-0.5 text-sm">
                  <p>Question {questionNumber}</p>
                  <p className="text-muted-foreground">
                    {`${remaining} undecided comparison${remaining === 1 ? '' : 's'}`}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handleAnswer('a')}
                  >
                    {criterionName(comparableCriteria, currentPair.a)}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handleAnswer('b')}
                  >
                    {criterionName(comparableCriteria, currentPair.b)}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handleAnswer('both')}
                  >
                    Both
                  </Button>
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={asked.length === 0 || isPending}
                onClick={handleBack}
              >
                Back
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
