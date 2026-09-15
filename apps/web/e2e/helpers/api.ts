import { E2E_API_URL } from '../env';

export type ComparisonSummary = {
  id: number;
  publicId: string;
  name: string;
};

async function api<T>(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> {
  const response = await fetch(`${E2E_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  const body = text ? (JSON.parse(text) as T) : (null as T);

  return { status: response.status, body };
}

export async function listComparisons(): Promise<ComparisonSummary[]> {
  const { status, body } = await api<ComparisonSummary[]>('/comparisons');

  if (status !== 200) {
    throw new Error(`listComparisons failed with status ${status}`);
  }

  return body;
}

export async function createComparison(
  name: string,
): Promise<ComparisonSummary> {
  const { status, body } = await api<ComparisonSummary>('/comparisons', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

  if (status !== 201 && status !== 200) {
    throw new Error(`createComparison failed with status ${status}`);
  }

  return body;
}

export async function deleteComparison(publicId: string): Promise<void> {
  const { status } = await api<unknown>(`/comparisons/${publicId}`, {
    method: 'DELETE',
  });

  if (status !== 200 && status !== 204) {
    throw new Error(`deleteComparison(${publicId}) failed with status ${status}`);
  }
}

/** Clears all comparisons so each test can seed a known DB state. */
export async function resetComparisons(): Promise<void> {
  const comparisons = await listComparisons();
  await Promise.all(
    comparisons.map((comparison) => deleteComparison(comparison.publicId)),
  );
}
