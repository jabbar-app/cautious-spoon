// src/modules/admins/admins.controller.ts
import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { AdminsService } from './admins.service';

@Controller('admins')
export class AdminsController {
  constructor(private readonly admins: AdminsService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
  ) {
    const where = !search
      ? {}
      : {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        };

    return this.admins.list(where, Number(page) || 1, Number(perPage) || 20);
  }

  @Patch(':id/roles')
  async setRoles(
    @Param('id') id: string,
    @Body() dto: { attach?: string[]; detach?: string[] },
  ) {
    return this.admins.setRoles(id, dto.attach || [], dto.detach || []);
  }
}
