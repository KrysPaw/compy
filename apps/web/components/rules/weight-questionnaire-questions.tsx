'use client';

import { useTranslations } from 'next-intl';
import type { CriterionPair, PairwiseAnswer } from '@compy/shared';
import { Button } from '@/components/ui/button';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function WeightQuestionnaireQuestions({
  currentPair,
  questionNumber,
  remaining,
  nameFor,
  error,
  isPending,
  canGoBack,
  onAnswer,
  onCancel,
  onBack,
}: {
  currentPair: CriterionPair | undefined;
  questionNumber: number;
  remaining: number;
  nameFor: (id: number) => string;
  error?: string;
  isPending: boolean;
  canGoBack: boolean;
  onAnswer: (answer: PairwiseAnswer) => void;
  onCancel: () => void;
  onBack: () => void;
}) {
  const t = useTranslations();

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('weightQuestionnaire.question')}</DialogTitle>
        <DialogDescription>
          {t('weightQuestionnaire.questionHint')}
        </DialogDescription>
      </DialogHeader>

      {currentPair ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5 text-sm">
            <p>{t('weightQuestionnaire.progress', { n: questionNumber })}</p>
            <p className="text-muted-foreground">
              {t('weightQuestionnaire.undecided', { count: remaining })}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onAnswer('a')}
            >
              {nameFor(currentPair.a)}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onAnswer('b')}
            >
              {nameFor(currentPair.b)}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onAnswer('both')}
            >
              {t('weightQuestionnaire.both')}
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
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canGoBack || isPending}
          onClick={onBack}
        >
          {t('common.back')}
        </Button>
      </DialogFooter>
    </>
  );
}
