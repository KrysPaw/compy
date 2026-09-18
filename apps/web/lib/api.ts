import { z } from 'zod';
import {
  AccessRequestResponseSchema,
  ComparisonAccessStatusSchema,
  ComparisonDetailsResponseSchema,
  ComparisonResponseSchema,
  PrincipalResponseSchema,
  type AccessRequestResponse,
  type ComparisonAccessStatus,
  type ComparisonResponse,
  type PrincipalResponse,
} from '@compy/shared';
import type { ComparisonDetailsResponse } from '@compy/shared';
import { apiFetch } from './api-fetch';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export { API_URL };

async function fetchJson<Schema extends z.ZodType>(
  path: string,
  schema: Schema,
): Promise<z.infer<Schema> | null> {
  const res = await apiFetch(path);

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

export async function getComparisonAccess(
  publicId: string,
): Promise<ComparisonAccessStatus | null> {
  return fetchJson(`/comparisons/${publicId}/access`, ComparisonAccessStatusSchema);
}

export async function getPendingAccessRequests(
  publicId: string,
): Promise<AccessRequestResponse[]> {
  const requests = await fetchJson(
    `/comparisons/${publicId}/access-requests`,
    AccessRequestResponseSchema.array(),
  );
  return requests ?? [];
}

export async function getCurrentPrincipal(): Promise<PrincipalResponse | null> {
  try {
    return await fetchJson('/auth/me', PrincipalResponseSchema);
  } catch {
    return null;
  }
}
