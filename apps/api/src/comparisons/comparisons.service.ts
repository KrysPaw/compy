import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateComparisonInput,
  UpdateComparisonInput,
} from '@compy/shared';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ComparisonsService {
  constructor(private readonly prisma: PrismaService) {}

  public async getById(id: number) {
    const comparison = await this.prisma.comparison.findUnique({
      where: {
        id,
      },
      include: {
        criteria: {
          orderBy: { createdAt: 'asc' },
        },
        entries: {
          include: {
            entryValues: true,
          },
        },
      },
    });

    if (comparison === null) {
      throw new NotFoundException();
    }

    return comparison;
  }

  public getAll() {
    return this.prisma.comparison.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  public async update(id: number, data: UpdateComparisonInput) {
    const comparison = await this.prisma.comparison.findUnique({
      where: { id },
      select: { id: true },
    });

    if (comparison === null) {
      throw new NotFoundException();
    }

    return this.prisma.comparison.update({
      where: { id },
      data: { name: data.name },
    });
  }

  public async remove(id: number) {
    const comparison = await this.prisma.comparison.findUnique({
      where: { id },
      select: { id: true },
    });

    if (comparison === null) {
      throw new NotFoundException();
    }

    return this.prisma.comparison.delete({ where: { id } });
  }

  public createComparison(data: CreateComparisonInput) {
    return this.prisma.$transaction(async (transaction) => {
      const comparison = await transaction.comparison.create({
        data: {
          name: data.name,
        },
      });

      await transaction.criterion.create({
        data: {
          comparisonId: comparison.id,
          name: 'name',
          type: 'text',
          is_comparable: false,
          is_key: true,
        },
      });

      return transaction.comparison.findUnique({
        where: {
          id: comparison.id,
        },
        include: {
          criteria: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    });
  }
}
