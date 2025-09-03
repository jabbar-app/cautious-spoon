import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Allows unauthenticated if path starts with "public/"
@Injectable()
export class CdnGetGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  private bearer(req: any): string | null {
    const h = req.headers?.authorization;
    if (!h || typeof h !== 'string') return null;
    const p = 'Bearer ';
    return h.startsWith(p) ? h.slice(p.length).trim() : null;
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const path = (req.query?.path ?? '').toString();
    const isPublic = path.startsWith('public/') || path.startsWith('/public/');

    if (isPublic) return true; // no token needed

    // else require any valid JWT
    const token = this.bearer(req);
    if (!token) throw new UnauthorizedException('MISSING_BEARER');
    try {
      const payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_ACCESS_SECRET! });
      req.user = { id: payload.sub, sub: payload.sub, typ: payload.typ, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException('INVALID_TOKEN');
    }
  }
}
