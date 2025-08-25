// src/modules/permissions/permissions.controller.ts
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly perms: PermissionsService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
  ) {
    const where = !search ? {} : { title: { contains: search, mode: 'insensitive' } };
    return this.perms.list(where, Number(page) || 1, Number(perPage) || 20);
  }

  @Post()
  create(@Body() dto: { title: string; description?: string; dynamic_title?: string }) {
    return this.perms.create(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.perms.get(BigInt(id));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: { title?: string; description?: string; dynamic_title?: string },
  ) {
    return this.perms.update(BigInt(id), dto);
  }
}
