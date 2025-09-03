import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { parseSort } from '../../common/utils/sort';
import { ListRolesDto } from './dto/list-roles.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  private toBigInt(v: string | number): bigint {
    if (typeof v === 'number') return BigInt(v);
    if (/^\d+$/.test(v)) return BigInt(v);
    throw new BadRequestException({ code: 'INVALID_BIGINT', details: String(v) });
    // If your role id can be non-numeric, adjust here.
  }

  private uniq<T>(arr: T[]): T[] {
    return Array.from(new Set(arr.map((x: any) => String(x)))).map((s: any) => {
      // Keep original type guessing minimal: return string if input was string, else number/bigint branch handled above
      return (arr.find((x: any) => String(x) === s) as T)!;
    });
  }

  private async listRolePermissions(roleIdBI: bigint) {
    const rows = await this.prisma.role_permissions.findMany({
      where: { id_role: roleIdBI as any, deleted_at: null },
      select: { permissions: { select: { id: true, title: true } } },
      orderBy: { id_permission: 'asc' },
    });
    return rows.map((r: any) => r.permissions);
  }

  private async listRolePermissionsTx(tx: PrismaService | any, roleIdBI: bigint) {
    const rows = await tx.role_permissions.findMany({
      where: { id_role: roleIdBI as any, deleted_at: null },
      select: { permissions: { select: { id: true, title: true } } },
      orderBy: { id_permission: 'asc' },
    });
    return rows.map((r: any) => r.permissions);
  }

  // async list(where: any, page = 1, perPage = 20) {
  //   const skip = (page - 1) * perPage;
  //   const [total, items] = await this.prisma.$transaction([
  //     this.prisma.roles.count({ where }),
  //     this.prisma.roles.findMany({
  //       where,
  //       skip,
  //       take: perPage,
  //       orderBy: { created_at: 'desc' },
  //     }),
  //   ]);
  //   return { total, items };
  // }

    async list(query: ListRolesDto) {
    const { page = 1, perPage = 20, search, sort, all = false, select } = query;

    const where: Prisma.rolesWhereInput = {
      deleted_at: null,
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };

    const orderBy = parseSort(sort) as Prisma.rolesOrderByWithRelationInput[] | undefined;

    const baseSelect: Prisma.rolesSelect =
      select === 'options'
        ? { id: true, title: true }
        : { id: true, title: true, description: true, created_at: true, updated_at: true };

    if (all || select === 'options') {
      return await this.prisma.roles.findMany({ where, orderBy, select: baseSelect });
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.roles.count({ where }),
      this.prisma.roles.findMany({
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


  async attachPermissions(
    roleIdParam: string,
    attachRaw: Array<string | number> = [],
    detachRaw: Array<string | number> = [],
    actorId?: string,
  ) {
    // 0) Normalize role id (roles.id is almost certainly BIGINT in your repo)
    const roleIdBI = this.toBigInt(roleIdParam);

    // 1) Ensure role exists (soft-delete aware)
    const role = await this.prisma.roles.findFirst({
      where: { id: roleIdBI, deleted_at: null },
      select: { id: true },
    });
    if (!role) throw new NotFoundException({ code: 'ROLE_NOT_FOUND', details: roleIdParam });

    // 2) Detect DB type for permissions.id (bigint vs string/int)
    const sample = await this.prisma.permissions.findFirst({ select: { id: true } });
    const permIdIsBigInt = typeof sample?.id === 'bigint';

    // 3) Coerce payload IDs to correct type
    const coercePermId = (v: string | number) =>
      permIdIsBigInt ? this.toBigInt(v) : String(v);

    const attachIds = this.uniq((attachRaw ?? []).map(coercePermId));
    const detachIds = this.uniq((detachRaw ?? []).map(coercePermId));

    // 4) Validate that requested permission IDs actually exist
    const union = this.uniq([...(attachIds as any[]), ...(detachIds as any[])]);
    if (union.length === 0) {
      // Return current permissions (quality-of-life)
      const current = await this.listRolePermissions(roleIdBI);
      return { attached: 0, revived: 0, alreadyAttached: 0, detached: 0, permissions: current };
    }

    const existing = await this.prisma.permissions.findMany({
      where: { id: { in: union as any }, deleted_at: null },
      select: { id: true },
    });

    const existSet = new Set(existing.map((r) => String(r.id)));
    const missingAttach = (attachIds as any[]).filter((id) => !existSet.has(String(id)));
    const missingDetach = (detachIds as any[]).filter((id) => !existSet.has(String(id)));

    if (missingAttach.length || missingDetach.length) {
      throw new BadRequestException({
        code: 'PERMISSION_ID_NOT_FOUND',
        details: `Unknown permission ids`,
        fields: {
          attach: missingAttach.length ? missingAttach.map(String).join(',') : undefined,
          detach: missingDetach.length ? missingDetach.map(String).join(',') : undefined,
        },
      });
    }

    // Filter valid sets (all are valid after the check above)
    const attachValid = attachIds as any[];
    const detachValid = detachIds as any[];

    // 5) Apply changes in a single transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Read existing links (including soft-deleted) for attach set
      const links = await tx.role_permissions.findMany({
        where: { id_role: roleIdBI as any, id_permission: { in: attachValid as any } },
        select: { id_permission: true, deleted_at: true },
      });
      const linkMap = new Map(links.map((l) => [String(l.id_permission), l.deleted_at]));

      // Prepare create/revive sets
      const toCreate: Array<{ id_role: any; id_permission: any; created_by?: string }> = [];
      const toRevive: any[] = [];
      let alreadyAttached = 0;

      for (const pid of attachValid) {
        const key = String(pid);
        if (!linkMap.has(key)) {
          toCreate.push({
            id_role: roleIdBI as any,
            id_permission: pid,
            ...(actorId ? { created_by: actorId } : {}),
          });
        } else {
          const wasDeleted = linkMap.get(key) !== null;
          if (wasDeleted) toRevive.push(pid);
          else alreadyAttached++;
        }
      }

      let created = 0;
      if (toCreate.length > 0) {
        const c = await tx.role_permissions.createMany({
          data: toCreate as any,
          skipDuplicates: true,
        });
        created = c.count ?? toCreate.length;
      }

      let revived = 0;
      if (toRevive.length > 0) {
        const upd = await tx.role_permissions.updateMany({
          where: { id_role: roleIdBI as any, id_permission: { in: toRevive as any } },
          data: {
            deleted_at: null,
            updated_at: new Date(),
            ...(actorId ? { updated_by: actorId } : {}),
          },
        });
        revived = upd.count ?? 0;
      }

      let detached = 0;
      if (detachValid.length > 0) {
        const upd = await tx.role_permissions.updateMany({
          where: { id_role: roleIdBI as any, id_permission: { in: detachValid as any }, deleted_at: null },
          data: {
            deleted_at: new Date(),
            ...(actorId ? { deleted_by: actorId } : {}),
          },
        });
        detached = upd.count ?? 0;
      }

      const permissions = await this.listRolePermissionsTx(tx, roleIdBI);
      return { attached: created, revived, alreadyAttached, detached, permissions };
    });

    return result;
  }

  async assignRoleToAdmin(roleId: bigint, adminId: string) {
    // ensure role exists & not soft-deleted
    const role = await this.prisma.roles.findUnique({ where: { id: roleId } });
    if (!role || role.deleted_at) throw new NotFoundException('ROLE_NOT_FOUND');

    // ensure admin exists & not soft-deleted
    const admin = await this.prisma.admins.findUnique({ where: { id: adminId } });
    if (!admin || admin.deleted_at) throw new NotFoundException('ADMIN_NOT_FOUND');

    await this.prisma.admin_roles.upsert({
      where: { id_admin_id_role: { id_admin: adminId, id_role: roleId } },
      update: {},
      create: { id_admin: adminId, id_role: roleId, created_at: new Date() },
    });

    // return minimal confirmation
    return { assigned: true, adminId, roleId: String(roleId) };
  }

async softDelete(roleId: bigint) {
    const role = await this.prisma.roles.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('ROLE_NOT_FOUND');

    await this.prisma.$transaction(async (tx) => {
      if (!role.deleted_at) {
        await tx.roles.update({
          where: { id: roleId },
          data: { deleted_at: new Date() },
        });
      }
      // Detach from all admins so the role won't show up anywhere
      await tx.admin_roles.deleteMany({ where: { id_role: roleId } });
      // (Optional) If you also want to drop role→permission bindings, uncomment:
      // await tx.role_permissions.deleteMany({ where: { id_role: roleId } });
    });

    return { deleted: true, id: String(roleId) };
  }
}
