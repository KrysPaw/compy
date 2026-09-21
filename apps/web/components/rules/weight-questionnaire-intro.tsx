'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function WeightQuestionnaireIntro({
  pairCount,
  hasExistingWeights,
  onCancel,
  onContinue,
}: {
  pairCount: number;
  hasExistingWeights: boolean;
  onCancel: () => void;
  onContinue: () => void;
}) {
  const t = useTranslations();

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('weightQuestionnaire.title')}</DialogTitle>
        <DialogDescription>
          {t('weightQuestionnaire.introDescription')}{' '}
          {t('weightQuestionnaire.maxQuestions', { count: pairCount })}
          {hasExistingWeights
            ? ` ${t('weightQuestionnaire.replaceNote')}`
            : null}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="button" onClick={onContinue}>
          {t('common.continue')}
        </Button>
      </DialogFooter>
    </>
  );
}
