import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { ListPermissionsDto } from './dto/list-permissions.dto';
import { Prisma } from '@prisma/client';
import { parseSort } from '../../common/utils/sort';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  // async list(where: any, page = 1, perPage = 20) {
  //   const skip = (page - 1) * perPage;
  //   const [total, items] = await this.prisma.$transaction([
  //     this.prisma.permissions.count({ where }),
  //     this.prisma.permissions.findMany({
  //       where,
  //       skip,
  //       take: perPage,
  //       orderBy: { created_at: 'desc' },
  //     }),
  //   ]);
  //   return { total, items };
  // }

  // create(dto: { title: string; description?: string; dynamic_title?: string }) {
  //   return this.prisma.permissions.create({ data: { ...dto } });
  // }

    async list(query: ListPermissionsDto) {
    const { page = 1, perPage = 20, search, sort, all = false, select } = query;

    const where: Prisma.permissionsWhereInput = {
      deleted_at: null,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy =
      (parseSort(sort) as Prisma.permissionsOrderByWithRelationInput[] | undefined) ??
      [{ id: 'asc' }];

    const baseSelect: Prisma.permissionsSelect =
      select === 'options'
        ? { id: true, title: true }
        : { id: true, title: true, description: true, created_at: true, updated_at: true };

    if (all || select === 'options') {
      return await this.prisma.permissions.findMany({ where, orderBy, select: baseSelect });
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.permissions.count({ where }),
      this.prisma.permissions.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        select: baseSelect,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    return { items, page, perPage, total, totalPages, nextCursor: null };
  }

  get(id: bigint) {
    return this.prisma.permissions.findUnique({ where: { id } });
  }

  update(id: bigint, dto: any) {
    return this.prisma.permissions.update({ where: { id }, data: { ...dto } });
  }

  softDelete(id: bigint) {
    return this.prisma.permissions.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
