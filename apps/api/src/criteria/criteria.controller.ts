import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { CreateCriterionSchema, IdSchema, UpdateCriterionSchema } from '@compy/shared';
import type { CreateCriterionInput, UpdateCriterionInput } from '@compy/shared';
import { CriteriaService } from './criteria.service.js';

@Controller('comparisons')
export class CriteriaController {
  constructor(private readonly criteriaService: CriteriaService) { }

  @Get(':comparisonId/criteria')
  public findAll(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
  ) {
    return this.criteriaService.findAll(comparisonId);
  }

  @Get(':comparisonId/criteria/:criterionId')
  public findOne(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('criterionId', new ZodValidationPipe(IdSchema)) criterionId: number,
  ) {
    return this.criteriaService.findOne(comparisonId, criterionId);
  }

  @Post(':comparisonId/criteria')
  public create(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Body(new ZodValidationPipe(CreateCriterionSchema)) body: CreateCriterionInput,
  ) {
    return this.criteriaService.create(comparisonId, body);
  }

  @Patch(':comparisonId/criteria/:criterionId')
  public update(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('criterionId', new ZodValidationPipe(IdSchema)) criterionId: number,
    @Body(new ZodValidationPipe(UpdateCriterionSchema)) body: UpdateCriterionInput,
  ) {
    return this.criteriaService.update(comparisonId, criterionId, body);
  }

  @Delete(':comparisonId/criteria/:criterionId')
  public remove(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('criterionId', new ZodValidationPipe(IdSchema)) criterionId: number,
  ) {
    return this.criteriaService.remove(comparisonId, criterionId);
  }
}
