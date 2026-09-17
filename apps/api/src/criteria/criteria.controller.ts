import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import {
  CreateCriterionSchema,
  IdSchema,
  PublicIdSchema,
  ReplaceCriterionWeightsSchema,
  UpdateCriterionSchema,
} from '@compy/shared';
import type {
  CreateCriterionInput,
  ReplaceCriterionWeightsInput,
  UpdateCriterionInput,
} from '@compy/shared';
import { CurrentPrincipal } from '../auth/current-principal.decorator.js';
import type { Principal } from '../auth/session.constants.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { CriteriaService } from './criteria.service.js';

@Controller('comparisons')
@ApiTags('criteria')
@UseGuards(SessionAuthGuard)
export class CriteriaController {
  constructor(private readonly criteriaService: CriteriaService) {}

  @Get(':publicId/criteria')
  @ApiOperation({ summary: 'List criteria for a comparison' })
  @ApiResponse({ status: 200, description: 'Criteria ordered by creation time.' })
  public findAll(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.criteriaService.findAll(publicId, principal.id);
  }

  @Get(':publicId/criteria/:criterionId')
  @ApiOperation({ summary: 'Get one criterion' })
  @ApiResponse({ status: 200, description: 'The requested criterion.' })
  @ApiResponse({ status: 404, description: 'Criterion not found.' })
  public findOne(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Param('criterionId', new ZodValidationPipe(IdSchema)) criterionId: number,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.criteriaService.findOne(publicId, principal.id, criterionId);
  }

  @Post(':publicId/criteria')
  @ApiOperation({ summary: 'Create a criterion' })
  @ApiResponse({ status: 201, description: 'The created criterion.' })
  public create(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Body(new ZodValidationPipe(CreateCriterionSchema)) body: CreateCriterionInput,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.criteriaService.create(publicId, principal.id, body);
  }

  @Patch(':publicId/criteria/weights')
  @ApiOperation({ summary: 'Replace all comparable criterion weights' })
  @ApiResponse({ status: 200, description: 'Criteria with the new weights.' })
  @ApiResponse({
    status: 400,
    description:
      'Weights do not cover exactly the comparable criteria or do not sum to 100.',
  })
  @ApiResponse({ status: 404, description: 'Comparison not found.' })
  public replaceWeights(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Body(new ZodValidationPipe(ReplaceCriterionWeightsSchema))
    body: ReplaceCriterionWeightsInput,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.criteriaService.replaceWeights(publicId, principal.id, body);
  }

  @Patch(':publicId/criteria/:criterionId')
  @ApiOperation({ summary: 'Update a criterion name, weight, or rule config' })
  @ApiResponse({ status: 200, description: 'The updated criterion.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid weight, rule config, or empty update body.',
  })
  @ApiResponse({ status: 404, description: 'Criterion not found.' })
  public update(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Param('criterionId', new ZodValidationPipe(IdSchema)) criterionId: number,
    @Body(new ZodValidationPipe(UpdateCriterionSchema)) body: UpdateCriterionInput,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.criteriaService.update(
      publicId,
      principal.id,
      criterionId,
      body,
    );
  }

  @Delete(':publicId/criteria/:criterionId')
  @ApiOperation({ summary: 'Delete a custom criterion and its values' })
  @ApiResponse({ status: 200, description: 'The deleted criterion.' })
  @ApiResponse({
    status: 400,
    description: 'The built-in name criterion cannot be deleted.',
  })
  public remove(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Param('criterionId', new ZodValidationPipe(IdSchema)) criterionId: number,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.criteriaService.remove(publicId, principal.id, criterionId);
  }
}
