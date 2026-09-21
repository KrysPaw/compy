import type { ReactNode } from 'react';

export function DialogPanel({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="grid w-full max-w-md gap-6 bg-popover p-6 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10">
      <div className="flex flex-col gap-2">
        <h4 className="font-heading text-lg leading-none font-semibold tracking-wider uppercase">
          {title}
        </h4>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
