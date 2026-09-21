import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Animates height from 0 without unmounting, so fields stay in the DOM for layout transitions.
export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows] duration-200 ease-out',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}
    >
      <div className="overflow-hidden">
        <div
          className={cn(
            'flex flex-col gap-4 transition-opacity duration-150',
            open ? 'opacity-100' : 'opacity-0',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
