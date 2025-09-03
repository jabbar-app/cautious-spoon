import { Controller, Get, Patch, Param, Body, Query, UseGuards, Req, Post, Delete, Put } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ListAdminsDto } from './dto/list-admins.dto';
import { GetAdminParamsDto } from './dto/get-admin-params.dto';
import { PatchAdminRolesDto } from './dto/patch-admin-roles.dto';

@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller('admins')
export class AdminsController {
  constructor(private readonly admins: AdminsService) {}

  // Example: GET /admins?page=1&perPage=20&search=john&sort=created_at,-email
  //          GET /admins?all=true
  //          GET /admins?select=options&all=true

  @Get()
  @Permissions('admin.get')
  async list(@Query() query: ListAdminsDto) {
    return this.admins.list(query);
  }

  @Get(':id')
  @Permissions('admin.details')
  async findById(@Param() params: GetAdminParamsDto) {
    return this.admins.findById(params.id);
  }

  @Patch(':id/roles')
  @Permissions('admin.roles.assign')
  async patchRoles(
    @Param() params: GetAdminParamsDto,
    @Body() dto: PatchAdminRolesDto,
    @Req() req: any,
  ) {
    const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    return this.admins.setRoles(params.id, dto.attach ?? [], dto.detach ?? [], actorId);
  }

  @Post()
  @Permissions('admin.create')
  create(@Body() dto: CreateAdminDto, @Req() req: any) {
    const actorId = req?.user?.sub as string | undefined;
    return this.admins.create(dto, actorId);
  }

  @Delete(':id_admin')
  @Permissions('admin.delete')
  remove(@Param('id_admin') id_admin: string, @Req() req: any) {
    const actorId = req?.user?.sub as string | undefined;
    return this.admins.softDeleteAdmin(id_admin, actorId);
  }

  @Put(':id_admin')
  @Permissions('admin.update')
  update(@Param('id_admin') id_admin: string, @Body() dto: UpdateAdminDto, @Req() req: any) {
    const actorId = req?.user?.sub as string | undefined;
    return this.admins.update(id_admin, dto, actorId);
  }
}
