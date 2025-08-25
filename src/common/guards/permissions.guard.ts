import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../core/database/prisma.service';
import { PERMISSIONS_KEY } from '../../modules/rbac/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    const user = req.user as { id?: string; sub?: string } | undefined;
    const adminId = user?.id ?? user?.sub;
    if (!adminId) return false;

    // 1) get role ids linked to this admin
    const links = await this.prisma.admin_roles.findMany({
      where: { id_admin: adminId },
      select: { id_role: true },
    });
    if (links.length === 0) return false;

    // 2) get permissions of those roles
    const rolePerms = await this.prisma.role_permissions.findMany({
      where: { id_role: { in: links.map((l) => l.id_role) } },
      select: { permissions: { select: { title: true } } },
    });

    const have = new Set(
      rolePerms.map((rp) => rp.permissions?.title).filter((x): x is string => !!x),
    );
    return required.every((p) => have.has(p));
  }
}
