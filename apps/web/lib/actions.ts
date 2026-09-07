'use server';

import { z } from 'zod';
import {
  CreateComparisonSchema,
  ComparisonResponseSchema,
  CreateCriterionSchema,
} from '@compy/shared';
import { API_URL } from './api';

const CriterionResponseSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateComparisonState = {
  error?: string;
  comparisonId?: number;
};

export type DeleteComparisonState = {
  error?: string;
};

export async function createComparison(
  formData: FormData,
): Promise<CreateComparisonState> {
  const parsed = CreateComparisonSchema.safeParse({
    name: formData.get('name'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid name' };
  }

  const res = await fetch(`${API_URL}/comparisons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return { error: 'Failed to create comparison' };
  }

  const comparison = ComparisonResponseSchema.parse(await res.json());
  return { comparisonId: comparison.id };
}

export type CreateCriterionState = {
  error?: string;
  criterionId?: number;
};

export async function createCriterion(
  comparisonId: number,
  input: unknown,
): Promise<CreateCriterionState> {
  const parsed = CreateCriterionSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const res = await fetch(`${API_URL}/comparisons/${comparisonId}/criteria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return { error: 'Failed to create criterion' };
  }

  const criterion = CriterionResponseSchema.parse(await res.json());
  return { criterionId: criterion.id };
}

export async function deleteComparison(
  comparisonId: number,
): Promise<DeleteComparisonState> {
  const res = await fetch(`${API_URL}/comparisons/${comparisonId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    return { error: 'Failed to delete comparison' };
  }

  return {};
}
