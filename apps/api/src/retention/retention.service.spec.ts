import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { RetentionService } from './retention.service.js';

describe('RetentionService', () => {
  const comparisonDeleteMany = vi.fn().mockResolvedValue({ count: 3 });

  const prisma = {
    comparison: {
      deleteMany: comparisonDeleteMany,
    },
  } as unknown as PrismaService;

  let service: RetentionService;

  beforeEach(async () => {
    vi.clearAllMocks();
    comparisonDeleteMany.mockResolvedValue({ count: 3 });
    delete process.env.GUEST_COMPARISON_TTL_DAYS;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RetentionService],
    })
      .useMocker((token) => (token === PrismaService ? prisma : undefined))
      .compile();

    service = module.get(RetentionService);
  });

  it('deletes guest-owned comparisons older than the default 14-day TTL', async () => {
    const now = new Date('2026-09-18T12:00:00.000Z');
    const count = await service.purgeInactiveGuestComparisons(now);

    expect(count).toBe(3);
    expect(comparisonDeleteMany).toHaveBeenCalledWith({
      where: {
        lastActiveAt: {
          lt: new Date('2026-09-04T12:00:00.000Z'),
        },
        owner: { kind: 'guest' },
      },
    });
  });

  it('honors GUEST_COMPARISON_TTL_DAYS when set to a positive integer', async () => {
    process.env.GUEST_COMPARISON_TTL_DAYS = '7';
    const now = new Date('2026-09-18T12:00:00.000Z');

    await service.purgeInactiveGuestComparisons(now);

    expect(comparisonDeleteMany).toHaveBeenCalledWith({
      where: {
        lastActiveAt: {
          lt: new Date('2026-09-11T12:00:00.000Z'),
        },
        owner: { kind: 'guest' },
      },
    });
  });
});
