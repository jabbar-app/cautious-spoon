import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { AssignParticipantsDto } from './dto/assign-participants.dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { ListParticipantsQueryDto } from './dto/list-participants.query';

@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller('programs')
export class ProgramsController {
  constructor(private readonly service: ProgramsService) {}

  // POST Programs > Create
  @Post()
  @Permissions('program.create') // you listed "program.create" under RBAC label "program.create"? your table says program.create or program.create?
  async create(@Body() dto: CreateProgramDto, @Req() req: Request) {
    const adminId =
      (req as any).user?.id ??
      (req as any).user?.sub ??
      'system';
    return this.service.create(dto, adminId);
  }

  // GET Programs > View All
  @Get()
  @Permissions('program.get') // table shows program.get
  async list(@Query() query: ListQueryDto) {
    return this.service.list(query as any);
  }

  // GET Programs > Details
  @Get(':id_program')
  @Permissions('program.details')
  async details(@Param('id_program') id: string) {
    return this.service.getDetails(id);
  }

  // PUT Programs > Update
  @Put(':id_program')
  @Permissions('programs.update') // matches your exact string
  async update(@Param('id_program') id: string, @Body() dto: UpdateProgramDto, @Req() req: Request) {
    const adminId =
      (req as any).user?.id ??
      (req as any).user?.sub ??
      'system';
    return this.service.update(id, dto, adminId);
  }

  // DELETE Programs > Delete
  @Delete(':id_program')
  @Permissions('program.delete')
  async remove(@Param('id_program') id: string, @Req() req: Request) {
    const adminId =
      (req as any).user?.id ??
      (req as any).user?.sub ??
      'system';
    return this.service.softDelete(id, adminId);
  }


  // GET Programs > Participants
  @Get(':id_program/participants')
  @Permissions('program.participants')
  async listParticipants(
    @Param('id_program') id: string,
    @Query() query: ListParticipantsQueryDto,
  ) {
    // Service now returns a paging object ({ items, page, perPage, total, ... })
    // To avoid "pagination inside data", return that object directly.
    // Your ResponseEnvelopeInterceptor should detect this shape and lift pagination to the top.
    return this.service.listParticipants(id, query as any);
  }

  // POST Programs > Assign Candidate
  @Post(':id_program/participants')
  @Permissions('program.assign')
  async assign(@Param('id_program') id: string, @Body() dto: AssignParticipantsDto) {
    return this.service.assignParticipants(id, dto.candidateIds);
  }
}
