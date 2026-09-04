import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { EntriesService } from './entries.service.js';

describe('EntriesService', () => {
  let service: EntriesService;

  const comparisonFindUnique = vi.fn().mockResolvedValue({ id: 1 });
  const criterionFindMany = vi.fn().mockResolvedValue([
    {
      id: 1,
      comparisonId: 1,
      name: 'name',
      type: 'Text',
      config: null,
      is_comparable: false,
      is_key: true,
    },
    {
      id: 2,
      comparisonId: 1,
      name: 'Price',
      type: 'Float',
      config: null,
      is_comparable: true,
      is_key: false,
    },
  ]);

  const entryCreate = vi.fn().mockResolvedValue({ id: 10, comparisonId: 1 });
  const entryFindMany = vi.fn().mockResolvedValue([
    {
      id: 10,
      comparisonId: 1,
      entryValues: [
        { id: 1, entryId: 10, criterionId: 1, value: 'Pixel' },
      ],
    },
  ]);
  const entryFindUnique = vi.fn().mockResolvedValue({
    id: 10,
    comparisonId: 1,
    entryValues: [
      { id: 1, entryId: 10, criterionId: 1, value: 'Pixel' },
      { id: 2, entryId: 10, criterionId: 2, value: 999 },
    ],
  });
  const entryUpdate = vi.fn().mockResolvedValue({
    id: 10,
    comparisonId: 1,
    entryValues: [
      { id: 1, entryId: 10, criterionId: 1, value: 'Pixel 8' },
      { id: 2, entryId: 10, criterionId: 2, value: 999 },
    ],
  });
  const entryDelete = vi.fn().mockResolvedValue({ id: 10 });
  const entryValueUpsert = vi.fn().mockResolvedValue({ id: 99 });
  const entryValueFindMany = vi.fn().mockResolvedValue([
    { id: 1, entryId: 10, criterionId: 1, value: 'Pixel' },
    { id: 2, entryId: 10, criterionId: 2, value: 999 },
  ]);
  const entryValueFindFirst = vi.fn().mockResolvedValue({
    id: 1,
    entryId: 10,
    criterionId: 1,
    value: 'Pixel',
  });
  const entryValueDelete = vi.fn().mockResolvedValue({ id: 1 });
  const prisma = {
    comparison: {
      findUnique: comparisonFindUnique,
    },
    criterion: {
      findMany: criterionFindMany,
    },
    entry: {
      create: entryCreate,
      findMany: entryFindMany,
      findUnique: entryFindUnique,
      findFirst: vi.fn().mockResolvedValue({
        id: 10,
        comparisonId: 1,
      }),
      update: entryUpdate,
      delete: entryDelete,
    },
    entryValue: {
      upsert: entryValueUpsert,
      findMany: entryValueFindMany,
      findFirst: entryValueFindFirst,
      delete: entryValueDelete,
    },
    $transaction: vi.fn(async (callback: (transaction: unknown) => unknown) =>
      callback({
        entry: {
          create: entryCreate,
          findUnique: entryFindUnique,
          update: entryUpdate,
          delete: entryDelete,
          findMany: entryFindMany,
          findFirst: vi.fn().mockResolvedValue({
            id: 10,
            comparisonId: 1,
          }),
        },
        entryValue: {
          upsert: entryValueUpsert,
        },
        criterion: {
          findMany: criterionFindMany,
        },
      }),
    ),
  } as unknown as PrismaService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [EntriesService],
    })
      .useMocker((token) => token === PrismaService ? prisma : undefined)
      .compile();

    service = module.get<EntriesService>(EntriesService);
  });

  it('creates an entry with values from the comparison criteria', async () => {
    const result = await service.create(1, {
      values: [
        { criterionId: 1, type: 'text', value: 'Pixel' },
        { criterionId: 2, type: 'number', value: 999 },
      ],
    });

    expect(comparisonFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true },
    });
    expect(criterionFindMany).toHaveBeenCalledWith({
      where: { comparisonId: 1 },
    });
    expect(entryCreate).toHaveBeenCalledWith({
      data: { comparisonId: 1 },
    });
    expect(entryValueUpsert).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      id: 10,
      comparisonId: 1,
      entryValues: [
        { id: 1, entryId: 10, criterionId: 1, value: 'Pixel' },
        { id: 2, entryId: 10, criterionId: 2, value: 999 },
      ],
    });
  });

  it('throws NotFoundException when the comparison does not exist', async () => {
    comparisonFindUnique.mockResolvedValueOnce(null);

    await expect(service.create(999, {
      values: [{ criterionId: 1, type: 'text', value: 'Pixel' }],
    })).rejects.toThrow(NotFoundException);
  });

  it('rejects empty built-in name values', async () => {
    await expect(service.create(1, {
      values: [{ criterionId: 1, type: 'text', value: '   ' }],
    })).rejects.toThrow(BadRequestException);
  });

  it('requires the built-in name value when creating an entry', async () => {
    await expect(service.create(1, {
      values: [{ criterionId: 2, type: 'number', value: 999 }],
    })).rejects.toThrow(BadRequestException);
    expect(entryCreate).not.toHaveBeenCalled();
  });

  it('updates an existing entry value', async () => {
    entryFindUnique.mockResolvedValueOnce({
      id: 10,
      comparisonId: 1,
      entryValues: [
        { id: 1, entryId: 10, criterionId: 1, value: 'Pixel 8' },
        { id: 2, entryId: 10, criterionId: 2, value: 999 },
      ],
    });

    const result = await service.update(1, 10, {
      values: [{ criterionId: 1, type: 'text', value: 'Pixel 8' }],
    });

    expect(entryValueUpsert).toHaveBeenCalledWith({
      where: { entryId_criterionId: { entryId: 10, criterionId: 1 } },
      update: { value: 'Pixel 8' },
      create: { entryId: 10, criterionId: 1, value: 'Pixel 8' },
    });
    expect(result).toEqual({
      id: 10,
      comparisonId: 1,
      entryValues: [
        { id: 1, entryId: 10, criterionId: 1, value: 'Pixel 8' },
        { id: 2, entryId: 10, criterionId: 2, value: 999 },
      ],
    });
  });

  it('returns all entry values for an entry', async () => {
    const result = await service.findAllValues(1, 10);

    expect(entryValueFindMany).toHaveBeenCalledWith({
      where: {
        entryId: 10,
      },
      include: {
        criterion: true,
      },
      orderBy: { criterionId: 'asc' },
    });
    expect(result).toEqual([
      { id: 1, entryId: 10, criterionId: 1, value: 'Pixel' },
      { id: 2, entryId: 10, criterionId: 2, value: 999 },
    ]);
  });

  it('upserts a single entry value for a criterion', async () => {
    const result = await service.upsertValue(1, 10, 1, {
      type: 'text',
      value: 'Pixel 8',
    });

    expect(entryValueUpsert).toHaveBeenCalledWith({
      where: { entryId_criterionId: { entryId: 10, criterionId: 1 } },
      update: { value: 'Pixel 8' },
      create: { entryId: 10, criterionId: 1, value: 'Pixel 8' },
    });
    expect(result).toEqual({ id: 99 });
  });

  it('accepts a finite number for a number criterion', async () => {
    criterionFindMany.mockResolvedValueOnce([
      {
        id: 2,
        comparisonId: 1,
        name: 'Price',
        type: 'Float',
        config: null,
        is_comparable: true,
        is_key: false,
      },
    ]);

    await service.upsertValue(1, 10, 2, {
      type: 'number',
      value: 999,
    });

    expect(entryValueUpsert).toHaveBeenCalledWith({
      where: { entryId_criterionId: { entryId: 10, criterionId: 2 } },
      update: { value: 999 },
      create: { entryId: 10, criterionId: 2, value: 999 },
    });
  });

  it('rejects a value type that does not match the criterion type', async () => {
    criterionFindMany.mockResolvedValueOnce([
      {
        id: 2,
        comparisonId: 1,
        name: 'Price',
        type: 'Float',
        config: null,
        is_comparable: true,
        is_key: false,
      },
    ]);

    await expect(service.upsertValue(1, 10, 2, {
      type: 'text',
      value: '999',
    })).rejects.toThrow(BadRequestException);
    expect(entryValueUpsert).not.toHaveBeenCalled();
  });

  it('accepts a rating within the configured range', async () => {
    criterionFindMany.mockResolvedValueOnce([
      {
        id: 3,
        comparisonId: 1,
        name: 'Quality',
        type: 'Rating',
        config: { min: 1, max: 5 },
        is_comparable: true,
        is_key: false,
      },
    ]);

    await service.upsertValue(1, 10, 3, {
      type: 'rating',
      value: 4,
    });

    expect(entryValueUpsert).toHaveBeenCalledWith({
      where: { entryId_criterionId: { entryId: 10, criterionId: 3 } },
      update: { value: 4 },
      create: { entryId: 10, criterionId: 3, value: 4 },
    });
  });

  it('rejects a rating outside the configured range', async () => {
    criterionFindMany.mockResolvedValueOnce([
      {
        id: 3,
        comparisonId: 1,
        name: 'Quality',
        type: 'Rating',
        config: { min: 1, max: 5 },
        is_comparable: true,
        is_key: false,
      },
    ]);

    await expect(service.upsertValue(1, 10, 3, {
      type: 'rating',
      value: 6,
    })).rejects.toThrow(BadRequestException);
    expect(entryValueUpsert).not.toHaveBeenCalled();
  });

  it('accepts an enum option configured for the criterion', async () => {
    criterionFindMany.mockResolvedValueOnce([
      {
        id: 4,
        comparisonId: 1,
        name: 'Color',
        type: 'Enum',
        config: { options: ['Black', 'White'] },
        is_comparable: false,
        is_key: false,
      },
    ]);

    await service.upsertValue(1, 10, 4, {
      type: 'enum',
      value: 'Black',
    });

    expect(entryValueUpsert).toHaveBeenCalledWith({
      where: { entryId_criterionId: { entryId: 10, criterionId: 4 } },
      update: { value: 'Black' },
      create: { entryId: 10, criterionId: 4, value: 'Black' },
    });
  });

  it('rejects an enum option not configured for the criterion', async () => {
    criterionFindMany.mockResolvedValueOnce([
      {
        id: 4,
        comparisonId: 1,
        name: 'Color',
        type: 'Enum',
        config: { options: ['Black', 'White'] },
        is_comparable: false,
        is_key: false,
      },
    ]);

    await expect(service.upsertValue(1, 10, 4, {
      type: 'enum',
      value: 'Red',
    })).rejects.toThrow(BadRequestException);
    expect(entryValueUpsert).not.toHaveBeenCalled();
  });

  it('returns NotFoundException when deleting a missing entry value', async () => {
    entryValueFindFirst.mockResolvedValueOnce(null);

    await expect(service.removeValue(1, 10, 2)).rejects.toThrow(NotFoundException);
    expect(entryValueDelete).not.toHaveBeenCalled();
  });
});
