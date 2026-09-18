import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RetentionScheduler } from './retention.scheduler.js';
import { RetentionService } from './retention.service.js';

@Module({
  providers: [RetentionService, RetentionScheduler, PrismaService],
  exports: [RetentionService],
})
export class RetentionModule {}
