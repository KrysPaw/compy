import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export async function resolveComparisonId(
  prisma: PrismaService,
  publicId: string,
): Promise<number> {
  const comparison = await prisma.comparison.findUnique({
    where: { publicId },
    select: { id: true },
  });

  if (comparison === null) {
    throw new NotFoundException();
  }

  return comparison.id;
}
