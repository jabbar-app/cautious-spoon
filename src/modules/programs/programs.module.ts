import { Module } from '@nestjs/common';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { PrismaService } from '../../core/database/prisma.service';

@Module({
  controllers: [ProgramsController],
  providers: [ProgramsService, PrismaService],
  exports: [ProgramsService],
})
export class ProgramsModule {}
