import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class AdminsService {
  constructor(private prisma: PrismaService) {}

  private async getAdminRoles(adminId: string) {
    return this.prisma.admin_roles.findMany({
      where: { id_admin: adminId },
      include: { roles: true },
    });
  }

  async findById(id: string) {
    const admin = await this.prisma.admins.findUnique({ where: { id: id } });
    if (!admin) return null;
    const adminRoles = await this.getAdminRoles(id);
    return { ...admin, admin_roles: adminRoles };
  }

  async setRoles(adminId: string, attach: string[] = [], detach: string[] = []) {
    // attach by role titles
    if (attach.length) {
      const roles = await this.prisma.roles.findMany({
        where: { title: { in: attach } },
        select: { id: true },
      });
      await this.prisma.$transaction(
        roles.map((r) =>
          this.prisma.admin_roles.upsert({
            where: { id_admin_id_role: { id_admin: adminId, id_role: r.id } },
            update: {},
            create: { id_admin: adminId, id_role: r.id, created_at: new Date() },
          }),
        ),
      );
    }

    // detach by role titles
    if (detach.length) {
      const roles = await this.prisma.roles.findMany({
        where: { title: { in: detach } },
        select: { id: true },
      });
      await this.prisma.admin_roles.deleteMany({
        where: { id_admin: adminId, id_role: { in: roles.map((r) => r.id) } },
      });
    }

    return this.findById(adminId);
  }

  async list(where: any, page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;

    // 1) get total + page of admins (NO include)
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.admins.count({ where }),
      this.prisma.admins.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' }, // snake_case
      }),
    ]);

    if (rows.length === 0) return { total, items: [] };

    // 2) load all admin_roles for the page in one query
    const adminIds = rows.map((a) => a.id);
    const joins = await this.prisma.admin_roles.findMany({
      where: { id_admin: { in: adminIds } },
      include: { roles: true }, // we want the role title/id alongside
    });

    // 3) group by admin id
    const map = new Map<string, typeof joins>();
    for (const j of joins) {
      const arr = map.get(j.id_admin) || [];
      arr.push(j);
      map.set(j.id_admin, arr);
    }

    // 4) stitch
    const items = rows.map((a) => ({ ...a, admin_roles: map.get(a.id) || [] }));

    return { total, items };
  }

}
