// src/common/guards/permissions.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQ_PERMS } from '../decorators/permissions.decorator';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(REQ_PERMS, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // No permissions declared => allow (JWT guard still applies)
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    const user = req.user as { id: string; typ: string } | undefined;
    if (!user) throw new ForbiddenException('FORBIDDEN');

    //Superadmin bypasses RBAC
    if (user.typ === 'superadmin') return true;

    // Only admin tokens proceed to RBAC checks
    if (user.typ !== 'admin') throw new ForbiddenException('FORBIDDEN');

    // Get roles for admin
    const adminRoles = await this.prisma.admin_roles.findMany({
      where: { id_admin: user.id },
      include: { roles: true },
    });

    // Fast path (optional): system_admin role
    if (adminRoles.some((ar) => ar.roles?.title === 'system_admin'))
      return true;

    const roleIds = adminRoles
      .map((r) => r.id_role)
      .filter((v) => v !== null) as bigint[];
    if (roleIds.length === 0) throw new ForbiddenException('NO_ROLES');

    const rolePermRows = await this.prisma.role_permissions.findMany({
      where: { id_role: { in: roleIds } },
      select: { id_permission: true },
    });

    const permIds = rolePermRows
      .map((rp) => rp.id_permission)
      .filter((v) => v !== null) as bigint[];
    if (permIds.length === 0) throw new ForbiddenException('NO_PERMISSIONS');

    const perms = await this.prisma.permissions.findMany({
      where: { id: { in: permIds } },
      select: { title: true },
    });

    const have = new Set(perms.map((p) => p.title || '').filter(Boolean));
    const ok = required.every((need) => have.has(need));
    if (!ok) throw new ForbiddenException('MISSING_PERMISSION');

    return true;
  }
}
