import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';

export async function GET() {
  const response = await apiFetch('/auth/google/start');

  if (!response.ok) {
    redirect('/auth/error?reason=oauth_unavailable');
  }

  const body = (await response.json()) as { url?: string };

  if (body.url === undefined || body.url.length === 0) {
    redirect('/auth/error?reason=oauth_unavailable');
  }

  redirect(body.url);
}
