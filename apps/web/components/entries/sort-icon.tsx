import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export function SortIcon({ direction }: { direction: 'asc' | 'desc' | null }) {
  if (direction === 'asc') {
    return <ArrowUp aria-hidden="true" className="size-3.5" />;
  }

  if (direction === 'desc') {
    return <ArrowDown aria-hidden="true" className="size-3.5" />;
  }

  return <ArrowUpDown aria-hidden="true" className="size-3.5" />;
}
