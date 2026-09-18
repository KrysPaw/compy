import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateAccessRequestInput,
  InviteByEmailInput,
} from '@compy/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { resolveOwnedComparisonId } from './resolve-comparison-id.js';

@Injectable()
export class SharingService {
  constructor(private readonly prisma: PrismaService) {}

  public async getAccessStatus(publicId: string, userId: number) {
    const comparison = await this.prisma.comparison.findFirst({
      where: { publicId },
      select: {
        id: true,
        ownerId: true,
        grants: {
          where: { userId },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (comparison === null) {
      throw new NotFoundException();
    }

    if (comparison.ownerId === userId) {
      await this.touchLastActive(comparison.id);
      return { status: 'accessible' as const, role: 'owner' as const };
    }

    if (comparison.grants.length > 0) {
      await this.touchLastActive(comparison.id);
      return { status: 'accessible' as const, role: 'editor' as const };
    }

    return { status: 'locked' as const };
  }

  public async inviteByEmail(
    publicId: string,
    ownerId: number,
    input: InviteByEmailInput,
  ) {
    const comparisonId = await resolveOwnedComparisonId(
      this.prisma,
      publicId,
      ownerId,
    );
    const email = input.email.trim().toLowerCase();

    const invitee = await this.prisma.user.findFirst({
      where: {
        kind: 'registered',
        email,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });

    if (invitee === null) {
      throw new BadRequestException(
        'No registered user with that email. Ask them to sign up first.',
      );
    }

    if (invitee.id === ownerId) {
      throw new BadRequestException('You already own this comparison.');
    }

    const existingGrant = await this.prisma.comparisonGrant.findUnique({
      where: {
        comparisonId_userId: {
          comparisonId,
          userId: invitee.id,
        },
      },
    });

    if (existingGrant !== null) {
      return {
        id: existingGrant.id,
        userId: invitee.id,
        email: invitee.email,
        displayName: invitee.displayName,
        role: existingGrant.role,
        createdAt: existingGrant.createdAt,
      };
    }

    const grant = await this.prisma.$transaction(async (tx) => {
      const created = await tx.comparisonGrant.create({
        data: {
          comparisonId,
          userId: invitee.id,
          role: 'editor',
        },
      });

      await tx.accessRequest.updateMany({
        where: {
          comparisonId,
          requesterId: invitee.id,
          status: 'pending',
        },
        data: { status: 'accepted' },
      });

      return created;
    });

    return {
      id: grant.id,
      userId: invitee.id,
      email: invitee.email,
      displayName: invitee.displayName,
      role: grant.role,
      createdAt: grant.createdAt,
    };
  }

  public async listAccessRequests(publicId: string, ownerId: number) {
    const comparisonId = await resolveOwnedComparisonId(
      this.prisma,
      publicId,
      ownerId,
    );

    return this.prisma.accessRequest.findMany({
      where: {
        comparisonId,
        status: 'pending',
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        requesterId: true,
        displayName: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  public async createAccessRequest(
    publicId: string,
    requesterId: number,
    input: CreateAccessRequestInput,
  ) {
    const comparison = await this.prisma.comparison.findFirst({
      where: { publicId },
      select: {
        id: true,
        ownerId: true,
        grants: {
          where: { userId: requesterId },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (comparison === null) {
      throw new NotFoundException();
    }

    if (comparison.ownerId === requesterId || comparison.grants.length > 0) {
      throw new BadRequestException('You already have access to this comparison.');
    }

    const pending = await this.prisma.accessRequest.findFirst({
      where: {
        comparisonId: comparison.id,
        requesterId,
        status: 'pending',
      },
    });

    if (pending !== null) {
      throw new BadRequestException(
        'You already have a pending access request for this comparison.',
      );
    }

    return this.prisma.accessRequest.create({
      data: {
        comparisonId: comparison.id,
        requesterId,
        displayName: input.displayName,
        message: input.message ?? null,
        status: 'pending',
      },
      select: {
        id: true,
        requesterId: true,
        displayName: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  public async acceptAccessRequest(
    publicId: string,
    ownerId: number,
    requestId: number,
  ) {
    const comparisonId = await resolveOwnedComparisonId(
      this.prisma,
      publicId,
      ownerId,
    );

    const request = await this.prisma.accessRequest.findFirst({
      where: {
        id: requestId,
        comparisonId,
        status: 'pending',
      },
    });

    if (request === null) {
      throw new NotFoundException();
    }

    if (request.requesterId === ownerId) {
      throw new BadRequestException('Cannot grant access to the owner.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.comparisonGrant.upsert({
        where: {
          comparisonId_userId: {
            comparisonId,
            userId: request.requesterId,
          },
        },
        create: {
          comparisonId,
          userId: request.requesterId,
          role: 'editor',
        },
        update: {
          role: 'editor',
        },
      });

      return tx.accessRequest.update({
        where: { id: request.id },
        data: { status: 'accepted' },
        select: {
          id: true,
          requesterId: true,
          displayName: true,
          message: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }

  public async rejectAccessRequest(
    publicId: string,
    ownerId: number,
    requestId: number,
  ) {
    const comparisonId = await resolveOwnedComparisonId(
      this.prisma,
      publicId,
      ownerId,
    );

    const request = await this.prisma.accessRequest.findFirst({
      where: {
        id: requestId,
        comparisonId,
        status: 'pending',
      },
    });

    if (request === null) {
      throw new NotFoundException();
    }

    return this.prisma.accessRequest.update({
      where: { id: request.id },
      data: { status: 'rejected' },
      select: {
        id: true,
        requesterId: true,
        displayName: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private async touchLastActive(comparisonId: number) {
    await this.prisma.comparison.update({
      where: { id: comparisonId },
      data: { lastActiveAt: new Date() },
    });
  }
}
