import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  SESSION_TTL_MS,
  type Principal,
} from './session.constants.js';

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export type AuthIdentity = {
  email: string;
  googleSub?: string;
  displayName?: string;
};

export type AuthSessionResult = {
  token: string;
  expiresAt: Date;
  principal: Principal & {
    email: string | null;
    displayName: string | null;
  };
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  public async createGuestSession(): Promise<AuthSessionResult> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const session = await this.prisma.session.create({
      data: {
        token,
        expiresAt,
        user: {
          create: {
            kind: 'guest',
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            kind: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    return this.toSessionResult(session.token, session.expiresAt, session.user);
  }

  public async resolvePrincipal(token: string | undefined): Promise<Principal | null> {
    if (token === undefined || token.length === 0) {
      return null;
    }

    const session = await this.prisma.session.findUnique({
      where: { token },
      select: {
        expiresAt: true,
        user: {
          select: { id: true, kind: true },
        },
      },
    });

    if (session === null || session.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    await this.prisma.user.update({
      where: { id: session.user.id },
      data: { lastSeenAt: new Date() },
    });

    return {
      id: session.user.id,
      kind: session.user.kind,
    };
  }

  public async getPrincipalProfile(principal: Principal): Promise<
    Principal & {
      email: string | null;
      displayName: string | null;
    }
  > {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: principal.id },
      select: {
        id: true,
        kind: true,
        email: true,
        displayName: true,
      },
    });

    return user;
  }

  public async deleteAccount(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (user === null) {
      return;
    }

    await this.prisma.oAuthState.deleteMany({ where: { userId } });

    if (user.email !== null && user.email.length > 0) {
      await this.prisma.magicLinkToken.deleteMany({
        where: {
          email: user.email,
          consumedAt: null,
        },
      });
    }

    await this.prisma.user.delete({ where: { id: userId } });
  }

  public async requestMagicLink(email: string): Promise<{
    ok: true;
    devMagicLinkUrl?: string;
  }> {
    const normalizedEmail = email.trim().toLowerCase();
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS);

    await this.prisma.magicLinkToken.create({
      data: {
        token,
        email: normalizedEmail,
        expiresAt,
      },
    });

    const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3001';
    const magicLinkUrl = `${webOrigin}/auth/verify?token=${encodeURIComponent(token)}`;

    await this.deliverMagicLink(normalizedEmail, magicLinkUrl);

    const includeDevUrl =
      process.env.NODE_ENV !== 'production' ||
      process.env.AUTH_EXPOSE_MAGIC_LINK === 'true';

    return {
      ok: true,
      ...(includeDevUrl ? { devMagicLinkUrl: magicLinkUrl } : {}),
    };
  }

  public async verifyMagicLink(
    token: string,
    guestUserId: number | null,
  ): Promise<AuthSessionResult> {
    const record = await this.prisma.magicLinkToken.findUnique({
      where: { token },
    });

    if (
      record === null ||
      record.consumedAt !== null ||
      record.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    await this.prisma.magicLinkToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });

    return this.completeIdentityLogin(
      {
        email: record.email,
        displayName: displayNameFromEmail(record.email),
      },
      guestUserId,
    );
  }

  public async startGoogleOAuth(guestUserId: number): Promise<{ url: string }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = googleRedirectUri();

    if (clientId === undefined || clientId.length === 0) {
      throw new ServiceUnavailableException('Google OAuth is not configured');
    }

    const stateId = randomBytes(24).toString('hex');
    await this.prisma.oAuthState.create({
      data: {
        id: stateId,
        userId: guestUserId,
        expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
      },
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: stateId,
      access_type: 'online',
      prompt: 'select_account',
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  }

  public async completeGoogleOAuth(
    code: string,
    state: string,
  ): Promise<AuthSessionResult> {
    const oauthState = await this.prisma.oAuthState.findUnique({
      where: { id: state },
    });

    if (
      oauthState === null ||
      oauthState.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    await this.prisma.oAuthState.delete({ where: { id: state } });

    const identity = await exchangeGoogleCode(code);
    return this.completeIdentityLogin(identity, oauthState.userId);
  }

  /**
   * Upgrades the current guest in place, or merges into an existing registered
   * account when the email / Google identity already exists.
   */
  public async completeIdentityLogin(
    identity: AuthIdentity,
    guestUserId: number | null,
  ): Promise<AuthSessionResult> {
    const email = identity.email.trim().toLowerCase();
    const displayName =
      identity.displayName?.trim() || displayNameFromEmail(email);

    const registered = await this.findRegisteredUser(email, identity.googleSub);

    if (registered !== null) {
      if (guestUserId !== null && guestUserId !== registered.id) {
        const source = await this.prisma.user.findUnique({
          where: { id: guestUserId },
          select: { kind: true },
        });

        if (source?.kind === 'guest') {
          await this.mergeGuestIntoRegistered(guestUserId, registered.id);
        }
      }

      if (identity.googleSub !== undefined && registered.googleSub === null) {
        await this.prisma.user.update({
          where: { id: registered.id },
          data: {
            googleSub: identity.googleSub,
            displayName: registered.displayName ?? displayName,
            lastSeenAt: new Date(),
          },
        });
      } else {
        await this.prisma.user.update({
          where: { id: registered.id },
          data: { lastSeenAt: new Date() },
        });
      }

      return this.createSessionForUser(registered.id);
    }

    if (guestUserId !== null) {
      const guest = await this.prisma.user.findUnique({
        where: { id: guestUserId },
        select: { id: true, kind: true },
      });

      if (guest !== null && guest.kind === 'guest') {
        const upgraded = await this.prisma.user.update({
          where: { id: guest.id },
          data: {
            kind: 'registered',
            email,
            googleSub: identity.googleSub,
            displayName,
            lastSeenAt: new Date(),
          },
          select: {
            id: true,
            kind: true,
            email: true,
            displayName: true,
          },
        });

        return this.replaceSessionsForUser(upgraded);
      }
    }

    const created = await this.prisma.user.create({
      data: {
        kind: 'registered',
        email,
        googleSub: identity.googleSub,
        displayName,
      },
      select: {
        id: true,
        kind: true,
        email: true,
        displayName: true,
      },
    });

    return this.createSessionForUser(created.id);
  }

  private async findRegisteredUser(
    email: string,
    googleSub: string | undefined,
  ) {
    if (googleSub !== undefined) {
      const byGoogle = await this.prisma.user.findFirst({
        where: { kind: 'registered', googleSub },
        select: {
          id: true,
          googleSub: true,
          displayName: true,
        },
      });
      if (byGoogle !== null) {
        return byGoogle;
      }
    }

    return this.prisma.user.findFirst({
      where: { kind: 'registered', email },
      select: {
        id: true,
        googleSub: true,
        displayName: true,
      },
    });
  }

  private async mergeGuestIntoRegistered(
    guestUserId: number,
    registeredUserId: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.comparison.updateMany({
        where: { ownerId: guestUserId },
        data: { ownerId: registeredUserId },
      });

      const guestGrants = await tx.comparisonGrant.findMany({
        where: { userId: guestUserId },
      });
      for (const grant of guestGrants) {
        const existing = await tx.comparisonGrant.findUnique({
          where: {
            comparisonId_userId: {
              comparisonId: grant.comparisonId,
              userId: registeredUserId,
            },
          },
        });
        if (existing !== null) {
          await tx.comparisonGrant.delete({ where: { id: grant.id } });
        } else {
          await tx.comparisonGrant.update({
            where: { id: grant.id },
            data: { userId: registeredUserId },
          });
        }
      }

      // Owner does not need a grant on their own comparisons after claim.
      await tx.comparisonGrant.deleteMany({
        where: {
          userId: registeredUserId,
          comparison: { ownerId: registeredUserId },
        },
      });

      const guestRequests = await tx.accessRequest.findMany({
        where: { requesterId: guestUserId },
      });
      for (const request of guestRequests) {
        if (request.status === 'pending') {
          const existingPending = await tx.accessRequest.findFirst({
            where: {
              comparisonId: request.comparisonId,
              requesterId: registeredUserId,
              status: 'pending',
            },
          });
          if (existingPending !== null) {
            await tx.accessRequest.delete({ where: { id: request.id } });
            continue;
          }
        }

        await tx.accessRequest.update({
          where: { id: request.id },
          data: { requesterId: registeredUserId },
        });
      }

      await tx.session.deleteMany({ where: { userId: guestUserId } });
      await tx.user.delete({ where: { id: guestUserId } });
    });
  }

  private async createSessionForUser(userId: number): Promise<AuthSessionResult> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const session = await this.prisma.session.create({
      data: {
        token,
        expiresAt,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            kind: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    return this.toSessionResult(session.token, session.expiresAt, session.user);
  }

  private async replaceSessionsForUser(user: {
    id: number;
    kind: 'guest' | 'registered';
    email: string | null;
    displayName: string | null;
  }): Promise<AuthSessionResult> {
    await this.prisma.session.deleteMany({ where: { userId: user.id } });
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await this.prisma.session.create({
      data: {
        token,
        expiresAt,
        userId: user.id,
      },
    });

    return this.toSessionResult(token, expiresAt, user);
  }

  private toSessionResult(
    token: string,
    expiresAt: Date,
    user: {
      id: number;
      kind: 'guest' | 'registered';
      email: string | null;
      displayName: string | null;
    },
  ): AuthSessionResult {
    return {
      token,
      expiresAt,
      principal: {
        id: user.id,
        kind: user.kind,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }

  private async deliverMagicLink(
    email: string,
    magicLinkUrl: string,
  ): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAGIC_LINK_FROM_EMAIL ?? 'Compy <onboarding@resend.dev>';

    if (apiKey === undefined || apiKey.length === 0) {
      console.info(`[auth] Magic link for ${email}: ${magicLinkUrl}`);
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Sign in to Compy',
        text: `Open this link to sign in to Compy (expires in 15 minutes):\n\n${magicLinkUrl}\n`,
      }),
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to send magic link email');
    }
  }
}

export function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim();
  return local && local.length > 0 ? local : email;
}

function googleRedirectUri(): string {
  if (
    process.env.GOOGLE_REDIRECT_URI !== undefined &&
    process.env.GOOGLE_REDIRECT_URI.length > 0
  ) {
    return process.env.GOOGLE_REDIRECT_URI;
  }

  const apiOrigin = process.env.API_PUBLIC_URL ?? 'http://localhost:3000';
  return `${apiOrigin}/auth/google/callback`;
}

async function exchangeGoogleCode(code: string): Promise<AuthIdentity> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (
    clientId === undefined ||
    clientId.length === 0 ||
    clientSecret === undefined ||
    clientSecret.length === 0
  ) {
    throw new ServiceUnavailableException('Google OAuth is not configured');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: googleRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    throw new UnauthorizedException('Google token exchange failed');
  }

  const tokenBody = (await tokenResponse.json()) as {
    access_token?: string;
  };

  if (tokenBody.access_token === undefined) {
    throw new UnauthorizedException('Google token exchange failed');
  }

  const profileResponse = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    {
      headers: { Authorization: `Bearer ${tokenBody.access_token}` },
    },
  );

  if (!profileResponse.ok) {
    throw new UnauthorizedException('Failed to load Google profile');
  }

  const profile = (await profileResponse.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };

  if (
    profile.email === undefined ||
    profile.sub === undefined ||
    profile.email_verified === false
  ) {
    throw new UnauthorizedException('Google account email is unavailable');
  }

  return {
    email: profile.email,
    googleSub: profile.sub,
    displayName:
      profile.name !== undefined && profile.name.trim().length > 0
        ? profile.name.trim()
        : displayNameFromEmail(profile.email),
  };
}
