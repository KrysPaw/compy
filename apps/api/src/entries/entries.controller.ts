import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { CreateEntrySchema, EntryValueUpsertSchema, IdSchema, UpdateEntrySchema } from '@compy/shared';
import type { CreateEntryInput, EntryValueUpsertInput, UpdateEntryInput } from '@compy/shared';
import { EntriesService } from './entries.service.js';

@Controller('comparisons')
@ApiTags('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) { }

  @Get(':comparisonId/entries')
  @ApiOperation({ summary: 'List entries in a comparison' })
  @ApiResponse({ status: 200, description: 'Entries with their values.' })
  public findAll(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
  ) {
    return this.entriesService.findAll(comparisonId);
  }

  @Get(':comparisonId/entries/:entryId')
  @ApiOperation({ summary: 'Get one entry' })
  @ApiResponse({ status: 200, description: 'The requested entry with its values.' })
  @ApiResponse({ status: 404, description: 'Entry not found.' })
  public findOne(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
  ) {
    return this.entriesService.findOne(comparisonId, entryId);
  }

  @Post(':comparisonId/entries')
  @ApiOperation({ summary: 'Create an entry with values' })
  @ApiBody({ schema: { type: 'object', required: ['values'], properties: { values: { type: 'array', maxItems: 100, items: { oneOf: [{ type: 'object', required: ['criterionId', 'type', 'value'], properties: { criterionId: { type: 'integer', example: 2 }, type: { type: 'string', enum: ['number'] }, value: { type: 'number', example: 1299 } } }, { type: 'object', required: ['criterionId', 'type', 'value'], properties: { criterionId: { type: 'integer', example: 1 }, type: { type: 'string', enum: ['text'] }, value: { type: 'string', example: 'Pixel 8' } } }, { type: 'object', required: ['criterionId', 'type', 'value'], properties: { criterionId: { type: 'integer', example: 3 }, type: { type: 'string', enum: ['rating'] }, value: { type: 'number', example: 4 } } }] } } } } })
  @ApiResponse({ status: 201, description: 'The created entry.' })
  public create(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Body(new ZodValidationPipe(CreateEntrySchema)) body: CreateEntryInput,
  ) {
    return this.entriesService.create(comparisonId, body);
  }

  @Patch(':comparisonId/entries/:entryId')
  @ApiOperation({ summary: 'Update selected entry values' })
  @ApiResponse({ status: 200, description: 'The updated entry.' })
  @ApiResponse({ status: 404, description: 'Entry or criterion not found.' })
  public update(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
    @Body(new ZodValidationPipe(UpdateEntrySchema)) body: UpdateEntryInput,
  ) {
    return this.entriesService.update(comparisonId, entryId, body);
  }

  @Delete(':comparisonId/entries/:entryId')
  @ApiOperation({ summary: 'Delete an entry and its values' })
  @ApiResponse({ status: 200, description: 'The deleted entry.' })
  public remove(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
  ) {
    return this.entriesService.remove(comparisonId, entryId);
  }

  @Get(':comparisonId/entries/:entryId/values')
  @ApiOperation({ summary: 'List values for an entry' })
  @ApiResponse({ status: 200, description: 'Entry values with their criteria.' })
  public findAllValues(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
  ) {
    return this.entriesService.findAllValues(comparisonId, entryId);
  }

  @Post(':comparisonId/entries/:entryId/values/:criterionId')
  @ApiOperation({ summary: 'Create or replace one entry value' })
  @ApiBody({ schema: { oneOf: [{ type: 'object', required: ['type', 'value'], properties: { type: { type: 'string', enum: ['number'] }, value: { type: 'number', example: 1299 } } }, { type: 'object', required: ['type', 'value'], properties: { type: { type: 'string', enum: ['text'] }, value: { type: 'string', example: 'Pixel 8' } } }, { type: 'object', required: ['type', 'value'], properties: { type: { type: 'string', enum: ['boolean'] }, value: { type: 'boolean', example: true } } }, { type: 'object', required: ['type', 'value'], properties: { type: { type: 'string', enum: ['rating'] }, value: { type: 'number', example: 4 } } }, { type: 'object', required: ['type', 'value'], properties: { type: { type: 'string', enum: ['enum'] }, value: { type: 'string', example: 'B2B' } } }] } })
  @ApiResponse({ status: 201, description: 'The upserted entry value.' })
  public upsertValue(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
    @Param('criterionId', new ZodValidationPipe(IdSchema)) criterionId: number,
    @Body(new ZodValidationPipe(EntryValueUpsertSchema)) body: EntryValueUpsertInput,
  ) {
    return this.entriesService.upsertValue(comparisonId, entryId, criterionId, body);
  }

  @Delete(':comparisonId/entries/:entryId/values/:criterionId')
  @ApiOperation({ summary: 'Delete one entry value' })
  @ApiResponse({ status: 200, description: 'The deleted entry value.' })
  public removeValue(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
    @Param('criterionId', new ZodValidationPipe(IdSchema)) criterionId: number,
  ) {
    return this.entriesService.removeValue(comparisonId, entryId, criterionId);
  }
}
