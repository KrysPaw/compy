import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Resolves a comparison the principal may access.
 * Phase 1: owner only. Phase 3 will also accept ComparisonGrant.
 */
export async function resolveComparisonId(
  prisma: PrismaService,
  publicId: string,
  userId: number,
): Promise<number> {
  const comparison = await prisma.comparison.findFirst({
    where: {
      publicId,
      ownerId: userId,
    },
    select: { id: true },
  });

  if (comparison === null) {
    throw new NotFoundException();
  }

  await prisma.comparison.update({
    where: { id: comparison.id },
    data: { lastActiveAt: new Date() },
  });

  return comparison.id;
}
