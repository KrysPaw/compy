import { Test, TestingModule } from '@nestjs/testing';
import { ComparisonsService } from './comparisons.service.js';

describe('ComparisonsService', () => {
  let service: ComparisonsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComparisonsService],
    }).compile();

    service = module.get<ComparisonsService>(ComparisonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
