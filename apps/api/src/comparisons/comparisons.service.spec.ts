import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ComparisonsService } from './comparisons.service.js';
import { describe, expect, it, vi } from 'vitest';

vi.mock('ulid', () => ({
  ulid: () => '01ARZ3NDEKTSV4RRFFQ69G5FAV',
}));

const PUBLIC_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
const USER_ID = 42;

describe('ComparisonsService', () => {
  let service: ComparisonsService;
  const comparison = {
    id: 1,
    publicId: PUBLIC_ID,
    name: 'Phones',
    ownerId: USER_ID,
    lastActiveAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const createdComparison = {
    ...comparison,
    criteria: [
      {
        id: 1,
        comparisonId: comparison.id,
        name: 'name',
        type: 'text',
        config: null,
        is_comparable: false,
        is_key: true,
        createdAt: comparison.createdAt,
        updatedAt: comparison.updatedAt,
      },
    ],
  };
  const comparisonCreate = vi.fn().mockResolvedValue(comparison);
  const criterionCreate = vi
    .fn()
    .mockResolvedValue(createdComparison.criteria[0]);
  const comparisonFindUnique = vi.fn().mockResolvedValue(createdComparison);
  const comparisonUpdate = vi
    .fn()
    .mockResolvedValue({ ...comparison, name: 'Mobile phones' });
  const comparisonDelete = vi.fn().mockResolvedValue(comparison);
  const comparisonDetail = {
    ...createdComparison,
    entries: [
      {
        id: 1,
        comparisonId: comparison.id,
        createdAt: comparison.createdAt,
        updatedAt: comparison.updatedAt,
        entryValues: [
          {
            id: 1,
            entryId: 1,
            criterionId: 1,
            value: 'Pixel',
            createdAt: comparison.createdAt,
            updatedAt: comparison.updatedAt,
          },
        ],
      },
    ],
  };
  const comparisonFindFirst = vi.fn().mockResolvedValue(comparisonDetail);
  const comparisonFindMany = vi.fn().mockResolvedValue([createdComparison]);
  const prisma = {
    comparison: {
      findFirst: comparisonFindFirst,
      findMany: comparisonFindMany,
      update: comparisonUpdate,
      delete: comparisonDelete,
    },
    $transaction: vi.fn(async (callback: (transaction: unknown) => unknown) =>
      callback({
        comparison: {
          create: comparisonCreate,
          findUnique: comparisonFindUnique,
        },
        criterion: {
          create: criterionCreate,
        },
      }),
    ),
  } as unknown as PrismaService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ComparisonsService],
    })
      .useMocker((token) => (token === PrismaService ? prisma : undefined))
      .compile();

    service = module.get<ComparisonsService>(ComparisonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a comparison owned by the caller', async () => {
    const result = await service.createComparison({ name: 'Phones' }, USER_ID);

    expect(comparisonCreate).toHaveBeenCalledWith({
      data: {
        name: 'Phones',
        publicId: PUBLIC_ID,
        ownerId: USER_ID,
        lastActiveAt: expect.any(Date),
      },
    });
    expect(criterionCreate).toHaveBeenCalledWith({
      data: {
        comparisonId: comparison.id,
        name: 'name',
        type: 'text',
        is_comparable: false,
        is_key: true,
      },
    });
    expect(comparisonFindUnique).toHaveBeenCalledWith({
      where: { id: comparison.id },
      include: {
        criteria: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    expect(result).toEqual(createdComparison);
  });

  it('returns only comparisons owned by or granted to the caller', async () => {
    const result = await service.getAll(USER_ID);

    expect(comparisonFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { ownerId: USER_ID },
          { grants: { some: { userId: USER_ID } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
    expect(result).toEqual([createdComparison]);
  });

  it('returns a comparison with criteria, entries, and entry values', async () => {
    const result = await service.getByPublicId(PUBLIC_ID, USER_ID);

    expect(comparisonFindFirst).toHaveBeenCalledWith({
      where: {
        publicId: PUBLIC_ID,
        OR: [
          { ownerId: USER_ID },
          { grants: { some: { userId: USER_ID } } },
        ],
      },
      include: {
        criteria: {
          orderBy: { createdAt: 'asc' },
        },
        entries: {
          include: {
            entryValues: true,
          },
        },
      },
    });
    expect(comparisonUpdate).toHaveBeenCalledWith({
      where: { id: comparison.id },
      data: { lastActiveAt: expect.any(Date) },
    });
    expect(result).toEqual(comparisonDetail);
  });

  it('throws NotFoundException when the comparison does not exist', async () => {
    comparisonFindFirst.mockResolvedValueOnce(null);

    await expect(
      service.getByPublicId('01ZZZZZZZZZZZZZZZZZZZZZZZZ', USER_ID),
    ).rejects.toThrowError(NotFoundException);
  });

  it('renames an existing comparison', async () => {
    comparisonFindFirst.mockResolvedValueOnce({ id: 1 });

    const result = await service.update(PUBLIC_ID, USER_ID, {
      name: 'Mobile phones',
    });

    expect(comparisonUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { lastActiveAt: expect.any(Date) },
    });
    expect(comparisonUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'Mobile phones' },
    });
    expect(result).toEqual({ ...comparison, name: 'Mobile phones' });
  });

  it('deletes an existing comparison', async () => {
    comparisonFindFirst.mockResolvedValueOnce({ id: 1 });

    const result = await service.remove(PUBLIC_ID, USER_ID);

    expect(comparisonDelete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(comparison);
  });

  it('rejects renaming a missing comparison', async () => {
    comparisonFindFirst.mockResolvedValueOnce(null);

    await expect(
      service.update('01ZZZZZZZZZZZZZZZZZZZZZZZZ', USER_ID, {
        name: 'Missing',
      }),
    ).rejects.toThrowError(NotFoundException);
    expect(comparisonUpdate).not.toHaveBeenCalled();
  });
});
