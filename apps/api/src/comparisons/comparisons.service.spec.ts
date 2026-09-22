import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { resolveTemplateCriteria } from '@compy/shared';
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
        name: 'Name',
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
  const criterionCreateMany = vi.fn().mockResolvedValue({ count: 0 });
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
          createMany: criterionCreateMany,
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
        name: 'Name',
        type: 'text',
        is_comparable: false,
        is_key: true,
      },
    });
    expect(criterionCreateMany).not.toHaveBeenCalled();
    expect(comparisonFindUnique).toHaveBeenCalledWith({
      where: { id: comparison.id },
      include: {
        criteria: {
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });
    expect(result).toEqual(createdComparison);
  });

  it('creates the key criterion with a provided keyCriterionName', async () => {
    await service.createComparison(
      { name: 'Phones', keyCriterionName: 'Nazwa' },
      USER_ID,
    );

    expect(criterionCreate).toHaveBeenCalledWith({
      data: {
        comparisonId: comparison.id,
        name: 'Nazwa',
        type: 'text',
        is_comparable: false,
        is_key: true,
      },
    });
    expect(criterionCreateMany).not.toHaveBeenCalled();
  });

  it('seeds template criteria with ruleConfig and zero weights', async () => {
    const templateCriteria = resolveTemplateCriteria('phones', (key) => {
      const names: Record<string, string> = {
        'criteria.link': 'Link',
        'criteria.price': 'Price',
        'criteria.storage': 'Storage',
        'criteria.battery': 'Battery',
        'criteria.camera': 'Camera',
        'criteria.screenSize': 'Screen size',
        'criteria.fiveG': '5G',
        'criteria.rating': 'Rating',
      };
      return names[key] ?? key;
    });

    await service.createComparison(
      { name: 'Phones', templateId: 'phones', templateCriteria },
      USER_ID,
    );

    expect(criterionCreate).toHaveBeenCalledTimes(1);
    expect(criterionCreateMany).toHaveBeenCalledTimes(1);

    const seeded = criterionCreateMany.mock.calls[0]?.[0]?.data as Array<{
      name: string;
      type: string;
      weight: number;
      ruleConfig: unknown;
      is_key: boolean;
    }>;

    expect(seeded).toEqual(
      templateCriteria.map((criterion) => ({
        comparisonId: comparison.id,
        name: criterion.name,
        type: criterion.type,
        is_comparable: criterion.is_comparable,
        is_key: false,
        weight: 0,
        config: criterion.config,
        ruleConfig: criterion.ruleConfig,
      })),
    );
    expect(seeded.every((criterion) => criterion.weight === 0)).toBe(true);
    expect(
      seeded.find((criterion) => criterion.name === 'Price')?.ruleConfig,
    ).toEqual({ direction: 'lower' });
  });

  it('does not seed template criteria without templateCriteria payload', async () => {
    await service.createComparison({ name: 'Phones' }, USER_ID);

    expect(criterionCreateMany).not.toHaveBeenCalled();
  });

  it('returns only comparisons owned by or granted to the caller', async () => {
    const owned = {
      id: 1,
      publicId: PUBLIC_ID,
      name: 'Phones',
      ownerId: USER_ID,
      lastActiveAt: comparison.lastActiveAt,
      createdAt: comparison.createdAt,
      updatedAt: comparison.updatedAt,
    };
    const shared = {
      id: 2,
      publicId: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
      name: 'Hotels',
      ownerId: 99,
      lastActiveAt: comparison.lastActiveAt,
      createdAt: comparison.createdAt,
      updatedAt: comparison.updatedAt,
    };
    comparisonFindMany.mockResolvedValueOnce([owned, shared]);

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
    expect(result).toEqual([
      {
        id: 1,
        publicId: PUBLIC_ID,
        name: 'Phones',
        createdAt: comparison.createdAt,
        updatedAt: comparison.updatedAt,
        role: 'owner',
      },
      {
        id: 2,
        publicId: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
        name: 'Hotels',
        createdAt: comparison.createdAt,
        updatedAt: comparison.updatedAt,
        role: 'editor',
      },
    ]);
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
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
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
