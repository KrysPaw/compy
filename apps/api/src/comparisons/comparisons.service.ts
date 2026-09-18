import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateComparisonInput,
  UpdateComparisonInput,
} from '@compy/shared';
import { ulid } from 'ulid';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  accessibleByUser,
  resolveComparisonId,
  resolveOwnedComparisonId,
} from './resolve-comparison-id.js';

@Injectable()
export class ComparisonsService {
  constructor(private readonly prisma: PrismaService) {}

  public async getByPublicId(publicId: string, userId: number) {
    const comparison = await this.prisma.comparison.findFirst({
      where: {
        publicId,
        ...accessibleByUser(userId),
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

    await this.prisma.comparison.update({
      where: { id: comparison.id },
      data: { lastActiveAt: new Date() },
    });

    return comparison;
  }

  public getAll(userId: number) {
    return this.prisma.comparison.findMany({
      where: accessibleByUser(userId),
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  public async update(
    publicId: string,
    userId: number,
    data: UpdateComparisonInput,
  ) {
    const id = await resolveComparisonId(this.prisma, publicId, userId);

    return this.prisma.comparison.update({
      where: { id },
      data: { name: data.name },
    });
  }

  public async remove(publicId: string, userId: number) {
    const id = await resolveOwnedComparisonId(this.prisma, publicId, userId);

    return this.prisma.comparison.delete({ where: { id } });
  }

  public createComparison(data: CreateComparisonInput, userId: number) {
    return this.prisma.$transaction(async (transaction) => {
      const now = new Date();
      const comparison = await transaction.comparison.create({
        data: {
          name: data.name,
          publicId: ulid(),
          ownerId: userId,
          lastActiveAt: now,
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
