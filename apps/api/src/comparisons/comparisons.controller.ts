import { Body, Controller, Get, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { CreateComparisonSchema } from '@compy/shared';
import type { CreateComparisonInput } from '@compy/shared';
import { ComparisonsService } from './comparisons.service.js';

@Controller('comparisons')
export class ComparisonsController {

  constructor(private readonly comparisonsService: ComparisonsService) { }

  @Get()
  public getComparisons() {
    return this.comparisonsService.getAll();
  }

  @Post()
  public createComparison(
    @Body(new ZodValidationPipe(CreateComparisonSchema)) body: CreateComparisonInput
  ) {
    return this.comparisonsService.createComparison(body);
  }
}
