import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { ComparisonsModule } from './comparisons/comparisons.module.js';
import { RetentionModule } from './retention/retention.module.js';

@Module({
  controllers: [AppController],
  providers: [AppService, PrismaService],
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    ComparisonsModule,
    RetentionModule,
  ],
})
export class AppModule {}

