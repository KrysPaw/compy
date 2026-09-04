import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { ComparisonsController } from './comparisons.controller.js';
import { ComparisonsService } from './comparisons.service.js';
import { CriteriaService } from '../criteria/criteria.service.js';

describe('ComparisonsController', () => {
  let controller: ComparisonsController;
  const createComparison = vi.fn().mockResolvedValue({ id: 1, name: 'Phones' });
  const getAll = vi.fn().mockResolvedValue([{ id: 1, name: 'Phones' }]);
  const getById = vi.fn().mockResolvedValue({ id: 1, name: 'Phones' });
  const update = vi.fn().mockResolvedValue({ id: 1, name: 'Mobile phones' });
  const remove = vi.fn().mockResolvedValue({ id: 1, name: 'Phones' });
  const createCriterion = vi.fn().mockResolvedValue({ id: 2, name: 'Price' });

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComparisonsController],
      providers: [
        {
          provide: ComparisonsService,
          useValue: { createComparison, getAll, getById, update, remove },
        },
        {
          provide: CriteriaService,
          useValue: { create: createCriterion },
        },
      ],
    }).compile();

    controller = module.get<ComparisonsController>(ComparisonsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates comparison creation to the service', async () => {
    const body = { name: 'Phones' };

    await expect(controller.createComparison(body)).resolves.toEqual({
      id: 1,
      name: 'Phones',
    });
    expect(createComparison).toHaveBeenCalledWith(body);
  });

  it('delegates fetching comparisons to the service', async () => {
    await expect(controller.getComparisons()).resolves.toEqual([
      { id: 1, name: 'Phones' },
    ]);
    expect(getAll).toHaveBeenCalledOnce();
  });

  it('delegates fetching one comparison to the service', async () => {
    await expect(controller.getComparisonById(1)).resolves.toEqual({
      id: 1,
      name: 'Phones',
    });
    expect(getById).toHaveBeenCalledWith(1);
  });

  it('delegates comparison rename to the service', async () => {
    const body = { name: 'Mobile phones' };

    await expect(controller.updateComparison(1, body)).resolves.toEqual({
      id: 1,
      name: 'Mobile phones',
    });
    expect(update).toHaveBeenCalledWith(1, body);
  });

  it('delegates comparison deletion to the service', async () => {
    await expect(controller.deleteComparison(1)).resolves.toEqual({
      id: 1,
      name: 'Phones',
    });
    expect(remove).toHaveBeenCalledWith(1);
  });

  it('delegates creating a criterion to the service', async () => {
    const body = { name: 'Price', type: 'number', is_comparable: true } as const;

    await expect(controller.createCriterion(1, body)).resolves.toEqual({
      id: 2,
      name: 'Price',
    });
    expect(createCriterion).toHaveBeenCalledWith(1, body);
  });
});
