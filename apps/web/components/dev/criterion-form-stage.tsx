'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CREATE_CRITERION_INITIAL_STATE,
  CreateCriterionForm,
  type CreateCriterionFormState,
} from '@/components/criteria/create-criterion-form';
import { DialogPanel } from '@/components/dev/dialog-panel';
import { GalleryStage } from '@/components/dev/gallery-stage';

type CriterionStage = {
  id: string;
  title: string;
  description: string;
  initialState: CreateCriterionFormState;
};

export const CRITERION_STAGES: CriterionStage[] = [
  {
    id: 'create-criterion-identity',
    title: 'Identity only (default)',
    description: 'Comparable off — maps to text / not ranked.',
    initialState: {
      ...CREATE_CRITERION_INITIAL_STATE,
      name: 'SKU / notes',
      isComparable: false,
    },
  },
  {
    id: 'create-criterion-number',
    title: 'Comparable number',
    description: 'Comparable on, type number.',
    initialState: {
      ...CREATE_CRITERION_INITIAL_STATE,
      name: 'Battery life',
      isComparable: true,
      type: 'number',
    },
  },
  {
    id: 'create-criterion-boolean',
    title: 'Yes / No',
    description: 'Comparable on, type boolean.',
    initialState: {
      ...CREATE_CRITERION_INITIAL_STATE,
      name: 'Wireless charging',
      isComparable: true,
      type: 'boolean',
    },
  },
  {
    id: 'create-criterion-rating',
    title: 'Rating scale',
    description: 'Comparable on, type rating with min/max.',
    initialState: {
      ...CREATE_CRITERION_INITIAL_STATE,
      name: 'Build quality',
      isComparable: true,
      type: 'rating',
      ratingMin: '1',
      ratingMax: '5',
    },
  },
  {
    id: 'create-criterion-enum',
    title: 'Choice list',
    description: 'Comparable on, type enum with options.',
    initialState: {
      ...CREATE_CRITERION_INITIAL_STATE,
      name: 'Size',
      isComparable: true,
      type: 'enum',
      enumOptions: ['S', 'M', 'L', 'XL'],
    },
  },
  {
    id: 'create-criterion-error',
    title: 'Error state',
    description: 'Shows inline validation / API error treatment.',
    initialState: {
      ...CREATE_CRITERION_INITIAL_STATE,
      name: 'Battery life',
      isComparable: true,
      type: 'number',
    },
  },
];

export function CriterionFormStage({
  stage,
  error,
}: {
  stage: CriterionStage;
  error?: string;
}) {
  const t = useTranslations();
  const [state, setState] = useState(stage.initialState);

  return (
    <GalleryStage
      id={stage.id}
      title={stage.title}
      description={stage.description}
    >
      <DialogPanel
        title={t('createCriterion.title')}
        description={t('createCriterion.description')}
      >
        <CreateCriterionForm
          state={state}
          onStateChange={setState}
          error={error}
          idPrefix={stage.id}
          onSubmit={() => undefined}
        />
      </DialogPanel>
    </GalleryStage>
  );
}
