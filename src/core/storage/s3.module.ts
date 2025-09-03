import { Global, Module } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';

export const S3_CLIENT = Symbol('S3_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: S3_CLIENT,
      useFactory: () => {
        const region = process.env.S3_REGION || 'ap-southeast-1';
        const endpoint = process.env.S3_ENDPOINT || undefined;
        const forcePathStyle = (process.env.S3_FORCE_PATH_STYLE || 'false') === 'true';
        const credentials = {
          accessKeyId: process.env.S3_ACCESS_KEY || '',
          secretAccessKey: process.env.S3_SECRET_KEY || '',
        };

        return new S3Client({
          region,
          endpoint,
          forcePathStyle,
          credentials,
        });
      },
    },
  ],
  exports: [S3_CLIENT],
})
export class S3Module {}
