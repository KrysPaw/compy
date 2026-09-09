'use client';

import { useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  addEnumTier,
  createEnumRuleDraft,
  enumRuleDraftToConfig,
  formatEnumRuleSummary,
  isEnumRuleDraftComplete,
  moveEnumValue,
  removeEnumTier,
  type EnumRuleBucketId,
  type EnumRuleDraft,
} from '@/lib/format-rule';

const UNASSIGNED_ID = 'unassigned' as const;

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

function OptionChip({
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

function DraggableOption({ value }: { value: string }) {
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

function DropBucket({
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

function EnumRuleBoard({
  draft,
  onMove,
}: {
  draft: EnumRuleDraft;
  onMove: (value: string, to: EnumRuleBucketId) => void;
}) {
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
          title="Unassigned"
          values={draft.unassigned}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTiers.map((tier, index) => {
            const isBest = index === 0;
            const isWorst = index === sortedTiers.length - 1;
            const hint = isBest ? 'Best' : isWorst ? 'Worst' : undefined;

            return (
              <DropBucket
                key={tier.rank}
                id={`tier:${tier.rank}`}
                title={`Tier ${index + 1}`}
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

export function EnumRuleDialog({
  criterionName,
  options,
  ruleConfig,
  onSave,
}: {
  criterionName: string;
  options: string[];
  ruleConfig: unknown;
  onSave: (next: unknown) => void;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() =>
    createEnumRuleDraft(options, ruleConfig),
  );

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(createEnumRuleDraft(options, ruleConfig));
    }
    setOpen(next);
  }

  const canSave = isEnumRuleDraftComplete(draft, options);
  const summary = formatEnumRuleSummary(ruleConfig);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="truncate text-sm">{summary}</span>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="xs">
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-5xl"
          aria-labelledby={titleId}
        >
          <DialogHeader>
            <DialogTitle id={titleId}>Edit rule · {criterionName}</DialogTitle>
            <DialogDescription>
              Drag options into tiers. Tier 1 is best; the last tier is worst.
              Save when every option is assigned exactly once.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              aria-label="Remove tier"
              disabled={draft.tiers.length <= 2}
              onClick={() => setDraft((current) => removeEnumTier(current))}
            >
              <MinusIcon />
            </Button>
            <span className="text-xs tracking-wide text-muted-foreground uppercase">
              {draft.tiers.length} tiers
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              aria-label="Add tier"
              disabled={draft.tiers.length >= 10}
              onClick={() => setDraft((current) => addEnumTier(current))}
            >
              <PlusIcon />
            </Button>
          </div>

          <EnumRuleBoard
            draft={draft}
            onMove={(value, to) =>
              setDraft((current) => moveEnumValue(current, value, to))
            }
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canSave}
              onClick={() => {
                onSave(enumRuleDraftToConfig(draft));
                setOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
