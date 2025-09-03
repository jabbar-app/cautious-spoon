import { Controller, Get,Put, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ListPermissionsDto } from './dto/list-permissions.dto';

@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly perms: PermissionsService) {}

  @Get()
  @Permissions('admin.permission.get')
  async list(@Query() query: ListPermissionsDto) {
    return this.perms.list(query);
  }

  // list(@Query('page') page?: string, @Query('perPage') perPage?: string, @Query('search') search?: string) {
  //   const p = page ? Number(page) : 1;
  //   const pp = perPage ? Number(perPage) : 20;
  //   const where = search ? { title: { contains: search } } : {};
  //   return this.perms.list(where, p, pp);
  // }

  @Get(':id')
  @Permissions('admin.permission.details')
  findOne(@Param('id') id: string) {
    return this.perms.get(BigInt(id));
  }

  // @Post()
  // @Permissions('admin.permission.create')
  // create(@Body() dto: { title: string; description?: string; dynamic_title?: string }) {
  //   return this.perms.create(dto);
  // }

  @Put(':id')
  @Permissions('admin.permission.update')
  update(@Param('id') id: string, @Body() dto: { title?: string; description?: string; dynamic_title?: string }) {
    return this.perms.update(BigInt(id), dto);
  }
}
