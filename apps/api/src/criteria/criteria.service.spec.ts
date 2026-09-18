import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { CreateCriterionInput } from '@compy/shared';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { CriteriaService } from './criteria.service.js';

const PUBLIC_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
const USER_ID = 42;

describe('CriteriaService', () => {
  let service: CriteriaService;
  const comparisonFindFirst = vi.fn().mockResolvedValue({ id: 1 });
  const comparisonUpdate = vi.fn().mockResolvedValue({ id: 1 });
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
    is_comparable: true,
    weight: 25,
  });
  const criterionUpdate = vi.fn().mockResolvedValue({
    id: 2,
    comparisonId: 1,
    name: 'Updated price',
    weight: 25,
    ruleConfig: { direction: 'lower' },
    is_key: false,
  });
  const criterionDelete = vi.fn().mockResolvedValue({ id: 2, name: 'Price' });
  const transactionCriterionUpdate = vi.fn();
  const prisma = {
    comparison: { findFirst: comparisonFindFirst, update: comparisonUpdate },
    criterion: {
      create: criterionCreate,
      findMany: criterionFindMany,
      findFirst: criterionFindFirst,
      update: criterionUpdate,
      delete: criterionDelete,
    },
    $transaction: vi.fn(async (callback: (transaction: unknown) => unknown) =>
      callback({
        criterion: {
          update: transactionCriterionUpdate,
        },
      }),
    ),
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

    await service.create(PUBLIC_ID, USER_ID, criterion);

    expect(comparisonFindFirst).toHaveBeenCalledWith({
      where: {
        publicId: PUBLIC_ID,
        OR: [
          { ownerId: USER_ID },
          { grants: { some: { userId: USER_ID } } },
        ],
      },
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
    comparisonFindFirst.mockResolvedValueOnce(null);

    await expect(
      service.create('01ZZZZZZZZZZZZZZZZZZZZZZZZ', USER_ID, {
        name: 'Price',
        type: 'number',
        is_comparable: true,
      }),
    ).rejects.toThrowError(NotFoundException);
    expect(criterionCreate).not.toHaveBeenCalled();
  });

  it('allows a custom criterion to use the same display name as the built-in criterion', async () => {
    await service.create(PUBLIC_ID, USER_ID, {
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
    const result = await service.findAll(PUBLIC_ID, USER_ID);

    expect(comparisonFindFirst).toHaveBeenCalledWith({
      where: {
        publicId: PUBLIC_ID,
        OR: [
          { ownerId: USER_ID },
          { grants: { some: { userId: USER_ID } } },
        ],
      },
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
    const result = await service.update(PUBLIC_ID, USER_ID, 2, { name: 'Updated price' });

    expect(criterionUpdate).toHaveBeenCalledWith({
      where: { id: 2, comparisonId: 1 },
      data: { name: 'Updated price' },
    });
    expect(result).toEqual({
      id: 2,
      comparisonId: 1,
      name: 'Updated price',
      weight: 25,
      ruleConfig: { direction: 'lower' },
      is_key: false,
    });
  });

  it('updates criterion weight and rule config', async () => {
    criterionFindMany.mockResolvedValueOnce([
      { id: 2, weight: 10, is_comparable: true },
    ]);

    const result = await service.update(PUBLIC_ID, USER_ID, 2, {
      weight: 25,
      ruleConfig: { direction: 'lower' },
    });

    expect(criterionFindMany).toHaveBeenCalledWith({
      where: { comparisonId: 1, is_comparable: true },
      select: { id: true, weight: true, is_comparable: true },
    });
    expect(criterionUpdate).toHaveBeenCalledWith({
      where: { id: 2, comparisonId: 1 },
      data: {
        weight: 25,
        ruleConfig: { direction: 'lower' },
      },
    });
    expect(result.weight).toBe(25);
    expect(result.ruleConfig).toEqual({ direction: 'lower' });
  });

  it('rejects a weight that would exceed the comparable pool', async () => {
    criterionFindMany.mockResolvedValueOnce([
      { id: 2, weight: 40, is_comparable: true },
      { id: 3, weight: 60, is_comparable: true },
    ]);

    await expect(service.update(PUBLIC_ID, USER_ID, 2, { weight: 41 })).rejects.toThrow(
      BadRequestException,
    );
    expect(criterionUpdate).not.toHaveBeenCalled();
  });

  it('rejects weight updates on non-comparable criteria', async () => {
    criterionFindFirst.mockResolvedValueOnce({
      id: 1,
      comparisonId: 1,
      name: 'name',
      type: 'text',
      config: null,
      is_key: true,
      is_comparable: false,
      weight: 0,
    });

    await expect(service.update(PUBLIC_ID, USER_ID, 1, { weight: 10 })).rejects.toThrow(
      BadRequestException,
    );
    expect(criterionFindMany).not.toHaveBeenCalled();
    expect(criterionUpdate).not.toHaveBeenCalled();
  });

  it('rejects rule config that does not match the criterion type', async () => {
    await expect(
      service.update(PUBLIC_ID, USER_ID, 2, {
        ruleConfig: { preferredValue: true },
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
      service.update(PUBLIC_ID, USER_ID, 1, {
        ruleConfig: { direction: 'higher' },
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
      service.update(PUBLIC_ID, USER_ID, 3, {
        ruleConfig: {
          tiers: [
            { rank: 1, values: ['Petrol'] },
            { rank: 5, values: ['Diesel', 'Hybrid'] },
          ],
        },
      }),
    ).rejects.toThrow(BadRequestException);
    expect(criterionUpdate).not.toHaveBeenCalled();
  });

  it('accepts valid enum tiers covering all options', async () => {
    criterionFindFirst.mockResolvedValueOnce({
      id: 3,
      comparisonId: 1,
      name: 'fuel',
      type: 'enum',
      config: { options: ['Petrol', 'Diesel'] },
      is_key: false,
    });

    await expect(
      service.update(PUBLIC_ID, USER_ID, 3, {
        ruleConfig: {
          tiers: [
            { rank: 1, values: ['Petrol'] },
            { rank: 2, values: ['Diesel'] },
          ],
        },
      }),
    ).resolves.toEqual({
      id: 2,
      comparisonId: 1,
      name: 'Updated price',
      weight: 25,
      ruleConfig: { direction: 'lower' },
      is_key: false,
    });
    expect(criterionUpdate).toHaveBeenCalledWith({
      where: { id: 3, comparisonId: 1 },
      data: {
        ruleConfig: {
          tiers: [
            { rank: 1, values: ['Petrol'] },
            { rank: 2, values: ['Diesel'] },
          ],
        },
      },
    });
  });

  it('throws NotFoundException when updating a missing criterion', async () => {
    criterionFindFirst.mockResolvedValueOnce(null);

    await expect(service.update(PUBLIC_ID, USER_ID, 999, { name: 'Missing' })).rejects.toThrow(
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

    const result = await service.update(PUBLIC_ID, USER_ID, 1, { name: 'Entry name' });

    expect(result).toEqual({
      id: 2,
      comparisonId: 1,
      name: 'Updated price',
      weight: 25,
      ruleConfig: { direction: 'lower' },
      is_key: false,
    });
    await expect(service.remove(PUBLIC_ID, USER_ID, 1)).rejects.toThrow(BadRequestException);
    expect(criterionUpdate).toHaveBeenCalledWith({
      where: { id: 1, comparisonId: 1 },
      data: { name: 'Entry name' },
    });
    expect(criterionDelete).not.toHaveBeenCalled();
  });

  it('replaces all comparable weights in one transaction', async () => {
    criterionFindMany
      .mockResolvedValueOnce([{ id: 2 }, { id: 3 }, { id: 4 }])
      .mockResolvedValueOnce([
        { id: 2, weight: 100 },
        { id: 3, weight: 0 },
        { id: 4, weight: 0 },
      ]);

    const result = await service.replaceWeights(PUBLIC_ID, USER_ID, {
      weights: [
        { criterionId: 2, weight: 100 },
        { criterionId: 3, weight: 0 },
        { criterionId: 4, weight: 0 },
      ],
    });

    expect(criterionFindMany).toHaveBeenNthCalledWith(1, {
      where: { comparisonId: 1, is_comparable: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(transactionCriterionUpdate).toHaveBeenCalledTimes(3);
    expect(transactionCriterionUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: 2 },
      data: { weight: 100 },
    });
    expect(transactionCriterionUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 3 },
      data: { weight: 0 },
    });
    expect(transactionCriterionUpdate).toHaveBeenNthCalledWith(3, {
      where: { id: 4 },
      data: { weight: 0 },
    });
    expect(criterionUpdate).not.toHaveBeenCalled();
    expect(result).toEqual([
      { id: 2, weight: 100 },
      { id: 3, weight: 0 },
      { id: 4, weight: 0 },
    ]);
  });

  it('rejects a missing comparable criterion id', async () => {
    criterionFindMany.mockResolvedValueOnce([{ id: 2 }, { id: 3 }]);

    await expect(
      service.replaceWeights(PUBLIC_ID, USER_ID, {
        weights: [{ criterionId: 2, weight: 100 }],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(criterionUpdate).not.toHaveBeenCalled();
  });

  it('rejects weights that do not sum to 100', async () => {
    await expect(
      service.replaceWeights(PUBLIC_ID, USER_ID, {
        weights: [
          { criterionId: 2, weight: 40 },
          { criterionId: 3, weight: 40 },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(criterionFindMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a non-comparable criterion id', async () => {
    criterionFindMany.mockResolvedValueOnce([{ id: 2 }, { id: 3 }]);

    await expect(
      service.replaceWeights(PUBLIC_ID, USER_ID, {
        weights: [
          { criterionId: 2, weight: 50 },
          { criterionId: 1, weight: 50 },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(criterionUpdate).not.toHaveBeenCalled();
  });
});
