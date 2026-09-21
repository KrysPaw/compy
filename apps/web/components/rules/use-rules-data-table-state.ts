'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { remainingWeightPool } from '@compy/shared';
import {
  updateCriterionRuleConfig,
  updateCriterionWeight,
} from '@/lib/actions';
import { type Criterion } from '@/components/rules/rule-editor';
import {
  ruleConfigsFrom,
  sameRuleConfig,
  weightsFrom,
} from '@/components/rules/rules-table-state';

const WEIGHT_SAVE_DEBOUNCE_MS = 300;

export function useRulesDataTableState(
  publicId: string,
  criteria: Criterion[],
) {
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

  return {
    comparableCriteria,
    weights,
    ruleConfigs,
    remaining,
    error,
    applyWeight,
    applyRule,
  };
}
