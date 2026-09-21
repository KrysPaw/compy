'use client';

import { useDroppable } from '@dnd-kit/core';
import { DraggableOption } from '@/components/rules/draggable-option';

export function DropBucket({
  id,
  title,
  values,
  hint,
}: {
  id: string;
  title: string;
  values: string[];
  hint?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={
        isOver
          ? 'flex min-h-28 flex-col gap-2 border border-foreground/40 bg-muted/60 p-3'
          : 'flex min-h-28 flex-col gap-2 border border-border bg-muted/20 p-3'
      }
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold tracking-widest uppercase">
          {title}
        </p>
        {hint ? (
          <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <DraggableOption key={value} value={value} />
        ))}
      </div>
    </div>
  );
}
