'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MinusIcon, PlusIcon } from 'lucide-react';
import {
  remainingWeightPool,
  WEIGHT_POOL_TOTAL,
  type ComparisonDetailsResponse,
} from '@compy/shared';
import { updateCriterionWeight } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatRuleMessage } from '@/lib/format-rule';

type Criterion = ComparisonDetailsResponse['criteria'][number];

const WEIGHT_SAVE_DEBOUNCE_MS = 300;

function weightsFrom(criteria: Criterion[]) {
  return Object.fromEntries(
    criteria
      .filter((criterion) => criterion.is_comparable)
      .map((criterion) => [criterion.id, criterion.weight]),
  );
}

function WeightStepper({
  name,
  value,
  remaining,
  onChange,
}: {
  name: string;
  value: number;
  remaining: number;
  onChange: (next: number) => void;
}) {
  const max = Math.min(WEIGHT_POOL_TOTAL, value + Math.max(0, remaining));
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commitDraft() {
    const parsed = Number.parseInt(draft, 10);

    if (!Number.isInteger(parsed)) {
      setDraft(String(value));
      return;
    }

    const clamped = Math.min(max, Math.max(0, parsed));
    setDraft(String(clamped));

    if (clamped !== value) {
      onChange(clamped);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="default"
        size="icon-xs"
        aria-label={`Decrease weight for ${name}`}
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon />
      </Button>
      <Input
        type="text"
        inputMode="numeric"
        aria-label={`Weight for ${name}`}
        className="h-7 w-12 px-1 text-center"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
      />
      <Button
        type="button"
        variant="default"
        size="icon-xs"
        aria-label={`Increase weight for ${name}`}
        disabled={remaining <= 0 || value >= WEIGHT_POOL_TOTAL}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}

export function RulesDataTable({
  comparisonId,
  criteria,
}: {
  comparisonId: number;
} & Pick<ComparisonDetailsResponse, 'criteria'>) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [weights, setWeights] = useState(() => weightsFrom(criteria));
  const [error, setError] = useState<string>();
  const lastSavedRef = useRef(weightsFrom(criteria));
  const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const criteriaKey = criteria
    .map((criterion) => `${criterion.id}:${criterion.weight}`)
    .join(',');

  useEffect(() => {
    if (timersRef.current.size > 0) {
      return;
    }

    const next = weightsFrom(criteria);
    setWeights(next);
    lastSavedRef.current = next;
  }, [criteria, criteriaKey]);

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  const comparableCriteria = criteria.filter(
    (criterion) => criterion.is_comparable,
  );
  const remaining = remainingWeightPool(
    comparableCriteria.map((criterion) => ({
      is_comparable: true,
      weight: weights[criterion.id] ?? criterion.weight,
    })),
  );

  function scheduleSave(criterionId: number, nextWeight: number) {
    const existing = timersRef.current.get(criterionId);

    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      timersRef.current.delete(criterionId);
      startTransition(async () => {
        const result = await updateCriterionWeight(
          comparisonId,
          criterionId,
          nextWeight,
        );

        if (result.error) {
          setWeights((current) => {
            if (current[criterionId] !== nextWeight) {
              return current;
            }

            return {
              ...current,
              [criterionId]: lastSavedRef.current[criterionId] ?? 0,
            };
          });
          setError(result.error);
          return;
        }

        lastSavedRef.current[criterionId] = nextWeight;
        router.refresh();
      });
    }, WEIGHT_SAVE_DEBOUNCE_MS);

    timersRef.current.set(criterionId, timer);
  }

  function applyWeight(criterionId: number, nextWeight: number) {
    const currentWeight = weights[criterionId] ?? 0;

    if (nextWeight === currentWeight) {
      return;
    }

    setError(undefined);
    setWeights((current) => ({ ...current, [criterionId]: nextWeight }));
    scheduleSave(criterionId, nextWeight);
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rule</TableHead>
                <TableHead>
                  <div className="flex flex-col gap-0.5">
                    <span>Weight</span>
                    <span
                      className="text-xs font-normal text-muted-foreground"
                      aria-live="polite"
                    >
                      Remaining: <b>{remaining}</b> / {WEIGHT_POOL_TOTAL}
                    </span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparableCriteria.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No comparable criteria yet.
                  </TableCell>
                </TableRow>
              ) : (
                comparableCriteria.map((criterion: Criterion) => {
                  const weight = weights[criterion.id] ?? criterion.weight;

                  return (
                    <TableRow key={criterion.id}>
                      <TableCell className="font-medium text-foreground">
                        {criterion.name}
                      </TableCell>
                      <TableCell>{formatRuleMessage(criterion)}</TableCell>
                      <TableCell>
                        <WeightStepper
                          name={criterion.name}
                          value={weight}
                          remaining={remaining}
                          onChange={(nextWeight) =>
                            applyWeight(criterion.id, nextWeight)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
