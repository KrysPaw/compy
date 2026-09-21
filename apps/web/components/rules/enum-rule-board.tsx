'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { DropBucket } from '@/components/rules/drop-bucket';
import { OptionChip } from '@/components/rules/option-chip';
import type { EnumRuleBucketId, EnumRuleDraft } from '@/lib/format-rule';

export const UNASSIGNED_ID = 'unassigned' as const;

function bucketIdFromDroppable(id: string | number): EnumRuleBucketId | null {
  const value = String(id);
  if (value === UNASSIGNED_ID) {
    return UNASSIGNED_ID;
  }

  if (value.startsWith('tier:')) {
    const rank = Number.parseInt(value.slice('tier:'.length), 10);
    return Number.isInteger(rank) ? rank : null;
  }

  return null;
}

export function EnumRuleBoard({
  draft,
  onMove,
}: {
  draft: EnumRuleDraft;
  onMove: (value: string, to: EnumRuleBucketId) => void;
}) {
  const t = useTranslations('enumRule');
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const sortedTiers = useMemo(
    () => [...draft.tiers].sort((a, b) => a.rank - b.rank),
    [draft.tiers],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveValue(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveValue(null);
    const { active, over } = event;
    if (!over) {
      return;
    }

    const to = bucketIdFromDroppable(over.id);
    if (to == null) {
      return;
    }

    onMove(String(active.id), to);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveValue(null)}
    >
      <div className="grid gap-3">
        <DropBucket
          id={UNASSIGNED_ID}
          title={t('unassigned')}
          values={draft.unassigned}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTiers.map((tier, index) => {
            const isBest = index === 0;
            const isWorst = index === sortedTiers.length - 1;
            const hint = isBest ? t('best') : isWorst ? t('worst') : undefined;

            return (
              <DropBucket
                key={tier.rank}
                id={`tier:${tier.rank}`}
                title={t('tier', { n: index + 1 })}
                values={tier.values}
                hint={hint}
              />
            );
          })}
        </div>
      </div>
      {createPortal(
        <DragOverlay dropAnimation={null}>
          {activeValue ? <OptionChip value={activeValue} dragging /> : null}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}
