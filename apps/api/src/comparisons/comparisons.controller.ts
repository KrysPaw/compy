import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { CreateComparisonSchema, CreateCriterionSchema, IdSchema, UpdateComparisonSchema } from '@compy/shared';
import type { CreateComparisonInput, CreateCriterionInput, UpdateComparisonInput } from '@compy/shared';
import { ComparisonsService } from './comparisons.service.js';
import { CriteriaService } from '../criteria/criteria.service.js';

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

  @Patch(':id')
  public updateComparison(
    @Param('id', new ZodValidationPipe(IdSchema)) id: number,
    @Body(new ZodValidationPipe(UpdateComparisonSchema)) body: UpdateComparisonInput,
  ) {
    return this.comparisonsService.update(id, body);
  }

  @Delete(':id')
  public deleteComparison(
    @Param('id', new ZodValidationPipe(IdSchema)) id: number,
  ) {
    return this.comparisonsService.remove(id);
  }

  @Post(':id/criteria')
  public createCriterion(
    @Param('id', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Body(new ZodValidationPipe(CreateCriterionSchema)) body: CreateCriterionInput,
  ) {
    return this.criteriaService.create(comparisonId, body);
  }
}
