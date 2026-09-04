import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { ComparisonsController } from './comparisons.controller.js';
import { ComparisonsService } from './comparisons.service.js';

describe('ComparisonsController', () => {
  let controller: ComparisonsController;
  const createComparison = vi.fn().mockResolvedValue({ id: 1, name: 'Phones' });
  const getAll = vi.fn().mockResolvedValue([{ id: 1, name: 'Phones' }]);

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComparisonsController],
      providers: [
        {
          provide: ComparisonsService,
          useValue: { createComparison, getAll },
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
});
