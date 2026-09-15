'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MinusIcon, PlusIcon } from 'lucide-react';
import {
  remainingWeightPool,
  WEIGHT_POOL_TOTAL,
  type ComparisonDetailsResponse,
} from '@compy/shared';
import {
  updateCriterionRuleConfig,
  updateCriterionWeight,
} from '@/lib/actions';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EnumRuleDialog } from '@/components/enum-rule-dialog';
import { enumOptionsOf } from '@/lib/create-entry';
import {
  formatRuleMessage,
  hasDirection,
  hasPreferredValue,
  nextBooleanRuleConfig,
  nextDirectionRuleConfig,
} from '@/lib/format-rule';

type Criterion = ComparisonDetailsResponse['criteria'][number];

const WEIGHT_SAVE_DEBOUNCE_MS = 300;

function weightsFrom(criteria: Criterion[]) {
  return Object.fromEntries(
    criteria
      .filter((criterion) => criterion.is_comparable)
      .map((criterion) => [criterion.id, criterion.weight]),
  );
}

function ruleConfigsFrom(criteria: Criterion[]) {
  return Object.fromEntries(
    criteria
      .filter((criterion) => criterion.is_comparable)
      .map((criterion) => [criterion.id, criterion.ruleConfig]),
  );
}

function sameRuleConfig(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function RuleEditor({
  criterion,
  ruleConfig,
  onChange,
}: {
  criterion: Criterion;
  ruleConfig: unknown;
  onChange: (next: unknown) => void;
}) {
  const t = useTranslations();

  if (criterion.type === 'number' || criterion.type === 'rating') {
    const direction = hasDirection(ruleConfig) ? ruleConfig.direction : '';

    return (
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={direction}
        onValueChange={(next) => {
          if (next !== 'higher' && next !== 'lower') {
            return;
          }

          onChange(nextDirectionRuleConfig(criterion, next, ruleConfig));
        }}
        aria-label={t('rules.ruleFor', { name: criterion.name })}
      >
        <ToggleGroupItem value="higher">
          {t('rules.higherIsBetter')}
        </ToggleGroupItem>
        <ToggleGroupItem value="lower">
          {t('rules.lowerIsBetter')}
        </ToggleGroupItem>
      </ToggleGroup>
    );
  }

  if (criterion.type === 'boolean') {
    const preferred = hasPreferredValue(ruleConfig)
      ? ruleConfig.preferredValue
        ? 'yes'
        : 'no'
      : '';

    return (
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={preferred}
        onValueChange={(next) => {
          if (next !== 'yes' && next !== 'no') {
            return;
          }

          onChange(nextBooleanRuleConfig(next === 'yes'));
        }}
        aria-label={t('rules.ruleFor', { name: criterion.name })}
      >
        <ToggleGroupItem value="yes">{t('rules.yesIsBetter')}</ToggleGroupItem>
        <ToggleGroupItem value="no">{t('rules.noIsBetter')}</ToggleGroupItem>
      </ToggleGroup>
    );
  }

  if (criterion.type === 'enum') {
    return (
      <EnumRuleDialog
        criterionName={criterion.name}
        options={enumOptionsOf({ ...criterion, ruleConfig })}
        ruleConfig={ruleConfig}
        onSave={onChange}
      />
    );
  }

  const message = formatRuleMessage({ ...criterion, ruleConfig });
  return message.id === 'rules.enumSummary'
    ? t(message.id, message.values)
    : t(message.id);
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
  const t = useTranslations();
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
        aria-label={t('rules.decreaseWeight', { name })}
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon />
      </Button>
      <Input
        type="text"
        inputMode="numeric"
        aria-label={t('rules.weightFor', { name })}
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
        aria-label={t('rules.increaseWeight', { name })}
        disabled={remaining <= 0 || value >= WEIGHT_POOL_TOTAL}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}

export function RulesDataTable({
  publicId,
  criteria,
}: {
  publicId: string;
} & Pick<ComparisonDetailsResponse, 'criteria'>) {
  const t = useTranslations();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [weights, setWeights] = useState(() => weightsFrom(criteria));
  const [ruleConfigs, setRuleConfigs] = useState(() =>
    ruleConfigsFrom(criteria),
  );
  const [error, setError] = useState<string>();
  const lastSavedRef = useRef(weightsFrom(criteria));
  const lastSavedRulesRef = useRef(ruleConfigsFrom(criteria));
  const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const pendingRulesRef = useRef(new Set<number>());
  const ruleRequestRef = useRef(new Map<number, number>());
  const criteriaKey = criteria
    .map(
      (criterion) =>
        `${criterion.id}:${criterion.weight}:${JSON.stringify(criterion.ruleConfig)}`,
    )
    .join(',');

  useEffect(() => {
    if (timersRef.current.size > 0 || pendingRulesRef.current.size > 0) {
      return;
    }

    const nextWeights = weightsFrom(criteria);
    setWeights(nextWeights);
    lastSavedRef.current = nextWeights;
    const nextRules = ruleConfigsFrom(criteria);
    setRuleConfigs(nextRules);
    lastSavedRulesRef.current = nextRules;
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
          publicId,
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

  function applyRule(criterion: Criterion, nextRuleConfig: unknown) {
    const currentRuleConfig = ruleConfigs[criterion.id] ?? criterion.ruleConfig;

    if (sameRuleConfig(currentRuleConfig, nextRuleConfig)) {
      return;
    }

    const requestId = (ruleRequestRef.current.get(criterion.id) ?? 0) + 1;
    ruleRequestRef.current.set(criterion.id, requestId);
    pendingRulesRef.current.add(criterion.id);
    setError(undefined);
    setRuleConfigs((current) => ({
      ...current,
      [criterion.id]: nextRuleConfig,
    }));

    startTransition(async () => {
      const result = await updateCriterionRuleConfig(
        publicId,
        criterion.id,
        nextRuleConfig,
      );

      if (ruleRequestRef.current.get(criterion.id) !== requestId) {
        return;
      }

      pendingRulesRef.current.delete(criterion.id);

      if (result.error) {
        setRuleConfigs((current) => {
          if (!sameRuleConfig(current[criterion.id], nextRuleConfig)) {
            return current;
          }

          return {
            ...current,
            [criterion.id]: lastSavedRulesRef.current[criterion.id] ?? null,
          };
        });
        setError(result.error);
        return;
      }

      lastSavedRulesRef.current[criterion.id] = nextRuleConfig;
      router.refresh();
    });
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
                <TableHead>{t('rules.name')}</TableHead>
                <TableHead>{t('rules.rule')}</TableHead>
                <TableHead>
                  <div className="flex flex-col gap-0.5">
                    <span>{t('rules.weight')}</span>
                    <span
                      className="text-xs font-normal text-muted-foreground"
                      aria-live="polite"
                    >
                      {t.rich('rules.remaining', {
                        remaining,
                        total: WEIGHT_POOL_TOTAL,
                        bold: (chunks) => <b>{chunks}</b>,
                      })}
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
                    {t('rules.empty')}
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
                      <TableCell>
                        <RuleEditor
                          criterion={criterion}
                          ruleConfig={
                            ruleConfigs[criterion.id] ?? criterion.ruleConfig
                          }
                          onChange={(nextRuleConfig) =>
                            applyRule(criterion, nextRuleConfig)
                          }
                        />
                      </TableCell>
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
