import { z } from 'zod';
import {
  ComparisonDetailsResponseSchema,
  ComparisonResponseSchema,
  type ComparisonResponse,
} from '@compy/shared';
import type { ComparisonDetailsResponse } from '@compy/shared';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export { API_URL };

async function fetchJson<Schema extends z.ZodType>(
  path: string,
  schema: Schema,
): Promise<z.infer<Schema> | null> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Request to ${path} failed: ${res.status}`);
  }

  const data = await res.json();
  return schema.parse(data);
}

export async function getComparisons(): Promise<ComparisonResponse[]> {
  const comparisons = await fetchJson(
    '/comparisons',
    ComparisonResponseSchema.array(),
  );
  return comparisons ?? [];
}

export async function getComparisonByPublicId(
  publicId: string,
): Promise<ComparisonDetailsResponse | null> {
  return fetchJson(`/comparisons/${publicId}`, ComparisonDetailsResponseSchema);
}
