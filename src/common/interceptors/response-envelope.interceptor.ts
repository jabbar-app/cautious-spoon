import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const request = ctx.switchToHttp().getRequest();
    const requestId = request?.headers['x-request-id'] || randomUUID();

    return next.handle().pipe(
      map((data) => {
        // If controller returned a shaped envelope, pass through
        if (data && data.success !== undefined && data.meta) return data;

        return {
          success: true,
          message: 'OK',
          data,
          error: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
            traceId: null,
            version: 'unversioned',
          },
          pagination: null,
          links: null,
        };
      }),
    );
  }
}
