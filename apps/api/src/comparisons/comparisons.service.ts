import { Injectable } from '@nestjs/common';
import type { CreateComparisonInput } from '@compy/shared';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ComparisonsService {
  constructor(private readonly prisma: PrismaService) { }

  public createComparison(data: CreateComparisonInput) {
    return this.prisma.$transaction(async (transaction) => {
      const comparison = await transaction.comparison.create({
        data: {
          name: data.name
        }
      })

      await transaction.criterion.create({
        data: {
          comparisonId: comparison.id,
          name: 'name',
          type: 'Text',
          is_comparable: false,
          is_key: true
        }
      })

      return transaction.comparison.findUnique({
        where: {
          id: comparison.id
        },
        include: {
          criteria: true
        }
      })
    });
  }
}
