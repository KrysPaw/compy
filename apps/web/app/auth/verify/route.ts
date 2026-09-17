import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyMagicLink } from '@/lib/actions';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (token === null || token.length === 0) {
    return NextResponse.redirect(
      new URL('/auth/error?reason=missing_token', request.url),
    );
  }

  const result = await verifyMagicLink(token);

  if (result.ok) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.redirect(
    new URL('/auth/error?reason=invalid_link', request.url),
  );
}
