import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const userCreateViaSession = {
    id: 7,
    kind: 'guest' as const,
  };
  const sessionCreate = vi.fn().mockResolvedValue({
    token: 'abc',
    user: userCreateViaSession,
  });
  const sessionFindUnique = vi.fn();
  const userUpdate = vi.fn().mockResolvedValue(userCreateViaSession);
  const prisma = {
    session: {
      create: sessionCreate,
      findUnique: sessionFindUnique,
    },
    user: {
      update: userUpdate,
    },
  } as unknown as PrismaService;

  let service: AuthService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    })
      .useMocker((token) => (token === PrismaService ? prisma : undefined))
      .compile();

    service = module.get(AuthService);
  });

  it('creates a guest user and session token', async () => {
    const result = await service.createGuestSession();

    expect(sessionCreate).toHaveBeenCalledWith({
      data: {
        token: expect.any(String),
        expiresAt: expect.any(Date),
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
    expect(result.principal).toEqual({ id: 7, kind: 'guest' });
    expect(result.token).toEqual(expect.any(String));
  });

  it('resolves a valid session token to a principal', async () => {
    sessionFindUnique.mockResolvedValueOnce({
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 7, kind: 'guest' },
    });

    await expect(service.resolvePrincipal('token')).resolves.toEqual({
      id: 7,
      kind: 'guest',
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { lastSeenAt: expect.any(Date) },
    });
  });

  it('returns null for missing or expired sessions', async () => {
    await expect(service.resolvePrincipal(undefined)).resolves.toBeNull();

    sessionFindUnique.mockResolvedValueOnce({
      expiresAt: new Date(Date.now() - 1000),
      user: { id: 7, kind: 'guest' },
    });

    await expect(service.resolvePrincipal('expired')).resolves.toBeNull();
  });
});
