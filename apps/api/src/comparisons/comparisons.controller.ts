import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { CreateComparisonSchema, IdSchema } from '@compy/shared';
import type { CreateComparisonInput } from '@compy/shared';
import { ComparisonsService } from './comparisons.service.js';

@Controller('comparisons')
export class ComparisonsController {

  constructor(private readonly comparisonsService: ComparisonsService) { }

  @Get()
  public getComparisons() {
    return this.comparisonsService.getAll();
  }

  @Get(':id')
  public getComparisonById(
    @Param('id', new ZodValidationPipe(IdSchema)) id: number
  ) {
    return this.comparisonsService.getById(id);
  }

  @Post()
  public createComparison(
    @Body(new ZodValidationPipe(CreateComparisonSchema)) body: CreateComparisonInput
  ) {
    return this.comparisonsService.createComparison(body);
  }
}
