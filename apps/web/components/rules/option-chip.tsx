export function OptionChip({
  value,
  dragging = false,
}: {
  value: string;
  dragging?: boolean;
}) {
  return (
    <div
      className={
        dragging
          ? 'cursor-grabbing border border-foreground/20 bg-popover px-2 py-1 text-xs shadow-md'
          : 'cursor-grab border border-border bg-background px-2 py-1 text-xs hover:bg-muted'
      }
    >
      {value}
    </div>
  );
}
