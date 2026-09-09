import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { CreateCriterionInput } from '@compy/shared';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { CriteriaService } from './criteria.service.js';

describe('CriteriaService', () => {
  let service: CriteriaService;
  const comparisonFindUnique = vi.fn().mockResolvedValue({ id: 1 });
  const criterionCreate = vi.fn().mockResolvedValue({ id: 2, name: 'Price' });
  const criterionFindMany = vi.fn().mockResolvedValue([
    { id: 1, comparisonId: 1, name: 'name', is_key: true },
    { id: 2, comparisonId: 1, name: 'Price', is_key: false },
  ]);
  const criterionFindFirst = vi.fn().mockResolvedValue({
    id: 2,
    comparisonId: 1,
    name: 'Price',
    type: 'number',
    config: null,
    is_key: false,
  });
  const criterionUpdate = vi.fn().mockResolvedValue({
    id: 2,
    comparisonId: 1,
    name: 'Updated price',
    weight: 25,
    ruleConfig: { type: 'number', direction: 'lower' },
    is_key: false,
  });
  const criterionDelete = vi.fn().mockResolvedValue({ id: 2, name: 'Price' });
  const prisma = {
    comparison: { findUnique: comparisonFindUnique },
    criterion: {
      create: criterionCreate,
      findMany: criterionFindMany,
      findFirst: criterionFindFirst,
      update: criterionUpdate,
      delete: criterionDelete,
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CriteriaService],
    })
      .useMocker((token) => (token === PrismaService ? prisma : undefined))
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
        type: 'number',
        config: undefined,
        is_comparable: true,
        is_key: false,
      },
    });
  });

  it('throws NotFoundException when the comparison does not exist', async () => {
    comparisonFindUnique.mockResolvedValueOnce(null);

    await expect(
      service.create(999, {
        name: 'Price',
        type: 'number',
        is_comparable: true,
      }),
    ).rejects.toThrowError(NotFoundException);
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
        type: 'text',
        config: undefined,
        is_comparable: false,
        is_key: false,
      },
    });
  });

  it('returns all criteria for a comparison', async () => {
    const result = await service.findAll(1);

    expect(comparisonFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true },
    });
    expect(criterionFindMany).toHaveBeenCalledWith({
      where: { comparisonId: 1 },
      orderBy: { createdAt: 'asc' },
    });
    expect(result).toEqual([
      { id: 1, comparisonId: 1, name: 'name', is_key: true },
      { id: 2, comparisonId: 1, name: 'Price', is_key: false },
    ]);
  });

  it('updates a custom criterion name', async () => {
    const result = await service.update(1, 2, { name: 'Updated price' });

    expect(criterionUpdate).toHaveBeenCalledWith({
      where: { id: 2, comparisonId: 1 },
      data: { name: 'Updated price' },
    });
    expect(result).toEqual({
      id: 2,
      comparisonId: 1,
      name: 'Updated price',
      weight: 25,
      ruleConfig: { type: 'number', direction: 'lower' },
      is_key: false,
    });
  });

  it('updates criterion weight and rule config', async () => {
    const result = await service.update(1, 2, {
      weight: 25,
      ruleConfig: { type: 'number', direction: 'lower' },
    });

    expect(criterionUpdate).toHaveBeenCalledWith({
      where: { id: 2, comparisonId: 1 },
      data: {
        weight: 25,
        ruleConfig: { type: 'number', direction: 'lower' },
      },
    });
    expect(result.weight).toBe(25);
    expect(result.ruleConfig).toEqual({ type: 'number', direction: 'lower' });
  });

  it('rejects rule config that does not match the criterion type', async () => {
    await expect(
      service.update(1, 2, {
        ruleConfig: { type: 'boolean', preferredValue: true },
      }),
    ).rejects.toThrow(BadRequestException);
    expect(criterionUpdate).not.toHaveBeenCalled();
  });

  it('rejects rule config on text criteria', async () => {
    criterionFindFirst.mockResolvedValueOnce({
      id: 1,
      comparisonId: 1,
      name: 'name',
      type: 'text',
      config: null,
      is_key: true,
    });

    await expect(
      service.update(1, 1, {
        ruleConfig: { type: 'number', direction: 'higher' },
      }),
    ).rejects.toThrow(BadRequestException);
    expect(criterionUpdate).not.toHaveBeenCalled();
  });

  it('validates enum rule assignments against criterion options', async () => {
    criterionFindFirst.mockResolvedValueOnce({
      id: 3,
      comparisonId: 1,
      name: 'fuel',
      type: 'enum',
      config: { options: ['Petrol', 'Diesel'] },
      is_key: false,
    });

    await expect(
      service.update(1, 3, {
        ruleConfig: {
          type: 'enum',
          tiers: [
            { rank: 1, label: 'Bad', values: ['Petrol'] },
            { rank: 5, label: 'Great', values: ['Diesel', 'Hybrid'] },
          ],
        },
      }),
    ).rejects.toThrow(BadRequestException);
    expect(criterionUpdate).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when updating a missing criterion', async () => {
    criterionFindFirst.mockResolvedValueOnce(null);

    await expect(service.update(1, 999, { name: 'Missing' })).rejects.toThrow(
      NotFoundException,
    );
    expect(criterionUpdate).not.toHaveBeenCalled();
  });

  it('allows the built-in name criterion to be renamed but refuses deletion', async () => {
    criterionFindFirst
      .mockResolvedValueOnce({
        id: 1,
        comparisonId: 1,
        name: 'name',
        type: 'text',
        config: null,
        is_key: true,
      })
      .mockResolvedValueOnce({
        id: 1,
        comparisonId: 1,
        name: 'name',
        type: 'text',
        config: null,
        is_key: true,
      });

    const result = await service.update(1, 1, { name: 'Entry name' });

    expect(result).toEqual({
      id: 2,
      comparisonId: 1,
      name: 'Updated price',
      weight: 25,
      ruleConfig: { type: 'number', direction: 'lower' },
      is_key: false,
    });
    await expect(service.remove(1, 1)).rejects.toThrow(BadRequestException);
    expect(criterionUpdate).toHaveBeenCalledWith({
      where: { id: 1, comparisonId: 1 },
      data: { name: 'Entry name' },
    });
    expect(criterionDelete).not.toHaveBeenCalled();
  });
});
