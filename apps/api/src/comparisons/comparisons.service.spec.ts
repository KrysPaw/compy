import { Test, TestingModule } from '@nestjs/testing';
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
        type: 'Text',
        config: null,
        is_comparable: false,
        is_key: true,
        createdAt: comparison.createdAt,
        updatedAt: comparison.updatedAt,
      },
    ],
  };
  const comparisonCreate = vi.fn().mockResolvedValue(comparison);
  const criterionCreate = vi.fn().mockResolvedValue(createdComparison.criteria[0]);
  const comparisonFindUnique = vi.fn().mockResolvedValue(createdComparison);
  const prisma = {
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
      .useMocker((token) => token === PrismaService ? prisma : undefined)
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
        type: 'Text',
        is_comparable: false,
        is_key: true,
      },
    });
    expect(comparisonFindUnique).toHaveBeenCalledWith({
      where: { id: comparison.id },
      include: { criteria: true },
    });
    expect(result).toEqual(createdComparison);
  });
});
