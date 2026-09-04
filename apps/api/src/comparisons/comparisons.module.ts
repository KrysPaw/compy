import { Module } from '@nestjs/common';
import { ComparisonsController } from './comparisons.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ComparisonsService } from './comparisons.service.js';
import { CriteriaService } from '../criteria/criteria.service.js';
import { CriteriaController } from '../criteria/criteria.controller.js';

@Module({
  controllers: [ComparisonsController, CriteriaController],
  providers: [ComparisonsService, CriteriaService, PrismaService]
})
export class ComparisonsModule { }
