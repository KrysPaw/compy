import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function GalleryStage({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-24 rounded-none border border-border bg-card p-4',
        className,
      )}
    >
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="font-heading text-sm font-semibold tracking-wider uppercase">
          {title}
        </h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
        <code className="text-[11px] text-muted-foreground">#{id}</code>
      </div>
      {children}
    </section>
  );
}
