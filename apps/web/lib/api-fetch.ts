import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from './session';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const headers = new Headers(init?.headers);

  if (token !== undefined && token.length > 0) {
    headers.set(
      'Cookie',
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    );
  }

  if (
    init?.body !== undefined &&
    !headers.has('Content-Type') &&
    !(init.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
}
