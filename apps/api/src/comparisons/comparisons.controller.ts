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
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { CreateComparisonSchema, PublicIdSchema, UpdateComparisonSchema } from '@compy/shared';
import type { CreateComparisonInput, UpdateComparisonInput } from '@compy/shared';
import { CurrentPrincipal } from '../auth/current-principal.decorator.js';
import type { Principal } from '../auth/session.constants.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { ComparisonsService } from './comparisons.service.js';

@Controller('comparisons')
@ApiTags('comparisons')
@UseGuards(SessionAuthGuard)
export class ComparisonsController {
  constructor(private readonly comparisonsService: ComparisonsService) {}

  @Get()
  @ApiOperation({ summary: 'List comparisons accessible to the caller' })
  @ApiResponse({
    status: 200,
    description: 'Owned comparisons ordered by most recently updated.',
  })
  public getComparisons(@CurrentPrincipal() principal: Principal) {
    return this.comparisonsService.getAll(principal.id);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Get a comparison with criteria and entries' })
  @ApiResponse({ status: 200, description: 'The requested comparison.' })
  @ApiResponse({ status: 404, description: 'Comparison not found.' })
  public getComparisonByPublicId(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.comparisonsService.getByPublicId(publicId, principal.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a comparison' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 200,
          example: 'Lisbon hotels',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The comparison and its built-in name criterion.',
  })
  public createComparison(
    @Body(new ZodValidationPipe(CreateComparisonSchema))
    body: CreateComparisonInput,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.comparisonsService.createComparison(body, principal.id);
  }

  @Patch(':publicId')
  @ApiOperation({ summary: 'Rename a comparison' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 200,
          example: 'Phones 2026',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'The renamed comparison.' })
  @ApiResponse({ status: 404, description: 'Comparison not found.' })
  public updateComparison(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Body(new ZodValidationPipe(UpdateComparisonSchema))
    body: UpdateComparisonInput,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.comparisonsService.update(publicId, principal.id, body);
  }

  @Delete(':publicId')
  @ApiOperation({ summary: 'Delete a comparison and its related data' })
  @ApiResponse({ status: 200, description: 'The deleted comparison.' })
  @ApiResponse({ status: 404, description: 'Comparison not found.' })
  public deleteComparison(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.comparisonsService.remove(publicId, principal.id);
  }
}
