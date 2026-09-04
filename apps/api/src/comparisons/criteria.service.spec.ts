import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { CreateCriterionInput } from '@compy/shared';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { CriteriaService } from './criteria.service.js';

describe('CriteriaService', () => {
  let service: CriteriaService;
  const comparisonFindUnique = vi.fn().mockResolvedValue({ id: 1 });
  const criterionCreate = vi.fn().mockResolvedValue({ id: 2, name: 'Price' });
  const prisma = {
    comparison: { findUnique: comparisonFindUnique },
    criterion: { create: criterionCreate },
  } as unknown as PrismaService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CriteriaService],
    })
      .useMocker((token) => token === PrismaService ? prisma : undefined)
      .compile();

    service = module.get<CriteriaService>(CriteriaService);
  });

  it('creates a criterion for an existing comparison', async () => {
    const criterion: CreateCriterionInput = {
      name: 'Price',
      type: 'number',
      is_comparable: true,
    };

    await service.create(1, criterion);

    expect(comparisonFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true },
    });
    expect(criterionCreate).toHaveBeenCalledWith({
      data: {
        comparisonId: 1,
        name: 'Price',
        type: 'Float',
        config: undefined,
        is_comparable: true,
        is_key: false,
      },
    });
  });

  it('throws NotFoundException when the comparison does not exist', async () => {
    comparisonFindUnique.mockResolvedValueOnce(null);

    await expect(service.create(999, {
      name: 'Price',
      type: 'number',
      is_comparable: true,
    })).rejects.toThrowError(NotFoundException);
    expect(criterionCreate).not.toHaveBeenCalled();
  });

  it('allows a custom criterion to use the same display name as the built-in criterion', async () => {
    await service.create(1, {
      name: 'name',
      type: 'text',
      is_comparable: false,
    });

    expect(criterionCreate).toHaveBeenCalledWith({
      data: {
        comparisonId: 1,
        name: 'name',
        type: 'Text',
        config: undefined,
        is_comparable: false,
        is_key: false,
      },
    });
  });
});
