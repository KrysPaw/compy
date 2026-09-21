'use client';

import { useDraggable } from '@dnd-kit/core';
import { OptionChip } from '@/components/rules/option-chip';

export function DraggableOption({ value }: { value: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: value,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      {...listeners}
      {...attributes}
    >
      <OptionChip value={value} />
    </div>
  );
}
