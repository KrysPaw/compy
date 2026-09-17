import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { SessionAuthGuard } from './session-auth.guard.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionAuthGuard, PrismaService],
  exports: [AuthService, SessionAuthGuard],
})
export class AuthModule {}
