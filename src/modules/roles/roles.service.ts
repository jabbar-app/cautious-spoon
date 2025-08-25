import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async list(where: any, page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.roles.count({ where }),
      this.prisma.roles.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
      }),
    ]);
    return { total, items };
  }

  create(dto: { title: string; description?: string }) {
    return this.prisma.roles.create({
      data: { title: dto.title, description: dto.description ?? '' },
    });
  }

  get(id: bigint) {
    return this.prisma.roles.findUnique({
      where: { id },
      include: { role_permissions: { include: { permissions: true } } },
    });
  }

  update(id: bigint, dto: { title?: string; description?: string }) {
    return this.prisma.roles.update({
      where: { id },
      data: { ...dto },
    });
  }

  softDelete(id: bigint) {
    return this.prisma.roles.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async attachPermissions(roleId: bigint, attach: string[] = [], detach: string[] = []) {
    if (attach.length) {
      const perms = await this.prisma.permissions.findMany({
        where: { title: { in: attach } },
        select: { id: true },
      });
      await this.prisma.$transaction(
        perms.map((p) =>
          this.prisma.role_permissions.upsert({
            where: { id_role_id_permission: { id_role: roleId, id_permission: p.id } },
            update: {},
            create: { id_role: roleId, id_permission: p.id, created_at: new Date() },
          }),
        ),
      );
    }

    if (detach.length) {
      const perms = await this.prisma.permissions.findMany({
        where: { title: { in: detach } },
        select: { id: true },
      });
      await this.prisma.role_permissions.deleteMany({
        where: { id_role: roleId, id_permission: { in: perms.map((p) => p.id) } },
      });
    }

    return this.get(roleId);
  }
}
