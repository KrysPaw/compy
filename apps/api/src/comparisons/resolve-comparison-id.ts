import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

function accessibleByUser(userId: number) {
  return {
    OR: [{ ownerId: userId }, { grants: { some: { userId } } }],
  };
}

/**
 * Resolves a comparison the principal may access (owner or granted editor).
 */
export async function resolveComparisonId(
  prisma: PrismaService,
  publicId: string,
  userId: number,
): Promise<number> {
  const comparison = await prisma.comparison.findFirst({
    where: {
      publicId,
      ...accessibleByUser(userId),
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

/**
 * Resolves a comparison only when the principal is the owner.
 */
export async function resolveOwnedComparisonId(
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

export { accessibleByUser };
