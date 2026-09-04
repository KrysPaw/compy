import { Module } from '@nestjs/common';
import { ComparisonsController } from './comparisons.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ComparisonsService } from './comparisons.service.js';
import { CriteriaService } from '../criteria/criteria.service.js';
import { CriteriaController } from '../criteria/criteria.controller.js';
import { EntriesController } from '../entries/entries.controller.js';
import { EntriesService } from '../entries/entries.service.js';

@Module({
  controllers: [ComparisonsController, CriteriaController, EntriesController],
  providers: [ComparisonsService, CriteriaService, EntriesService, PrismaService],
})
export class ComparisonsModule { }
