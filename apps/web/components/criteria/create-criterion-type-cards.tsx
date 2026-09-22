'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Check,
  Fingerprint,
  Hash,
  List,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { CreateCriterionTypeCard } from '@/components/criteria/create-criterion-type-card';
import type {
  ComparableType,
  CreateCriterionFormState,
} from '@/components/criteria/create-criterion-form';

export type CriterionTypeCardId = 'identity' | ComparableType;

export const CRITERION_TYPE_CARD_IDS: CriterionTypeCardId[] = [
  'identity',
  'number',
  'boolean',
  'rating',
  'enum',
];

const CARD_ICONS: Record<CriterionTypeCardId, LucideIcon> = {
  identity: Fingerprint,
  number: Hash,
  boolean: Check,
  rating: Star,
  enum: List,
};

export function selectedCriterionTypeCard(
  isComparable: boolean,
  type: ComparableType,
): CriterionTypeCardId {
  return isComparable ? type : 'identity';
}

export function typeCardSelectionPatch(
  id: CriterionTypeCardId,
): Partial<CreateCriterionFormState> {
  if (id === 'identity') {
    return { isComparable: false };
  }

  return { isComparable: true, type: id };
}

export function CreateCriterionTypeCards({
  labelledBy,
  selected,
  onSelect,
}: {
  labelledBy: string;
  selected: CriterionTypeCardId;
  onSelect: (id: CriterionTypeCardId) => void;
}) {
  const t = useTranslations('createCriterion.cards');
  const groupRef = useRef<HTMLDivElement>(null);

  function moveSelection(delta: number) {
    const index = CRITERION_TYPE_CARD_IDS.indexOf(selected);
    const nextIndex =
      (index + delta + CRITERION_TYPE_CARD_IDS.length) %
      CRITERION_TYPE_CARD_IDS.length;
    const next = CRITERION_TYPE_CARD_IDS[nextIndex];
    onSelect(next);
    queueMicrotask(() => {
      groupRef.current
        ?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')
        ?.focus();
    });
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="grid grid-cols-2 gap-2"
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          moveSelection(1);
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          moveSelection(-1);
        }
      }}
    >
      {CRITERION_TYPE_CARD_IDS.map((id) => (
        <CreateCriterionTypeCard
          key={id}
          icon={CARD_ICONS[id]}
          title={t(`${id}.title`)}
          helper={t(`${id}.helper`)}
          selected={selected === id}
          onSelect={() => onSelect(id)}
        />
      ))}
    </div>
  );
}
