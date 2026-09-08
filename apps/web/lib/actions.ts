'use server';

import { z } from 'zod';
import {
  CreateComparisonSchema,
  ComparisonResponseSchema,
  CreateCriterionSchema,
  CreateEntrySchema,
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

export type CreateEntryState = {
  error?: string;
  entryId?: number;
};

const EntryResponseSchema = z.object({
  id: z.coerce.number().int().positive(),
});

async function readApiErrorMessage(res: Response, fallback: string) {
  try {
    const body: unknown = await res.json();
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = body.message;
      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
      if (Array.isArray(message) && typeof message[0] === 'string') {
        return message[0];
      }
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export async function createEntry(
  comparisonId: number,
  input: unknown,
): Promise<CreateEntryState> {
  const parsed = CreateEntrySchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const res = await fetch(`${API_URL}/comparisons/${comparisonId}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return { error: await readApiErrorMessage(res, 'Failed to create entry') };
  }

  const entry = EntryResponseSchema.parse(await res.json());
  return { entryId: entry.id };
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
