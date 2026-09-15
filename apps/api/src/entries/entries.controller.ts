import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import {
  CreateEntrySchema,
  EntryValueUpsertSchema,
  IdSchema,
  PublicIdSchema,
  UpdateEntrySchema,
} from '@compy/shared';
import type { CreateEntryInput, EntryValueUpsertInput, UpdateEntryInput } from '@compy/shared';
import { EntriesService } from './entries.service.js';

@Controller('comparisons')
@ApiTags('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) { }

  @Get(':publicId/entries')
  @ApiOperation({ summary: 'List entries in a comparison' })
  @ApiResponse({ status: 200, description: 'Entries with their values.' })
  public findAll(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
  ) {
    return this.entriesService.findAll(publicId);
  }

  @Get(':publicId/entries/:entryId')
  @ApiOperation({ summary: 'Get one entry' })
  @ApiResponse({ status: 200, description: 'The requested entry with its values.' })
  @ApiResponse({ status: 404, description: 'Entry not found.' })
  public findOne(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
  ) {
    return this.entriesService.findOne(publicId, entryId);
  }

  @Post(':publicId/entries')
  @ApiOperation({ summary: 'Create an entry with values' })
  @ApiBody({ schema: { type: 'object', required: ['values'], properties: { values: { type: 'array', maxItems: 100, items: { type: 'object', required: ['criterionId', 'type', 'value'], properties: { criterionId: { type: 'integer', example: 2 }, type: { type: 'string', enum: ['number', 'text', 'boolean', 'rating', 'enum'] }, value: { oneOf: [{ type: 'number', example: 1299 }, { type: 'string', example: 'Pixel 8' }, { type: 'boolean', example: true }] } } } } } } })
  @ApiResponse({ status: 201, description: 'The created entry.' })
  public create(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Body(new ZodValidationPipe(CreateEntrySchema)) body: CreateEntryInput,
  ) {
    return this.entriesService.create(publicId, body);
  }

  @Patch(':publicId/entries/:entryId')
  @ApiOperation({ summary: 'Update selected entry values' })
  @ApiResponse({ status: 200, description: 'The updated entry.' })
  @ApiResponse({ status: 404, description: 'Entry or criterion not found.' })
  public update(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
    @Body(new ZodValidationPipe(UpdateEntrySchema)) body: UpdateEntryInput,
  ) {
    return this.entriesService.update(publicId, entryId, body);
  }

  @Delete(':publicId/entries/:entryId')
  @ApiOperation({ summary: 'Delete an entry and its values' })
  @ApiResponse({ status: 200, description: 'The deleted entry.' })
  public remove(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
  ) {
    return this.entriesService.remove(publicId, entryId);
  }

  @Get(':publicId/entries/:entryId/values')
  @ApiOperation({ summary: 'List values for an entry' })
  @ApiResponse({ status: 200, description: 'Entry values with their criteria.' })
  public findAllValues(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
  ) {
    return this.entriesService.findAllValues(publicId, entryId);
  }

  @Post(':publicId/entries/:entryId/values/:criterionId')
  @ApiOperation({ summary: 'Create or replace one entry value' })
  @ApiBody({ schema: { type: 'object', required: ['type', 'value'], properties: { type: { type: 'string', enum: ['number', 'text', 'boolean', 'rating', 'enum'] }, value: { oneOf: [{ type: 'number', example: 1299 }, { type: 'string', example: 'Pixel 8' }, { type: 'boolean', example: true }] } } } })
  @ApiResponse({ status: 201, description: 'The upserted entry value.' })
  public upsertValue(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
    @Param('criterionId', new ZodValidationPipe(IdSchema)) criterionId: number,
    @Body(new ZodValidationPipe(EntryValueUpsertSchema)) body: EntryValueUpsertInput,
  ) {
    return this.entriesService.upsertValue(publicId, entryId, criterionId, body);
  }

  @Delete(':publicId/entries/:entryId/values/:criterionId')
  @ApiOperation({ summary: 'Delete one entry value' })
  @ApiResponse({ status: 200, description: 'The deleted entry value.' })
  public removeValue(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
    @Param('criterionId', new ZodValidationPipe(IdSchema)) criterionId: number,
  ) {
    return this.entriesService.removeValue(publicId, entryId, criterionId);
  }
}
