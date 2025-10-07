import { Module } from '@nestjs/common';
import { MigrationsController } from './migration.controller';
import { MigrationsService } from './migration.service';

@Module({
  controllers: [MigrationsController],
  providers: [MigrationsService],
})
export class MigrationsModule {}
