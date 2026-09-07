'use server';

import {
  CreateComparisonSchema,
  ComparisonResponseSchema,
} from '@compy/shared';
import { API_URL } from './api';

export type CreateComparisonState = {
  error?: string;
  comparisonId?: number;
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
