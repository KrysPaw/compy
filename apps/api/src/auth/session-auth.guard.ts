import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import type { RequestWithPrincipal } from './current-principal.decorator.js';
import { SESSION_COOKIE_NAME } from './session.constants.js';

function readCookie(header: string | undefined, name: string): string | undefined {
  if (header === undefined || header.length === 0) {
    return undefined;
  }

  for (const part of header.split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join('='));
    }
  }

  return undefined;
}

export function buildSessionCookie(token: string, expiresAt: Date): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secure}`;
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithPrincipal>();
    const response = http.getResponse<Response>();

    const existingToken = readCookie(
      request.headers.cookie,
      SESSION_COOKIE_NAME,
    );
    const existing = await this.authService.resolvePrincipal(existingToken);

    if (existing !== null) {
      request.principal = existing;
      return true;
    }

    const created = await this.authService.createGuestSession();
    request.principal = created.principal;
    response.setHeader(
      'Set-Cookie',
      buildSessionCookie(created.token, created.expiresAt),
    );

    return true;
  }
}
