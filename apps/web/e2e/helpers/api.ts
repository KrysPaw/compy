import type { BrowserContext } from '@playwright/test';
import { E2E_API_URL } from '../env';

export type ComparisonSummary = {
  id: number;
  publicId: string;
  name: string;
};

let sessionCookie: string | undefined;

async function ensureGuestSession(): Promise<string> {
  if (sessionCookie !== undefined) {
    return sessionCookie;
  }

  const response = await fetch(`${E2E_API_URL}/auth/guest`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`ensureGuestSession failed with status ${response.status}`);
  }

  const setCookie = response.headers.get('set-cookie');
  if (setCookie === null) {
    const body = (await response.json()) as { token: string };
    sessionCookie = `compy_session=${encodeURIComponent(body.token)}`;
  } else {
    sessionCookie = setCookie.split(';')[0] ?? setCookie;
  }

  return sessionCookie;
}

/** Share the API helper guest with the browser so seeded comparisons are owned. */
export async function applyGuestSession(
  context: BrowserContext,
): Promise<void> {
  const cookieHeader = await ensureGuestSession();
  const separator = cookieHeader.indexOf('=');
  const name = cookieHeader.slice(0, separator);
  const value = decodeURIComponent(cookieHeader.slice(separator + 1));

  await context.addCookies([
    {
      name,
      value,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

async function api<T>(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> {
  const cookie = await ensureGuestSession();
  const response = await fetch(`${E2E_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
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

/** Clears comparisons owned by the current e2e guest session. */
export async function resetComparisons(): Promise<void> {
  const comparisons = await listComparisons();
  await Promise.all(
    comparisons.map((comparison) => deleteComparison(comparison.publicId)),
  );
}
