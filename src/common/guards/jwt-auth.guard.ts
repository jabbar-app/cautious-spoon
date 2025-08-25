import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'];
    if (!auth || !String(auth).startsWith('Bearer ')) throw new UnauthorizedException('Missing bearer token');

    const token = String(auth).slice('Bearer '.length);
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
      // attach user
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
