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
import { CreateCandidateSkillDto } from './dto/skills/create-candidate-skill.dto';
import { UpdateCandidateSkillDto } from './dto/skills/update-candidate-skill.dto';
import { CreateCandidateWorkExpDto } from './dto/work-exps/create-candidate-work-exp.dto';
import { UpdateCandidateWorkExpDto } from './dto/work-exps/update-candidate-work-exp.dto';
import { AttachCandidateWebinarDto } from './dto/webinars/attach-candidate-webinar.dto';
import { AttachCandidateVacancyDto } from './dto/vacancies/attach-candidate-vacancy.dto';
import { AttachAdminsDto } from './dto/attach-admins.dto';

@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly service: CandidatesService) {}

  @Post('admins')
  @Permissions('candidate.admin.create')
  attachAdmins(@Body() dto: AttachAdminsDto, @Req() req: any) {
    const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    return this.service.setAdminOwners(dto.id_candidate, dto.attach ?? [], dto.detach ?? [], actorId);
  }

  @Post()
  @Permissions('candidate.create')
  create(@Body() dto: any, @Req() req: any) {
    const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    const actorType: string = req?.user?.typ ?? '';
    return this.service.createCandidate(dto, actorId, actorType);
  }

  @Get()
  @Permissions('candidate.get')
  async list(@Query() q: ListCandidatesDto) {
    return this.service.listAllWithRelations(q);
  }

  @Get(':id')
  @Permissions('candidate.details')
    async detailsExpanded(@Param('id') id: string) {
    return this.service.detailsExpanded(id);
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

  // -------- Skills --------
  @Post(':id/skills')
  @Permissions('candidate.skill.create')
  createSkill(@Param('id') id: string, @Body() dto: CreateCandidateSkillDto, @Req() req: any) {
    // const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    return this.service.addSkill(id, dto);
  }

  @Put(':id/skills/:skillId')
  @Permissions('candidate.skill.update')
  updateSkill(
    @Param('id') id: string,
    @Param('skillId') skillId: string,
    @Body() dto: UpdateCandidateSkillDto,
    @Req() req: any,
  ) {
    // const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    return this.service.updateSkill(id, skillId, dto);
  }

  @Delete(':id/skills/:skillId')
  @Permissions('candidate.skill.delete')
  deleteSkill(@Param('id') id: string, @Param('skillId') skillId: string, @Req() req: any) {
    const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    return this.service.deleteSkill(id, skillId);
  }

  // -------- Work Experiences --------
  @Post(':id/work-exps')
  @Permissions('candidate.work.create')
  createWorkExp(@Param('id') id: string, @Body() dto: CreateCandidateWorkExpDto, @Req() req: any) {
    // const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    return this.service.addWorkExp(id, dto);
  }

  @Put(':id/work-exps/:workId')
  @Permissions('candidate.work.update')
  updateWorkExp(
    @Param('id') id: string,
    @Param('workId') workId: string,
    @Body() dto: UpdateCandidateWorkExpDto,
    @Req() req: any,
  ) {
    // const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    return this.service.updateWorkExp(id, workId, dto);
  }

  @Delete(':id/work-exps/:workId')
  @Permissions('candidate.work.delete')
  deleteWorkExp(@Param('id') id: string, @Param('workId') workId: string, @Req() req: any) {
    // const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    return this.service.deleteWorkExp(id, workId);
  }

  // -------- Webinars (attach/detach) --------
  @Post(':id/webinars')
  @Permissions('candidate.webinars.create')
  attachWebinar(@Param('id') id: string, @Body() dto: AttachCandidateWebinarDto, @Req() req: any) {
    const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    return this.service.attachWebinar(id, dto.webinarId, actorId);
  }

  @Delete(':id/webinars/:webinarId')
  @Permissions('candidate.webinars.delete')
  detachWebinar(@Param('id') id: string, @Param('webinarId') webinarId: string, @Req() req: any) {
    const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    return this.service.detachWebinar(id, webinarId, actorId);
  }

  // -------- Vacancies (attach/detach) --------
  @Post(':id/vacancies')
  @Permissions('candidate.vacancies.create')
  attachVacancy(@Param('id') id: string, @Body() dto: AttachCandidateVacancyDto, @Req() req: any) {
    const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    return this.service.attachVacancy(id, dto.vacancyId, actorId);
  }

  @Delete(':id/vacancies/:vacancyId')
  @Permissions('candidate.vacancies.delete')
  detachVacancy(@Param('id') id: string, @Param('vacancyId') vacancyId: string, @Req() req: any) {
    const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    return this.service.detachVacancy(id, vacancyId, actorId);
  }
}
