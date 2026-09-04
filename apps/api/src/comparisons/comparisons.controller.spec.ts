import { Test, TestingModule } from '@nestjs/testing';
import { ComparisonsController } from './comparisons.controller.js';

describe('ComparisonsController', () => {
  let controller: ComparisonsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComparisonsController],
    }).compile();

    controller = module.get<ComparisonsController>(ComparisonsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
