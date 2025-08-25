// src/modules/roles/roles.controller.ts
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
  ) {
    const where = !search ? {} : { title: { contains: search, mode: 'insensitive' } };
    return this.roles.list(where, Number(page) || 1, Number(perPage) || 20);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.roles.get(BigInt(id));
  }

  @Post()
  create(@Body() dto: { title: string; description?: string }) {
    return this.roles.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: { title?: string; description?: string }) {
    return this.roles.update(BigInt(id), dto);
  }

  @Patch(':id/permissions')
  attachPermissions(
    @Param('id') id: string,
    @Body() dto: { attach?: string[]; detach?: string[] },
  ) {
    return this.roles.attachPermissions(BigInt(id), dto.attach || [], dto.detach || []);
  }
}
