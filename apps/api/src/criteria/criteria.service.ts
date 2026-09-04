import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateCriterionInput, UpdateCriterionInput } from '@compy/shared';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CriteriaService {
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

  private async findCriterion(comparisonId: number, criterionId: number) {
    const criterion = await this.prisma.criterion.findFirst({
      where: {
        id: criterionId,
        comparisonId,
      },
    });

    if (criterion === null) {
      throw new NotFoundException();
    }

    return criterion;
  }

  public async create(comparisonId: number, data: CreateCriterionInput) {
    await this.ensureComparisonExists(comparisonId);

    const type = {
      number: 'Float',
      text: 'Text',
      boolean: 'Boolean',
      rating: 'Rating',
      enum: 'Enum',
    }[data.type] as 'Float' | 'Text' | 'Boolean' | 'Rating' | 'Enum';

    return this.prisma.criterion.create({
      data: {
        comparisonId,
        name: data.name,
        type,
        config: data.config,
        is_comparable: data.is_comparable,
        is_key: false,
      },
    });
  }

  public async findAll(comparisonId: number) {
    await this.ensureComparisonExists(comparisonId);

    return this.prisma.criterion.findMany({
      where: { comparisonId },
      orderBy: { createdAt: 'asc' },
    });
  }

  public async findOne(comparisonId: number, criterionId: number) {
    return this.findCriterion(comparisonId, criterionId);
  }

  public async update(comparisonId: number, criterionId: number, data: UpdateCriterionInput) {
    return this.prisma.criterion.update({
      where: {
        id: criterionId,
        comparisonId,
      },
      data: {
        name: data.name,
      },
    });
  }

  public async remove(comparisonId: number, criterionId: number) {
    const criterion = await this.findCriterion(comparisonId, criterionId);

    if (criterion.is_key) {
      throw new BadRequestException('The built-in name criterion cannot be removed.');
    }

    return this.prisma.criterion.delete({
      where: { id: criterionId },
    });
  }
}
