import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ComparisonsService } from './comparisons.service.js';
import { describe, expect, it, vi } from 'vitest';

describe('ComparisonsService', () => {
  let service: ComparisonsService;
  const comparison = {
    id: 1,
    name: 'Phones',
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
  const comparisonDetailFindUnique = vi
    .fn()
    .mockResolvedValue(comparisonDetail);
  const comparisonFindMany = vi.fn().mockResolvedValue([createdComparison]);
  const prisma = {
    comparison: {
      findUnique: comparisonDetailFindUnique,
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

  it('creates a comparison with the built-in name criterion', async () => {
    const result = await service.createComparison({ name: 'Phones' });

    expect(comparisonCreate).toHaveBeenCalledWith({
      data: { name: 'Phones' },
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

  it('returns all comparisons ordered by last update', async () => {
    const result = await service.getAll();

    expect(comparisonFindMany).toHaveBeenCalledWith({
      orderBy: { updatedAt: 'desc' },
    });
    expect(result).toEqual([createdComparison]);
  });

  it('returns a comparison with criteria, entries, and entry values', async () => {
    const result = await service.getById(1);

    expect(comparisonDetailFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
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
    expect(result).toEqual(comparisonDetail);
  });

  it('throws NotFoundException when the comparison does not exist', async () => {
    comparisonDetailFindUnique.mockResolvedValueOnce(null);

    await expect(service.getById(999)).rejects.toThrowError(NotFoundException);
  });

  it('renames an existing comparison', async () => {
    const result = await service.update(1, { name: 'Mobile phones' });

    expect(comparisonUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'Mobile phones' },
    });
    expect(result).toEqual({ ...comparison, name: 'Mobile phones' });
  });

  it('deletes an existing comparison', async () => {
    const result = await service.remove(1);

    expect(comparisonDelete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(comparison);
  });

  it('rejects renaming a missing comparison', async () => {
    comparisonDetailFindUnique.mockResolvedValueOnce(null);

    await expect(service.update(999, { name: 'Missing' })).rejects.toThrowError(
      NotFoundException,
    );
    expect(comparisonUpdate).not.toHaveBeenCalled();
  });
});
