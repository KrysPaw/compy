import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { CreateEntrySchema, EntryValueUpsertSchema, IdSchema, UpdateEntrySchema } from '@compy/shared';
import type { CreateEntryInput, EntryValueUpsertInput, UpdateEntryInput } from '@compy/shared';
import { EntriesService } from './entries.service.js';

@Controller('comparisons')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) { }

  @Get(':comparisonId/entries')
  public findAll(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
  ) {
    return this.entriesService.findAll(comparisonId);
  }

  @Get(':comparisonId/entries/:entryId')
  public findOne(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
  ) {
    return this.entriesService.findOne(comparisonId, entryId);
  }

  @Post(':comparisonId/entries')
  public create(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Body(new ZodValidationPipe(CreateEntrySchema)) body: CreateEntryInput,
  ) {
    return this.entriesService.create(comparisonId, body);
  }

  @Patch(':comparisonId/entries/:entryId')
  public update(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
    @Body(new ZodValidationPipe(UpdateEntrySchema)) body: UpdateEntryInput,
  ) {
    return this.entriesService.update(comparisonId, entryId, body);
  }

  @Delete(':comparisonId/entries/:entryId')
  public remove(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
  ) {
    return this.entriesService.remove(comparisonId, entryId);
  }

  @Get(':comparisonId/entries/:entryId/values')
  public findAllValues(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
  ) {
    return this.entriesService.findAllValues(comparisonId, entryId);
  }

  @Post(':comparisonId/entries/:entryId/values/:criterionId')
  public upsertValue(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
    @Param('criterionId', new ZodValidationPipe(IdSchema)) criterionId: number,
    @Body(new ZodValidationPipe(EntryValueUpsertSchema)) body: EntryValueUpsertInput,
  ) {
    return this.entriesService.upsertValue(comparisonId, entryId, criterionId, body);
  }

  @Delete(':comparisonId/entries/:entryId/values/:criterionId')
  public removeValue(
    @Param('comparisonId', new ZodValidationPipe(IdSchema)) comparisonId: number,
    @Param('entryId', new ZodValidationPipe(IdSchema)) entryId: number,
    @Param('criterionId', new ZodValidationPipe(IdSchema)) criterionId: number,
  ) {
    return this.entriesService.removeValue(comparisonId, entryId, criterionId);
  }
}
