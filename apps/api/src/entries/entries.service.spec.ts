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
});
