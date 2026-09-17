import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const expiresAt = request.nextUrl.searchParams.get('expiresAt');

  if (token === null || token.length === 0 || expiresAt === null) {
    return NextResponse.redirect(new URL('/auth/error?reason=missing_session', request.url));
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  });

  return NextResponse.redirect(new URL('/', request.url));
}
