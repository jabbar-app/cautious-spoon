import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Inject } from '@nestjs/common';
import { S3_CLIENT } from '../../core/storage/s3.module';
import { normalizeFolderPath, sanitizeExt, isMimeAllowed } from '../../common/utils/cdn-path';
import type { Response } from 'express';

@Injectable()
export class CdnService {
  constructor(@Inject(S3_CLIENT) private readonly s3: S3Client) {}

  private bucket(): string {
    const b = process.env.S3_BUCKET;
    if (!b) throw new InternalServerErrorException({ code: 'S3_BUCKET_MISSING' });
    return b;
  }

  async uploadBinary(dir: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException({ code: 'FILE_REQUIRED' });
    if (!isMimeAllowed(file.mimetype)) {
      throw new BadRequestException({ code: 'UNSUPPORTED_MIME', details: file.mimetype });
    }
    const sizeLimit = Number(process.env.CDN_MAX_MB || 10) * 1024 * 1024;
    if (file.size > sizeLimit) {
      throw new BadRequestException({ code: 'FILE_TOO_LARGE', details: `${file.size} > ${sizeLimit}` });
    }

    const folder = normalizeFolderPath(dir);
    const ext = sanitizeExt(file.originalname || '', file.mimetype);
    const key = `${folder}/${randomUUID()}${ext}`;

    try {
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucket(),
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));

      // Don't return S3 URL — just the key and a backend URL to fetch
      return {
        path: key,
        url: `/file?path=${encodeURIComponent(key)}`,
        size: file.size,
        mime: file.mimetype,
      };
    } catch (e: any) {
      throw new InternalServerErrorException({ code: 'S3_UPLOAD_FAILED', details: e?.message || String(e) });
    }
  }

  /**
   * Streams the S3 object to the HTTP response (no S3 URL exposed).
   * Supports both inline view and forced download via contentDisposition.
   */
  async streamToResponse(key: string, res: Response, contentDisposition?: 'inline' | 'attachment') {
    try {
      const cmd = new GetObjectCommand({ Bucket: this.bucket(), Key: key });
      const obj = await this.s3.send(cmd);
      if (!obj || !obj.Body) throw new NotFoundException({ code: 'FILE_NOT_FOUND' });

      // set headers
      if (obj.ContentType) res.setHeader('Content-Type', obj.ContentType);
      if (obj.ContentLength != null) res.setHeader('Content-Length', String(obj.ContentLength));
      if (obj.LastModified) res.setHeader('Last-Modified', obj.LastModified.toUTCString());
      if (obj.ETag) res.setHeader('ETag', obj.ETag.replaceAll('"', ''));

      if (contentDisposition) {
        res.setHeader('Content-Disposition', `${contentDisposition}`);
      }

      // For public files, allow caching for a short period
      if (key.startsWith('public/')) {
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      } else {
        res.setHeader('Cache-Control', 'private, no-store');
      }

      // pipe body stream
      (obj.Body as any).pipe(res);
    } catch (e: any) {
      if (e?.$metadata?.httpStatusCode === 404) throw new NotFoundException({ code: 'FILE_NOT_FOUND' });
      throw new InternalServerErrorException({ code: 'S3_STREAM_FAILED', details: e?.message || String(e) });
    }
  }

  async deleteObject(key: string) {
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket(), Key: key }));
      return { deleted: true, path: key };
    } catch (e: any) {
      throw new InternalServerErrorException({ code: 'S3_DELETE_FAILED', details: e?.message || String(e) });
    }
  }
}
