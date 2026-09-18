import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService, displayNameFromEmail } from './auth.service.js';

describe('AuthService', () => {
  const userCreateViaSession = {
    id: 7,
    kind: 'guest' as const,
    email: null,
    displayName: null,
  };
  const sessionCreate = vi.fn().mockResolvedValue({
    token: 'abc',
    expiresAt: new Date('2027-01-01T00:00:00.000Z'),
    user: userCreateViaSession,
  });
  const sessionFindUnique = vi.fn();
  const sessionDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
  const userUpdate = vi.fn().mockResolvedValue(userCreateViaSession);
  const userFindUnique = vi.fn();
  const userFindUniqueOrThrow = vi.fn();
  const userFindFirst = vi.fn();
  const userCreate = vi.fn();
  const userDelete = vi.fn();
  const comparisonUpdateMany = vi.fn().mockResolvedValue({ count: 2 });
  const comparisonGrantFindMany = vi.fn().mockResolvedValue([]);
  const comparisonGrantFindUnique = vi.fn();
  const comparisonGrantDelete = vi.fn();
  const comparisonGrantUpdate = vi.fn();
  const comparisonGrantDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
  const accessRequestFindMany = vi.fn().mockResolvedValue([]);
  const accessRequestFindFirst = vi.fn();
  const accessRequestDelete = vi.fn();
  const accessRequestUpdate = vi.fn();
  const magicLinkCreate = vi.fn().mockResolvedValue({});
  const magicLinkFindUnique = vi.fn();
  const magicLinkUpdate = vi.fn();
  const magicLinkDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
  const oAuthStateCreate = vi.fn().mockResolvedValue({});
  const oAuthStateFindUnique = vi.fn();
  const oAuthStateDelete = vi.fn();
  const oAuthStateDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
  const transaction = vi.fn(
    async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        comparison: { updateMany: comparisonUpdateMany },
        comparisonGrant: {
          findMany: comparisonGrantFindMany,
          findUnique: comparisonGrantFindUnique,
          delete: comparisonGrantDelete,
          update: comparisonGrantUpdate,
          deleteMany: comparisonGrantDeleteMany,
        },
        accessRequest: {
          findMany: accessRequestFindMany,
          findFirst: accessRequestFindFirst,
          delete: accessRequestDelete,
          update: accessRequestUpdate,
        },
        session: { deleteMany: sessionDeleteMany },
        user: { delete: userDelete },
      }),
  );

  const prisma = {
    session: {
      create: sessionCreate,
      findUnique: sessionFindUnique,
      deleteMany: sessionDeleteMany,
    },
    user: {
      update: userUpdate,
      findUnique: userFindUnique,
      findUniqueOrThrow: userFindUniqueOrThrow,
      findFirst: userFindFirst,
      create: userCreate,
      delete: userDelete,
    },
    comparison: {
      updateMany: comparisonUpdateMany,
    },
    comparisonGrant: {
      findMany: comparisonGrantFindMany,
      findUnique: comparisonGrantFindUnique,
      delete: comparisonGrantDelete,
      update: comparisonGrantUpdate,
      deleteMany: comparisonGrantDeleteMany,
    },
    accessRequest: {
      findMany: accessRequestFindMany,
      findFirst: accessRequestFindFirst,
      delete: accessRequestDelete,
      update: accessRequestUpdate,
    },
    magicLinkToken: {
      create: magicLinkCreate,
      findUnique: magicLinkFindUnique,
      update: magicLinkUpdate,
      deleteMany: magicLinkDeleteMany,
    },
    oAuthState: {
      create: oAuthStateCreate,
      findUnique: oAuthStateFindUnique,
      delete: oAuthStateDelete,
      deleteMany: oAuthStateDeleteMany,
    },
    $transaction: transaction,
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
          select: {
            id: true,
            kind: true,
            email: true,
            displayName: true,
          },
        },
      },
    });
    expect(result.principal).toEqual({
      id: 7,
      kind: 'guest',
      email: null,
      displayName: null,
    });
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

  it('upgrades a guest in place on first magic-link signup', async () => {
    magicLinkFindUnique.mockResolvedValueOnce({
      id: 1,
      token: 'magic',
      email: 'ada@example.com',
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    userFindFirst.mockResolvedValue(null);
    userFindUnique.mockResolvedValueOnce({ id: 7, kind: 'guest' });
    userUpdate.mockResolvedValueOnce({
      id: 7,
      kind: 'registered',
      email: 'ada@example.com',
      displayName: 'ada',
    });

    const result = await service.verifyMagicLink('magic', 7);

    expect(magicLinkUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { consumedAt: expect.any(Date) },
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        kind: 'registered',
        email: 'ada@example.com',
        googleSub: undefined,
        displayName: 'ada',
        lastSeenAt: expect.any(Date),
      },
      select: {
        id: true,
        kind: true,
        email: true,
        displayName: true,
      },
    });
    expect(sessionDeleteMany).toHaveBeenCalledWith({ where: { userId: 7 } });
    expect(result.principal).toEqual({
      id: 7,
      kind: 'registered',
      email: 'ada@example.com',
      displayName: 'ada',
    });
  });

  it('merges guest comparisons into an existing registered account', async () => {
    userFindFirst.mockResolvedValueOnce({
      id: 42,
      googleSub: null,
      displayName: 'Ada',
    });
    userFindUnique.mockResolvedValueOnce({ kind: 'guest' });
    sessionCreate.mockResolvedValueOnce({
      token: 'reg-session',
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      user: {
        id: 42,
        kind: 'registered',
        email: 'ada@example.com',
        displayName: 'Ada',
      },
    });

    const result = await service.completeIdentityLogin(
      { email: 'ada@example.com', displayName: 'Ada' },
      7,
    );

    expect(transaction).toHaveBeenCalled();
    expect(comparisonUpdateMany).toHaveBeenCalledWith({
      where: { ownerId: 7 },
      data: { ownerId: 42 },
    });
    expect(comparisonGrantFindMany).toHaveBeenCalledWith({
      where: { userId: 7 },
    });
    expect(accessRequestFindMany).toHaveBeenCalledWith({
      where: { requesterId: 7 },
    });
    expect(comparisonGrantDeleteMany).toHaveBeenCalledWith({
      where: {
        userId: 42,
        comparison: { ownerId: 42 },
      },
    });
    expect(userDelete).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(result.principal.id).toBe(42);
    expect(result.principal.kind).toBe('registered');
  });

  it('rejects expired magic links', async () => {
    magicLinkFindUnique.mockResolvedValueOnce({
      id: 1,
      token: 'stale',
      email: 'ada@example.com',
      consumedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(service.verifyMagicLink('stale', 7)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('deletes the account and cleans oauth state plus unconsumed magic links', async () => {
    userFindUnique.mockResolvedValueOnce({
      id: 42,
      email: 'ada@example.com',
    });
    userDelete.mockResolvedValueOnce({ id: 42 });

    await service.deleteAccount(42);

    expect(oAuthStateDeleteMany).toHaveBeenCalledWith({ where: { userId: 42 } });
    expect(magicLinkDeleteMany).toHaveBeenCalledWith({
      where: {
        email: 'ada@example.com',
        consumedAt: null,
      },
    });
    expect(userDelete).toHaveBeenCalledWith({ where: { id: 42 } });
  });

  it('skips magic-link cleanup when the account has no email', async () => {
    userFindUnique.mockResolvedValueOnce({
      id: 7,
      email: null,
    });
    userDelete.mockResolvedValueOnce({ id: 7 });

    await service.deleteAccount(7);

    expect(oAuthStateDeleteMany).toHaveBeenCalledWith({ where: { userId: 7 } });
    expect(magicLinkDeleteMany).not.toHaveBeenCalled();
    expect(userDelete).toHaveBeenCalledWith({ where: { id: 7 } });
  });

  it('is a no-op when the user row is already gone', async () => {
    userFindUnique.mockResolvedValueOnce(null);

    await service.deleteAccount(99);

    expect(oAuthStateDeleteMany).not.toHaveBeenCalled();
    expect(userDelete).not.toHaveBeenCalled();
  });

  it('derives display names from the email local-part', () => {
    expect(displayNameFromEmail('ada.lovelace@example.com')).toBe('ada.lovelace');
  });

  it('sends Polish magic-link copy when locale is pl', async () => {
    const previousKey = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = 'test-resend-key';
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    try {
      await service.requestMagicLink('user@example.com', 'pl');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"subject":"Zaloguj się do Compy"'),
        }),
      );
      const body = JSON.parse(
        (fetchMock.mock.calls[0]?.[1] as { body: string }).body,
      ) as { text: string };
      expect(body.text).toContain('wygasa za 15 minut');
    } finally {
      if (previousKey === undefined) {
        delete process.env.RESEND_API_KEY;
      } else {
        process.env.RESEND_API_KEY = previousKey;
      }
      vi.unstubAllGlobals();
    }
  });
});
