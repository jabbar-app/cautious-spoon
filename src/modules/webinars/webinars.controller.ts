import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { WebinarsService } from './webinars.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateWebinarDto } from './dto/create-webinar.dto';
import { UpdateWebinarDto } from './dto/update-webinar.dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { GenerateCodeDto } from './dto/generate-code.dto';

@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller('webinars') // <-- top-level
export class WebinarsController {
  constructor(private readonly service: WebinarsService) {}

  // POST /webinars  (webinar.create)  <-- create without program
  @Post()
  @Permissions('webinar.create')
  async createStandalone(@Body() dto: CreateWebinarDto, @Req() req: Request) {
    const adminId =
      (req as any).user?.id ??
      (req as any).user?.sub ??
      'system';
    return this.service.create(dto, adminId);
  }

  // GET /webinars  (webinar.get)  ?programId=... (optional filter)
  @Get()
  @Permissions('webinar.get')
  async listStandalone(@Query() query: ListQueryDto & { programId?: string }) {
    return this.service.list(query as any);
  }

  // GET /webinars/:id_webinar  (webinar.details)
  @Get(':id_webinar')
  @Permissions('webinar.details')
  async detailsStandalone(@Param('id_webinar') id_webinar: string) {
    return this.service.detailsById(id_webinar);
  }

  // PUT /webinars/:id_webinar  (webinar.update)
  @Put(':id_webinar')
  @Permissions('webinar.update')
  async updateStandalone(@Param('id_webinar') id_webinar: string, @Body() dto: UpdateWebinarDto, @Req() req: Request) {
    const adminId =
      (req as any).user?.id ??
      (req as any).user?.sub ??
      'system';
    return this.service.updateById(id_webinar, dto, adminId);
  }

  // DELETE /webinars/:id_webinar  (webinar.delete)
  @Delete(':id_webinar')
  @Permissions('webinar.delete')
  async remove(
    @Param('id_webinar') id_webinar: string,
    @Req() req: Request,
  ) {
    const adminId =
      (req as any).user?.id ??
      (req as any).user?.sub ??
      'system';
    return this.service.softDeleteById( id_webinar, adminId);
  }


  // POST /webinars/:id_webinar/code  (webinar.code)  <-- no throttling
  @Post(':id_webinar/code')
  @Permissions('webinar.code')
  async codeStandalone(@Param('id_webinar') id_webinar: string, @Body() dto: GenerateCodeDto) {
    const ttl = (dto as any).ttlHours ?? 24;
    const r = await this.service.generateCodeById(id_webinar, ttl);
    return { message: 'Code generated', data: r };
  }

  // GET /webinars/:id_webinar/participants  (webinar.participants.get)
  @Get(':id_webinar/participants')
  @Permissions('webinar.participants.get')
  async listParticipantsStandalone(
    @Param('id_webinar') id_webinar: string,
    @Query() query: ListQueryDto & { status?: 'register' | 'attended' },
  ) {
    return this.service.listParticipantsByWebinar(id_webinar, query as any);
  }

  // DELETE /webinars/:id_webinar/participants/:id_candidate_webinar  (webinar.participants.delete)
  @Delete(':id_webinar/participants/:id_candidate_webinar')
  @Permissions('webinar.participants.delete')
  async deleteParticipantStandalone(
    @Param('id_webinar') _id_webinar: string, // kept in path for clarity
    @Param('id_candidate_webinar') id_cw: string,
  ) {
    return this.service.deleteParticipantById(id_cw);
  }

  // GET /webinars/:id_webinar/broadcast  (webinar.broadcast)
  @Get(':id_webinar/broadcast')
  @Permissions('webinar.broadcast')
  async broadcastStandalone(@Param('id_webinar') id_webinar: string) {
    return this.service.broadcastByWebinar(id_webinar);
  }
}
