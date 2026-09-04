import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { CreateComparisonSchema, CreateCriterionSchema, IdSchema } from '@compy/shared';
import type { CreateComparisonInput, CreateCriterionInput } from '@compy/shared';
import { CriteriaService } from './criteria.service.js';
import { ComparisonsService } from './comparisons.service.js';

@Controller('comparisons')
export class ComparisonsController {

  constructor(
    private readonly comparisonsService: ComparisonsService,
    private readonly criteriaService: CriteriaService,
  ) { }

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

  @Post(':id/criteria')
  public createCriterion(
    @Param('id', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Body(new ZodValidationPipe(CreateCriterionSchema)) body: CreateCriterionInput,
  ) {
    return this.criteriaService.create(comparisonId, body);
  }
}
