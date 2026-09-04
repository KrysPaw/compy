import { Module } from '@nestjs/common';
import { ComparisonsController } from './comparisons.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ComparisonsService } from './comparisons.service.js';

@Module({
  controllers: [ComparisonsController],
  providers: [ComparisonsService, PrismaService]
})
export class ComparisonsModule { }
