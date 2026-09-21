'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { WeightQuestionnaireIntro } from '@/components/rules/weight-questionnaire-intro';
import { WeightQuestionnaireQuestions } from '@/components/rules/weight-questionnaire-questions';

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
  publicId,
  criteria,
}: {
  publicId: string;
} & Pick<ComparisonDetailsResponse, 'criteria'>) {
  const router = useRouter();
  const t = useTranslations();
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
      const result = await replaceCriterionWeights(publicId, {
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
          {t('weightQuestionnaire.trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {step === 'intro' ? (
          <WeightQuestionnaireIntro
            pairCount={pairs.length}
            hasExistingWeights={hasExistingWeights}
            onCancel={() => handleOpenChange(false)}
            onContinue={() => setStep('questions')}
          />
        ) : (
          <WeightQuestionnaireQuestions
            currentPair={currentPair}
            questionNumber={questionNumber}
            remaining={remaining}
            nameFor={(id) => criterionName(comparableCriteria, id)}
            error={error}
            isPending={isPending}
            canGoBack={asked.length > 0}
            onAnswer={handleAnswer}
            onCancel={() => handleOpenChange(false)}
            onBack={handleBack}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
