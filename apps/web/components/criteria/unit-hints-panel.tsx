'use client';

import type { CSSProperties, Ref } from 'react';
import { RemoveScroll } from 'react-remove-scroll';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UnitHintGroupItem = {
  value: string;
  items: string[];
};

export function UnitHintsPanel({
  panelRef,
  style,
  groups,
  unit,
  onSelect,
}: {
  panelRef: Ref<HTMLDivElement>;
  style: CSSProperties;
  groups: UnitHintGroupItem[];
  unit: string;
  onSelect: (unit: string) => void;
}) {
  return (
    <RemoveScroll allowPinchZoom>
      <div
        ref={panelRef}
        data-slot="unit-hints"
        style={style}
        className="pointer-events-auto overflow-x-hidden overflow-y-auto rounded-none bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10"
        // Keep focus in the input so free-text typing is not interrupted.
        onMouseDown={(event) => event.preventDefault()}
      >
        {groups.map((group, index) => (
          <div key={group.value} className="py-1">
            {index > 0 ? (
              <div className="mx-1.5 my-1 h-px bg-border/50" />
            ) : null}
            <p className="px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {group.value}
            </p>
            <ul className="p-1.5 pt-0">
              {group.items.map((item) => {
                const selected = unit === item;
                return (
                  <li key={item}>
                    <button
                      type="button"
                      className={cn(
                        'relative flex w-full cursor-default items-center gap-2.5 rounded-none py-2 pr-8 pl-3 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground',
                        selected && 'bg-accent text-accent-foreground',
                      )}
                      onClick={() => onSelect(item)}
                    >
                      {item}
                      {selected ? (
                        <CheckIcon className="pointer-events-none absolute right-2 size-4" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </RemoveScroll>
  );
}
