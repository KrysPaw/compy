import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from './lib/session';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function middleware(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.next();
  }

  try {
    const guestResponse = await fetch(`${API_URL}/auth/guest`, {
      method: 'POST',
      cache: 'no-store',
    });

    if (!guestResponse.ok) {
      return NextResponse.next();
    }

    const body = (await guestResponse.json()) as {
      token: string;
      expiresAt: string;
    };

    const response = NextResponse.next();
    response.cookies.set(SESSION_COOKIE_NAME, body.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(body.expiresAt),
    });

    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
