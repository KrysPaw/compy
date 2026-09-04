import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { CreateComparisonSchema, IdSchema, UpdateComparisonSchema } from '@compy/shared';
import type { CreateComparisonInput, UpdateComparisonInput } from '@compy/shared';
import { ComparisonsService } from './comparisons.service.js';

@Controller('comparisons')
@ApiTags('comparisons')
export class ComparisonsController {

  constructor(private readonly comparisonsService: ComparisonsService) { }

  @Get()
  @ApiOperation({ summary: 'List comparisons' })
  @ApiResponse({ status: 200, description: 'Comparisons ordered by most recently updated.' })
  public getComparisons() {
    return this.comparisonsService.getAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a comparison with criteria and entries' })
  @ApiResponse({ status: 200, description: 'The requested comparison.' })
  @ApiResponse({ status: 404, description: 'Comparison not found.' })
  public getComparisonById(
    @Param('id', new ZodValidationPipe(IdSchema)) id: number
  ) {
    return this.comparisonsService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a comparison' })
  @ApiBody({ schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', minLength: 1, maxLength: 200, example: 'Lisbon hotels' } } } })
  @ApiResponse({ status: 201, description: 'The comparison and its built-in name criterion.' })
  public createComparison(
    @Body(new ZodValidationPipe(CreateComparisonSchema)) body: CreateComparisonInput
  ) {
    return this.comparisonsService.createComparison(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a comparison' })
  @ApiBody({ schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', minLength: 1, maxLength: 200, example: 'Phones 2026' } } } })
  @ApiResponse({ status: 200, description: 'The renamed comparison.' })
  @ApiResponse({ status: 404, description: 'Comparison not found.' })
  public updateComparison(
    @Param('id', new ZodValidationPipe(IdSchema)) id: number,
    @Body(new ZodValidationPipe(UpdateComparisonSchema)) body: UpdateComparisonInput,
  ) {
    return this.comparisonsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comparison and its related data' })
  @ApiResponse({ status: 200, description: 'The deleted comparison.' })
  @ApiResponse({ status: 404, description: 'Comparison not found.' })
  public deleteComparison(
    @Param('id', new ZodValidationPipe(IdSchema)) id: number,
  ) {
    return this.comparisonsService.remove(id);
  }

}
