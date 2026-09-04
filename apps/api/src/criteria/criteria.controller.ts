import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { CreateCriterionSchema, IdSchema, UpdateCriterionSchema } from '@compy/shared';
import type { CreateCriterionInput, UpdateCriterionInput } from '@compy/shared';
import { CriteriaService } from './criteria.service.js';

@Controller('comparisons')
@ApiTags('criteria')
export class CriteriaController {
  constructor(private readonly criteriaService: CriteriaService) { }

  @Get(':comparisonId/criteria')
  @ApiOperation({ summary: 'List criteria for a comparison' })
  @ApiResponse({ status: 200, description: 'Criteria ordered by creation time.' })
  public findAll(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
  ) {
    return this.criteriaService.findAll(comparisonId);
  }

  @Get(':comparisonId/criteria/:criterionId')
  @ApiOperation({ summary: 'Get one criterion' })
  @ApiResponse({ status: 200, description: 'The requested criterion.' })
  @ApiResponse({ status: 404, description: 'Criterion not found.' })
  public findOne(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('criterionId', new ZodValidationPipe(IdSchema)) criterionId: number,
  ) {
    return this.criteriaService.findOne(comparisonId, criterionId);
  }

  @Post(':comparisonId/criteria')
  @ApiOperation({ summary: 'Create a criterion' })
  @ApiResponse({ status: 201, description: 'The created criterion.' })
  public create(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Body(new ZodValidationPipe(CreateCriterionSchema)) body: CreateCriterionInput,
  ) {
    return this.criteriaService.create(comparisonId, body);
  }

  @Patch(':comparisonId/criteria/:criterionId')
  @ApiOperation({ summary: 'Rename a criterion' })
  @ApiResponse({ status: 200, description: 'The renamed criterion.' })
  @ApiResponse({ status: 404, description: 'Criterion not found.' })
  public update(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('criterionId', new ZodValidationPipe(IdSchema)) criterionId: number,
    @Body(new ZodValidationPipe(UpdateCriterionSchema)) body: UpdateCriterionInput,
  ) {
    return this.criteriaService.update(comparisonId, criterionId, body);
  }

  @Delete(':comparisonId/criteria/:criterionId')
  @ApiOperation({ summary: 'Delete a custom criterion and its values' })
  @ApiResponse({ status: 200, description: 'The deleted criterion.' })
  @ApiResponse({ status: 400, description: 'The built-in name criterion cannot be deleted.' })
  public remove(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('criterionId', new ZodValidationPipe(IdSchema)) criterionId: number,
  ) {
    return this.criteriaService.remove(comparisonId, criterionId);
  }
}
