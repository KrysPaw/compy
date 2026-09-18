import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RetentionService } from './retention.service.js';

@Injectable()
export class RetentionScheduler {
  private readonly logger = new Logger(RetentionScheduler.name);

  constructor(private readonly retentionService: RetentionService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  public async handleDailyPurge(): Promise<void> {
    try {
      const deleted =
        await this.retentionService.purgeInactiveGuestComparisons();
      this.logger.log(`Daily guest comparison retention finished (${deleted} deleted)`);
    } catch (error) {
      this.logger.error('Daily guest comparison retention failed', error);
    }
  }
}
