import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { UpdateAdminDto } from './dto/update-admin.dto';
import * as bcrypt from 'bcrypt';
import { ListAdminsDto } from './dto/list-admins.dto';
import { parseSort } from '../../common/utils/sort';
import { Prisma } from '@prisma/client';


function normalizeAdminRow(row: any) {
  const { admin_roles, ...rest } = row ?? {};
  const roles =
    Array.isArray(admin_roles)
      ? admin_roles
          .map((ar: any) => ar?.role ?? ar?.roles ?? null) // handle 'role' or 'roles'
          .filter(Boolean)
      : [];
  return { ...rest, roles };
}

@Injectable()
export class AdminsService {
  constructor(private prisma: PrismaService) {}

  private async getAdminRoles(adminId: string) {
    return this.prisma.admin_roles.findMany({
      where: {
        id_admin: adminId,
        // only roles that are not soft-deleted
        roles: { deleted_at: null },
      },
      include: { roles: true },
    });
  }

  async findById(id: string) {
    const select: Prisma.adminsSelect = {
      // SAFE fields only (no password, no audit/deleted fields)
      id: true,
      email: true,
      name: true,
      phone: true,
      photo: true,
      last_login: true,
      created_at: true,
      updated_at: true,

      // Join → select role fields only
      admin_roles: {
        select: {
          roles: { select: { id: true, title: true } },
        },
      where:{deleted_at: null}},
    };

    const admin = await this.prisma.admins.findFirst({
      where: { id, deleted_at: null }, // soft-delete aware
      select,
    });

    if (!admin) {
      throw new NotFoundException({
        code: 'ADMIN_NOT_FOUND',
        details: `Admin ${id} not found`,
      });
    }

    return normalizeAdminRow(admin);
  }

  /**
   * Attach/detach roles for an admin:
   * - attach: create if missing; revive if soft-deleted
   * - detach: soft-delete existing links
   */
  async setRoles(
    adminId: string,
    rawAttach: (bigint | number | string)[],
    rawDetach: (bigint | number | string)[],
    actorId?: string,
  ) {
    // Ensure admin exists (and not soft-deleted)
    const admin = await this.prisma.admins.findFirst({
      where: { id: adminId, deleted_at: null },
      select: { id: true },
    });
    if (!admin) throw new NotFoundException({ code: 'ADMIN_NOT_FOUND', details: adminId });

    // Normalize & uniq BigInt role IDs
    const toBI = (v: any) => (typeof v === 'bigint' ? v : BigInt(v));
    const uniq = <T>(arr: T[]) => Array.from(new Set(arr.map((x: any) => x.toString()))).map((s) => BigInt(s));
    const attachIds = uniq((rawAttach ?? []).map(toBI));
    const detachIds = uniq((rawDetach ?? []).map(toBI));

    // Only operate on roles that actually exist and are not soft-deleted
    const unionIds = uniq([...attachIds, ...detachIds]);
    const existingRoles = await this.prisma.roles.findMany({
      where: { id: { in: unionIds }, deleted_at: null },
      select: { id: true },
    });
    const existingSet = new Set(existingRoles.map((r) => r.id.toString()));

    const attachValid = attachIds.filter((id) => existingSet.has(id.toString()));
    const detachValid = detachIds.filter((id) => existingSet.has(id.toString()));

    // Short-circuit if nothing to do
    if (attachValid.length === 0 && detachValid.length === 0) {
      // return latest roles (for convenience)
      const roles = await this.prisma.admin_roles.findMany({
        where: { id_admin: adminId, deleted_at: null },
        select: { roles: { select: { id: true, title: true } } },
      });
      return {
        attached: 0,
        revived: 0,
        alreadyAttached: 0,
        detached: 0,
        roles: roles.map((r: any) => r.roles),
      };
    }

    // Transaction: attach (create/revive) + detach (soft-delete)
    const result = await this.prisma.$transaction(async (tx) => {
      // Existing links for attach set
      const existingLinks = await tx.admin_roles.findMany({
        where: { id_admin: adminId, id_role: { in: attachValid } },
        select: { id_role: true, deleted_at: true },
      });
      const existingMap = new Map(existingLinks.map((l) => [l.id_role.toString(), l.deleted_at]));

      const toCreate: { id_admin: string; id_role: bigint; created_by?: string }[] = [];
      const toRevive: bigint[] = [];
      let alreadyAttached = 0;

      for (const rid of attachValid) {
        const key = rid.toString();
        if (!existingMap.has(key)) {
          toCreate.push({ id_admin: adminId, id_role: rid, ...(actorId ? { created_by: actorId } : {}) });
        } else {
          const wasDeleted = existingMap.get(key) !== null;
          if (wasDeleted) toRevive.push(rid);
          else alreadyAttached++;
        }
      }

      let created = 0;
      if (toCreate.length > 0) {
        const c = await tx.admin_roles.createMany({ data: toCreate, skipDuplicates: true });
        created = c.count ?? toCreate.length;
      }

      let revived = 0;
      if (toRevive.length > 0) {
        const upd = await tx.admin_roles.updateMany({
          where: { id_admin: adminId, id_role: { in: toRevive } },
          data: {
            deleted_at: null,
            ...(actorId ? { updated_by: actorId } : {}),
            updated_at: new Date(),
          },
        });
        revived = upd.count ?? 0;
      }

      let detached = 0;
      if (detachValid.length > 0) {
        const upd = await tx.admin_roles.updateMany({
          where: { id_admin: adminId, id_role: { in: detachValid }, deleted_at: null },
          data: {
            deleted_at: new Date(),
            ...(actorId ? { deleted_by: actorId } : {}),
          },
        });
        detached = upd.count ?? 0;
      }

      // Return fresh roles
      const rolesRows = await tx.admin_roles.findMany({
        where: { id_admin: adminId, deleted_at: null },
        select: { roles: { select: { id: true, title: true } } },
        orderBy: { id_role: 'asc' },
      });

      return {
        attached: created,
        revived,
        alreadyAttached,
        detached,
        roles: rolesRows.map((r: any) => r.roles),
      };
    });

    return result;
  }

  async list(query: ListAdminsDto) {
    const { page = 1, perPage = 20, search, sort, all = false, select } = query;

    // Only active rows by default (soft-delete aware)
    const where: Prisma.adminsWhereInput = {
      deleted_at: null,
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    // Order by parser
    const orderBy = parseSort(sort) as Prisma.adminsOrderByWithRelationInput[] | undefined;

    // Select/Include — whitelist output
    const baseSelect: Prisma.adminsSelect =
      select === 'options'
        ? {
            id: true,
            name: true,
          }
        : {
            id: true,
            email: true,
            name: true,
            phone: true,
            created_at: true,
            updated_at: true,
            // Assuming relation alias: admin_roles -> role
            admin_roles: {
              select: {
                roles: {
                  select: {
                    id: true,      // BIGINT -> will be stringified by interceptor
                    title: true,
                  },
                },
              },
            where:{deleted_at: null}
            },
          };

    if (all || select === 'options') {
  const items = await this.prisma.admins.findMany({
    where,
    orderBy,
    select: baseSelect,
  });

  if (select === 'options') {
    // lean options, no relations
    return items;
  }

  // full rows but without leaking admin_roles
  return items.map(normalizeAdminRow);
}

// --- paginated path ---
const [total, itemsRaw] = await this.prisma.$transaction([
  this.prisma.admins.count({ where }),
  this.prisma.admins.findMany({
    where,
    orderBy,
    skip: (page - 1) * perPage,
    take: perPage,
    select: baseSelect,
  }),
]);

const items = itemsRaw.map(normalizeAdminRow);

const totalPages = Math.max(1, Math.ceil(total / perPage));
return { items, page, perPage, total, totalPages, nextCursor: null };
  }

  async create(dto: { email: string; password: string; name?: string; phone?: string; roles?: string[] }, createdById?: string) {
  const exists = await this.prisma.admins.findFirst({ where: { email: dto.email, deleted_at: null } });
  if (exists) throw new ConflictException('EMAIL_TAKEN');

  const cost = process.env.BCRYPT_ROUNDS ? Number(process.env.BCRYPT_ROUNDS) : 10;
  const password = await bcrypt.hash(dto.password, cost);

  const admin = await this.prisma.admins.create({
    data: {
      email: dto.email,
      password,
      name: dto.name ?? '',
      phone: dto.phone ?? '',
      created_at: new Date(),
      created_by: createdById ?? '',
    },
  });

  if (dto.roles?.length) {
    await this.setRoles(admin.id, dto.roles, []);
  }

  return this.findById(admin.id);
  }

  // --- NEW: soft delete admin (and detach roles, revoke tokens if table exists)
  async softDeleteAdmin(id_admin: string, actingAdminId?: string) {
    if (actingAdminId && id_admin === actingAdminId) {
      throw new BadRequestException('CANNOT_DELETE_SELF');
    }

    const admin = await this.prisma.admins.findUnique({ where: { id: id_admin } });
    if (!admin || admin.deleted_at) throw new NotFoundException('ADMIN_NOT_FOUND');

    await this.prisma.$transaction(async (tx) => {
      await tx.admins.update({
        where: { id: id_admin },
        data: { deleted_at: new Date(), deleted_by: actingAdminId ?? '' },
      });

      await tx.admin_roles.deleteMany({ where: { id_admin } });

      // optional: revoke refresh tokens if the table exists in your env
      try {
        // If the table is absent in some environments this will throw; we ignore.
        await tx.admin_refresh_tokens.updateMany({
          where: { admin_id: id_admin, revoked_at: null },
          data: { revoked_at: new Date() },
        });
      } catch {
        // ignore
      }
    });

    return { deleted: true, id: id_admin };
  }

  async update(id_admin: string, dto: UpdateAdminDto, actorId?: string) {
    const admin = await this.prisma.admins.findUnique({ where: { id: id_admin } });
    if (!admin || admin.deleted_at) throw new NotFoundException('ADMIN_NOT_FOUND');

    // Email conflict check (only if email changes)
    if (dto.email && dto.email !== admin.email) {
      const conflict = await this.prisma.admins.findFirst({
        where: { email: dto.email, deleted_at: null, NOT: { id: id_admin } },
      });
      if (conflict) throw new ConflictException('EMAIL_TAKEN');
    }

    const data: Record<string, any> = {
      updated_at: new Date(),
      updated_by: actorId ?? '',
    };

    if (dto.email !== undefined) data.email = dto.email;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone;

    if (dto.password) {
      const cost = process.env.BCRYPT_ROUNDS ? Number(process.env.BCRYPT_ROUNDS) : 10;
      data.password = await bcrypt.hash(dto.password, cost);
    }

    await this.prisma.admins.update({ where: { id: id_admin }, data });

    // Return with active roles stitched in
    return this.findById(id_admin);
  }
}
