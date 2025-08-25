import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async list(where: any, page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.permissions.count({ where }),
      this.prisma.permissions.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
      }),
    ]);
    return { total, items };
  }

  create(dto: { title: string; description?: string; dynamic_title?: string }) {
    return this.prisma.permissions.create({ data: { ...dto } });
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
