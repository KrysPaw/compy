'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CreateCriterionTypeCard({
  icon: Icon,
  title,
  helper,
  selected,
  onSelect,
}: {
  icon: LucideIcon;
  title: string;
  helper: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      className={cn(
        'flex flex-col gap-1.5 rounded-lg border-2 p-3 text-left transition-colors',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        selected
          ? 'border-primary bg-secondary'
          : 'border-border bg-card hover:bg-muted',
      )}
    >
      <Icon aria-hidden className="size-4 text-foreground" />
      <span className="text-[13px] leading-snug font-medium">{title}</span>
      <span className="text-xs leading-snug text-muted-foreground">
        {helper}
      </span>
    </button>
  );
}
