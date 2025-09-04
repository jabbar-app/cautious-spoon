import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtCandidateGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  private extractBearer(req: any): string | null {
    const auth = req.headers?.authorization;
    if (typeof auth !== 'string') return null;
    const prefix = 'Bearer ';
    return auth.startsWith(prefix) ? auth.slice(prefix.length).trim() : null;
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = this.extractBearer(req);
    if (!token) throw new UnauthorizedException('MISSING_BEARER');

    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET!,
      });

      // Only allow candidate tokens for /me routes
      const typ = payload?.typ;
      if (typ !== 'candidate') {
        throw new ForbiddenException('WRONG_TOKEN_TYPE');
      }

      // Attach user info for downstream usage
      req.user = {
        sub: payload.sub as string,
        id: payload.sub as string,
        typ,
        email: payload.email,
      };

      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('INVALID_TOKEN');
    }
  }
}
