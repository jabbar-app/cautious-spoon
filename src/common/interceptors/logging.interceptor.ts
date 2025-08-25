import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoggerService } from '../../core/logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const http = ctx.switchToHttp();
    const req = http.getRequest<Request & { user?: any }>();
    const res = http.getResponse<Response>();

    if (!req || !res) {
      // Not an HTTP context (e.g., ws), skip.
      return next.handle();
    }

    const start = process.hrtime.bigint();
    const method = req.method;
    const url = req.originalUrl || req.url;

    let requestId = (req.headers['x-request-id'] as string) || undefined;
    if (!requestId) {
      requestId = randomUUID();
      res.setHeader('x-request-id', requestId);
    }

    const userId = (req.user?.sub as string) ?? '-';

    this.logger.log(`[REQ] ${method} ${url} reqId=${requestId} user=${userId}`);

    return next.handle().pipe(
      tap(() => {
        const durMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
        const status = res.statusCode;
        this.logger.log(
          `[RES] ${status} ${method} ${url} ${durMs}ms reqId=${requestId} user=${userId}`,
        );
      }),
      catchError((err) => {
        const durMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
        const status = (err?.status as number) || 500; // <= don't reuse res.statusCode here
        const msg = (err?.message as string) || 'Unknown error';
        this.logger.error(
            `[ERR] ${status} ${method} ${url} ${durMs}ms reqId=${requestId} msg=${msg}`,
            err?.stack,
        );
        return throwError(() => err);
      }),
    );
  }
}
