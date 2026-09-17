import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  SESSION_TTL_MS,
  type Principal,
} from './session.constants.js';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  public async createGuestSession(): Promise<{
    token: string;
    principal: Principal;
    expiresAt: Date;
  }> {
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
          select: { id: true, kind: true },
        },
      },
    });

    return {
      token,
      expiresAt,
      principal: {
        id: session.user.id,
        kind: session.user.kind,
      },
    };
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
}
