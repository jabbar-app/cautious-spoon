import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Patch, UseGuards } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CandidatesService } from './candidates.service';
import { CreateCandidateAdminDto } from './dto/create-candidate-admin.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { GetCandidateParamsDto } from './dto/get-candidate-params.dto';
import { ListCandidatesDto } from './dto/list-candidates.dto';
import { PatchCandidateAdminsDto } from './dto/patch-candidate-admins.dto';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly service: CandidatesService) {}

  @Post('admins')
  @Permissions('candidate.admin.create')
  async createByAdmin(@Body() dto: CreateCandidateAdminDto, @Req() req: any) {
    const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    const actorType: string | undefined = req?.user?.typ;
    return this.service.createByAdmin(dto, actorId, actorType);
  }

  @Get()
  @Permissions('candidate.get')
  async list(@Query() q: ListCandidatesDto) {
    return this.service.listAllWithRelations(q);
  }

  @Get(':id')
  @Permissions('candidate.details')
  async details(@Param() params: GetCandidateParamsDto) {
    return this.service.details(params.id);
  }

  @Put(':id')
  @Permissions('candidate.update')
  async update(@Param() params: GetCandidateParamsDto, @Body() dto: UpdateCandidateDto, @Req() req: any) {
    const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    return this.service.update(params.id, dto, actorId);
  }

  @Delete(':id')
  @Permissions('candidate.delete')
  async softDelete(@Param() params: GetCandidateParamsDto, @Req() req: any) {
    const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    return this.service.softDelete(params.id, actorId);
  }

  @Patch(':id/admins')
  @Permissions('candidate.update')
  async patchAdmins(
    @Param() params: GetCandidateParamsDto,
    @Body() dto: PatchCandidateAdminsDto,
    @Req() req: any,
  ) {
    const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    return this.service.setAdminOwners(params.id, dto.attach ?? [], dto.detach ?? [], actorId);
  }
}
