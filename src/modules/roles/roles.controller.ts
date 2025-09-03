import { Controller, Get, Param, Post, Put, Delete, Patch, Body, Query, UseGuards, Req } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ListRolesDto } from './dto/list-roles.dto';
import { GetRoleParamsDto } from './dto/get-role-params.dto';
import { PatchRolePermissionsDto } from './dto/patch-role-permissions.dto';

@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @Permissions('admin.roles.get')
  async list(@Query() query: ListRolesDto) {
    return this.roles.list(query);
  }
  // list(@Query('page') page?: string, @Query('perPage') perPage?: string, @Query('search') search?: string) {
  //   const p = page ? Number(page) : 1;
  //   const pp = perPage ? Number(perPage) : 20;
  //   const where = search ? { title: { contains: search } } : {};
  //   return this.roles.list(where, p, pp);
  // }

  @Get(':id')
  @Permissions('admin.roles.details')
  findOne(@Param('id') id: string) {
    return this.roles.get(BigInt(id));
  }

  @Post()
  @Permissions('admin.roles.create')
  create(@Body() dto: { title: string; description?: string }) {
    return this.roles.create(dto);
  }

  @Put(':id')
  @Permissions('admin.roles.update')
  update(@Param('id') id: string, @Body() dto: { title?: string; description?: string }) {
    return this.roles.update(BigInt(id), dto);
  }

  @Patch(':id/permissions')
  @Permissions('role.permissions.assign')
  async patchPermissions(
    @Param() params: GetRoleParamsDto,
    @Body() dto: PatchRolePermissionsDto,
    @Req() req: any,
  ) {
    const actorId: string = req?.user?.id ?? req?.user?.sub ?? 'system';
    return this.roles.attachPermissions(params.id, dto.attach ?? [], dto.detach ?? [], actorId);
  }

  // @Patch(':id/admins')
  // @Permissions('admin.roles.assign')
  // assignRoleToAdmin(@Param('id_role') idRole: string, @Body() dto: { adminId: string }) {
  //   return this.roles.assignRoleToAdmin(BigInt(idRole), dto.adminId);
  // }

  @Delete(':id_roles')
  @Permissions('admin.roles.delete')
  delete(@Param('id_roles') id: string) {
    return this.roles.softDelete(BigInt(id));
  }
}
