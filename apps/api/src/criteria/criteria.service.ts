import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateCriterionInput } from '@compy/shared';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CriteriaService {
  constructor(private readonly prisma: PrismaService) { }

  public async create(comparisonId: number, data: CreateCriterionInput) {
    const comparison = await this.prisma.comparison.findUnique({
      where: { id: comparisonId },
      select: { id: true },
    });

    if (comparison === null) {
      throw new NotFoundException();
    }

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
}
