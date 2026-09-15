import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { ComparisonsController } from './comparisons.controller.js';
import { ComparisonsService } from './comparisons.service.js';

const PUBLIC_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

describe('ComparisonsController', () => {
  let controller: ComparisonsController;
  const createComparison = vi.fn().mockResolvedValue({
    id: 1,
    publicId: PUBLIC_ID,
    name: 'Phones',
  });
  const getAll = vi
    .fn()
    .mockResolvedValue([{ id: 1, publicId: PUBLIC_ID, name: 'Phones' }]);
  const getByPublicId = vi
    .fn()
    .mockResolvedValue({ id: 1, publicId: PUBLIC_ID, name: 'Phones' });
  const update = vi
    .fn()
    .mockResolvedValue({ id: 1, publicId: PUBLIC_ID, name: 'Mobile phones' });
  const remove = vi
    .fn()
    .mockResolvedValue({ id: 1, publicId: PUBLIC_ID, name: 'Phones' });

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComparisonsController],
      providers: [
        {
          provide: ComparisonsService,
          useValue: { createComparison, getAll, getByPublicId, update, remove },
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
      publicId: PUBLIC_ID,
      name: 'Phones',
    });
    expect(createComparison).toHaveBeenCalledWith(body);
  });

  it('delegates fetching comparisons to the service', async () => {
    await expect(controller.getComparisons()).resolves.toEqual([
      { id: 1, publicId: PUBLIC_ID, name: 'Phones' },
    ]);
    expect(getAll).toHaveBeenCalledOnce();
  });

  it('delegates fetching one comparison to the service', async () => {
    await expect(controller.getComparisonByPublicId(PUBLIC_ID)).resolves.toEqual({
      id: 1,
      publicId: PUBLIC_ID,
      name: 'Phones',
    });
    expect(getByPublicId).toHaveBeenCalledWith(PUBLIC_ID);
  });

  it('delegates comparison rename to the service', async () => {
    const body = { name: 'Mobile phones' };

    await expect(controller.updateComparison(PUBLIC_ID, body)).resolves.toEqual({
      id: 1,
      publicId: PUBLIC_ID,
      name: 'Mobile phones',
    });
    expect(update).toHaveBeenCalledWith(PUBLIC_ID, body);
  });

  it('delegates comparison deletion to the service', async () => {
    await expect(controller.deleteComparison(PUBLIC_ID)).resolves.toEqual({
      id: 1,
      publicId: PUBLIC_ID,
      name: 'Phones',
    });
    expect(remove).toHaveBeenCalledWith(PUBLIC_ID);
  });
});
