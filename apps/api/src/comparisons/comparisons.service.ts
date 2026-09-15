import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateComparisonInput,
  UpdateComparisonInput,
} from '@compy/shared';
import { ulid } from 'ulid';
import { PrismaService } from '../prisma/prisma.service.js';
import { resolveComparisonId } from './resolve-comparison-id.js';

@Injectable()
export class ComparisonsService {
  constructor(private readonly prisma: PrismaService) {}

  public async getByPublicId(publicId: string) {
    const comparison = await this.prisma.comparison.findUnique({
      where: {
        publicId,
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

  public async update(publicId: string, data: UpdateComparisonInput) {
    const id = await resolveComparisonId(this.prisma, publicId);

    return this.prisma.comparison.update({
      where: { id },
      data: { name: data.name },
    });
  }

  public async remove(publicId: string) {
    const id = await resolveComparisonId(this.prisma, publicId);

    return this.prisma.comparison.delete({ where: { id } });
  }

  public createComparison(data: CreateComparisonInput) {
    return this.prisma.$transaction(async (transaction) => {
      const comparison = await transaction.comparison.create({
        data: {
          name: data.name,
          publicId: ulid(),
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
