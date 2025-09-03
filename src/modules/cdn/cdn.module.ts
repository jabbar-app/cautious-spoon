import { Module } from '@nestjs/common';
import { CdnController } from './cdn.controller';
import { CdnService } from './cdn.service';
import { S3Module } from '../../core/storage/s3.module';

@Module({
  imports: [S3Module],
  controllers: [CdnController],
  providers: [CdnService],
})
export class CdnModule {}
