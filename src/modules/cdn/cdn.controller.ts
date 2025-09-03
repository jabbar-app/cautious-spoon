import { Controller, Post, Get, Delete, Body, Query, UploadedFile, UseInterceptors, Req, Res, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { CdnService } from './cdn.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { GetFileQueryDto } from './dto/get-file.dto';
import { DeleteFileQueryDto } from './dto/delete-file.dto';
import { maxBytes, normalizeFolderPath } from '../../common/utils/cdn-path';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAnyGuard } from '../../common/guards/jwt-any.guard';
import { CdnGetGuard } from '../../common/guards/cdn-get.guard';

@Controller('file')
export class CdnController {
  constructor(private readonly cdn: CdnService) {}

  @Post()
  @Public() // bypass global APP_GUARD, then require our JwtAnyGuard
  @UseGuards(JwtAnyGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: maxBytes() },
    }),
  )
  async upload(
    @Body() dto: UploadFileDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    // No ownership checks; any authenticated user can upload
    const folder = normalizeFolderPath(dto.path);
    return this.cdn.uploadBinary(folder, file);
  }

  @Get()
  @Public() // allow public access for "public/**" paths; CdnGetGuard will enforce when needed
  @UseGuards(CdnGetGuard)
  async get(
    @Query() q: GetFileQueryDto,
    @Res() res: Response,
  ) {
    const key = normalizeFolderPath(q.path);
    const disp = q.redirect ? 'attachment' : 'inline'; // reuse "redirect" flag to mean force download
    // Stream bytes; do not return JSON (bypass envelope)
    await this.cdn.streamToResponse(key, res, disp as any);
  }

  @Delete()
  @Public()
  @UseGuards(JwtAnyGuard) // any valid token can delete (simple policy you asked for)
  async del(@Query() q: DeleteFileQueryDto) {
    const key = normalizeFolderPath(q.path);
    return this.cdn.deleteObject(key);
  }
}
