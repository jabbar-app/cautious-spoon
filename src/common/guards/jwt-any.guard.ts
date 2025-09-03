import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAnyGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  private bearer(req: any): string | null {
    const h = req.headers?.authorization;
    if (!h || typeof h !== 'string') return null;
    const p = 'Bearer ';
    return h.startsWith(p) ? h.slice(p.length).trim() : null;
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = this.bearer(req);
    if (!token) throw new UnauthorizedException('MISSING_BEARER');

    try {
      const payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_ACCESS_SECRET! });
      // attach minimal user
      req.user = {
        id: payload.sub,
        sub: payload.sub,
        typ: payload.typ,      // could be 'admin' | 'superadmin' | 'candidate' | 'employer' | etc
        email: payload.email,
      };
      return true;
    } catch {
      throw new UnauthorizedException('INVALID_TOKEN');
    }
  }
}
