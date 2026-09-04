import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';


@Module({
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
