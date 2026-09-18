import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { SharingService } from './sharing.service.js';

const PUBLIC_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
const OWNER_ID = 1;
const REQUESTER_ID = 2;

describe('SharingService', () => {
  let service: SharingService;

  const comparisonFindFirst = vi.fn();
  const comparisonUpdate = vi.fn().mockResolvedValue({});
  const userFindFirst = vi.fn();
  const grantFindUnique = vi.fn();
  const grantCreate = vi.fn();
  const grantUpsert = vi.fn();
  const accessRequestFindFirst = vi.fn();
  const accessRequestFindMany = vi.fn();
  const accessRequestCreate = vi.fn();
  const accessRequestUpdate = vi.fn();
  const accessRequestUpdateMany = vi.fn();
  const transaction = vi.fn(
    async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        comparisonGrant: {
          create: grantCreate,
          upsert: grantUpsert,
        },
        accessRequest: {
          updateMany: accessRequestUpdateMany,
          update: accessRequestUpdate,
        },
      }),
  );

  const prisma = {
    comparison: {
      findFirst: comparisonFindFirst,
      update: comparisonUpdate,
    },
    user: {
      findFirst: userFindFirst,
    },
    comparisonGrant: {
      findUnique: grantFindUnique,
    },
    accessRequest: {
      findFirst: accessRequestFindFirst,
      findMany: accessRequestFindMany,
      create: accessRequestCreate,
      update: accessRequestUpdate,
    },
    $transaction: transaction,
  } as unknown as PrismaService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharingService],
    })
      .useMocker((token) => (token === PrismaService ? prisma : undefined))
      .compile();

    service = module.get(SharingService);
  });

  it('reports locked when the comparison exists without access', async () => {
    comparisonFindFirst.mockResolvedValueOnce({
      id: 10,
      ownerId: OWNER_ID,
      grants: [],
    });

    await expect(
      service.getAccessStatus(PUBLIC_ID, REQUESTER_ID),
    ).resolves.toEqual({ status: 'locked' });
  });

  it('reports owner access and touches lastActiveAt', async () => {
    comparisonFindFirst.mockResolvedValueOnce({
      id: 10,
      ownerId: OWNER_ID,
      grants: [],
    });

    await expect(
      service.getAccessStatus(PUBLIC_ID, OWNER_ID),
    ).resolves.toEqual({ status: 'accessible', role: 'owner' });
    expect(comparisonUpdate).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { lastActiveAt: expect.any(Date) },
    });
  });

  it('creates an access request for a locked comparison', async () => {
    comparisonFindFirst.mockResolvedValueOnce({
      id: 10,
      ownerId: OWNER_ID,
      grants: [],
    });
    accessRequestFindFirst.mockResolvedValueOnce(null);
    accessRequestCreate.mockResolvedValueOnce({
      id: 5,
      requesterId: REQUESTER_ID,
      displayName: 'Bob',
      message: 'Please',
      status: 'pending',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const result = await service.createAccessRequest(PUBLIC_ID, REQUESTER_ID, {
      displayName: 'Bob',
      message: 'Please',
    });

    expect(accessRequestCreate).toHaveBeenCalledWith({
      data: {
        comparisonId: 10,
        requesterId: REQUESTER_ID,
        displayName: 'Bob',
        message: 'Please',
        status: 'pending',
      },
      select: expect.any(Object),
    });
    expect(result.status).toBe('pending');
  });

  it('rejects invite for an unknown email', async () => {
    comparisonFindFirst.mockResolvedValueOnce({ id: 10 });
    userFindFirst.mockResolvedValueOnce(null);

    await expect(
      service.inviteByEmail(PUBLIC_ID, OWNER_ID, {
        email: 'missing@example.com',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('invites a registered user and creates an editor grant', async () => {
    comparisonFindFirst.mockResolvedValueOnce({ id: 10 });
    userFindFirst.mockResolvedValueOnce({
      id: REQUESTER_ID,
      email: 'bob@example.com',
      displayName: 'Bob',
    });
    grantFindUnique.mockResolvedValueOnce(null);
    grantCreate.mockResolvedValueOnce({
      id: 9,
      role: 'editor',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    accessRequestUpdateMany.mockResolvedValueOnce({ count: 0 });

    const result = await service.inviteByEmail(PUBLIC_ID, OWNER_ID, {
      email: 'bob@example.com',
    });

    expect(grantCreate).toHaveBeenCalledWith({
      data: {
        comparisonId: 10,
        userId: REQUESTER_ID,
        role: 'editor',
      },
    });
    expect(result).toMatchObject({
      id: 9,
      userId: REQUESTER_ID,
      email: 'bob@example.com',
      role: 'editor',
    });
  });

  it('accepts a pending request and upserts a grant', async () => {
    comparisonFindFirst.mockResolvedValueOnce({ id: 10 });
    accessRequestFindFirst.mockResolvedValueOnce({
      id: 5,
      requesterId: REQUESTER_ID,
      comparisonId: 10,
      status: 'pending',
    });
    grantUpsert.mockResolvedValueOnce({});
    accessRequestUpdate.mockResolvedValueOnce({
      id: 5,
      requesterId: REQUESTER_ID,
      displayName: 'Bob',
      message: null,
      status: 'accepted',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    const result = await service.acceptAccessRequest(PUBLIC_ID, OWNER_ID, 5);

    expect(grantUpsert).toHaveBeenCalled();
    expect(result.status).toBe('accepted');
  });

  it('returns 404 semantics when accepting a missing request', async () => {
    comparisonFindFirst.mockResolvedValueOnce({ id: 10 });
    accessRequestFindFirst.mockResolvedValueOnce(null);

    await expect(
      service.acceptAccessRequest(PUBLIC_ID, OWNER_ID, 99),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
