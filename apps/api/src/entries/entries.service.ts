import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateEntryInput, UpdateEntryInput, ValueInput } from '@compy/shared';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class EntriesService {
  constructor(private readonly prisma: PrismaService) { }

  private async ensureComparisonExists(comparisonId: number) {
    const comparison = await this.prisma.comparison.findUnique({
      where: { id: comparisonId },
      select: { id: true },
    });

    if (comparison === null) {
      throw new NotFoundException();
    }
  }

  private async ensureEntryBelongsToComparison(comparisonId: number, entryId: number) {
    const entry = await this.prisma.entry.findFirst({
      where: {
        id: entryId,
        comparisonId,
      },
      select: { id: true },
    });

    if (entry === null) {
      throw new NotFoundException();
    }

    return entry;
  }

  private async getComparisonCriteria(comparisonId: number) {
    return this.prisma.criterion.findMany({
      where: { comparisonId },
    });
  }

  private validateValueAgainstCriterion(valueInput: ValueInput, criterion: { id: number; type: string; config: unknown; is_key: boolean }) {
    if (valueInput.criterionId !== Number(criterion.id)) {
      throw new BadRequestException(`Value does not match criterion ${criterion.id}`);
    }

    const { type, value } = valueInput;

    if (criterion.is_key && type !== 'text') {
      throw new BadRequestException('The built-in name criterion must store text values.');
    }

    if (criterion.is_key && typeof value === 'string' && value.trim().length === 0) {
      throw new BadRequestException('The built-in name criterion value cannot be empty.');
    }

    switch (type) {
      case 'number':
        if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
          throw new BadRequestException(`Criterion ${criterion.id} expects a finite number.`);
        }
        break;
      case 'text':
        if (typeof value !== 'string') {
          throw new BadRequestException(`Criterion ${criterion.id} expects a string.`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new BadRequestException(`Criterion ${criterion.id} expects a boolean.`);
        }
        break;
      case 'rating':
        if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
          throw new BadRequestException(`Criterion ${criterion.id} expects a finite number rating.`);
        }
        if (criterion.config && typeof criterion.config === 'object') {
          const config = criterion.config as { min?: number; max?: number };
          if (typeof config.min === 'number' && value < config.min) {
            throw new BadRequestException(`Rating for criterion ${criterion.id} is below the configured minimum.`);
          }
          if (typeof config.max === 'number' && value > config.max) {
            throw new BadRequestException(`Rating for criterion ${criterion.id} is above the configured maximum.`);
          }
        }
        break;
      case 'enum':
        if (typeof value !== 'string') {
          throw new BadRequestException(`Criterion ${criterion.id} expects a string enum value.`);
        }
        if (criterion.config && typeof criterion.config === 'object') {
          const config = criterion.config as { options?: string[] };
          if (Array.isArray(config.options) && !config.options.includes(value)) {
            throw new BadRequestException(`Value "${value}" is not a valid option for criterion ${criterion.id}.`);
          }
        }
        break;
      default:
        throw new BadRequestException(`Unsupported criterion type: ${type}`);
    }
  }

  private validateValuesForComparison(comparisonId: number, values: ValueInput[]) {
    const criteria = this.getComparisonCriteria(comparisonId);

    return Promise.resolve(criteria).then((allCriteria) => {
      const criteriaMap = new Map(allCriteria.map((criterion) => [criterion.id, criterion]));

      for (const valueInput of values) {
        const criterion = criteriaMap.get(valueInput.criterionId);

        if (!criterion) {
          throw new NotFoundException(`Criterion ${valueInput.criterionId} does not belong to comparison ${comparisonId}`);
        }

        this.validateValueAgainstCriterion(valueInput, criterion as { id: number; type: string; config: unknown; is_key: boolean });
      }
    });
  }

  public async create(comparisonId: number, data: CreateEntryInput) {
    await this.ensureComparisonExists(comparisonId);
    await this.validateValuesForComparison(comparisonId, data.values);

    return this.prisma.$transaction(async (transaction) => {
      const entry = await transaction.entry.create({
        data: {
          comparisonId,
        },
      });

      for (const value of data.values) {
        await transaction.entryValue.upsert({
          where: {
            entryId_criterionId: {
              entryId: entry.id,
              criterionId: value.criterionId,
            },
          },
          update: { value: value.value },
          create: {
            entryId: entry.id,
            criterionId: value.criterionId,
            value: value.value,
          },
        });
      }

      return transaction.entry.findUnique({
        where: { id: entry.id },
        include: { entryValues: true },
      });
    });
  }

  public async findAll(comparisonId: number) {
    await this.ensureComparisonExists(comparisonId);

    return this.prisma.entry.findMany({
      where: { comparisonId },
      include: { entryValues: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  public async findOne(comparisonId: number, entryId: number) {
    await this.ensureComparisonExists(comparisonId);
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
      include: { entryValues: true },
    });

    if (entry === null || entry.comparisonId !== comparisonId) {
      throw new NotFoundException();
    }

    return entry;
  }

  public async update(comparisonId: number, entryId: number, data: UpdateEntryInput) {
    await this.ensureComparisonExists(comparisonId);
    await this.ensureEntryBelongsToComparison(comparisonId, entryId);
    await this.validateValuesForComparison(comparisonId, data.values);

    return this.prisma.$transaction(async (transaction) => {
      for (const value of data.values) {
        await transaction.entryValue.upsert({
          where: {
            entryId_criterionId: {
              entryId,
              criterionId: value.criterionId,
            },
          },
          update: { value: value.value },
          create: {
            entryId,
            criterionId: value.criterionId,
            value: value.value,
          },
        });
      }

      return transaction.entry.findUnique({
        where: { id: entryId },
        include: { entryValues: true },
      });
    });
  }

  public async remove(comparisonId: number, entryId: number) {
    await this.ensureComparisonExists(comparisonId);
    await this.ensureEntryBelongsToComparison(comparisonId, entryId);

    return this.prisma.entry.delete({
      where: { id: entryId },
    });
  }
}
