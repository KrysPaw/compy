import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const DEFAULT_GUEST_COMPARISON_TTL_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(private readonly prisma: PrismaService) {}

  public async purgeInactiveGuestComparisons(
    now: Date = new Date(),
  ): Promise<number> {
    const cutoff = new Date(now.getTime() - this.ttlMs());

    const result = await this.prisma.comparison.deleteMany({
      where: {
        lastActiveAt: { lt: cutoff },
        owner: { kind: 'guest' },
      },
    });

    this.logger.log(
      `Purged ${result.count} inactive guest-owned comparison(s) (cutoff ${cutoff.toISOString()})`,
    );

    return result.count;
  }

  private ttlMs(): number {
    const raw = process.env.GUEST_COMPARISON_TTL_DAYS;
    if (raw !== undefined && raw.length > 0) {
      const parsed = Number.parseInt(raw, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed * MS_PER_DAY;
      }
    }

    return DEFAULT_GUEST_COMPARISON_TTL_DAYS * MS_PER_DAY;
  }
}
