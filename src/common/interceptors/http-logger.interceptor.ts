import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { randomUUID } from 'node:crypto';
import { LoggerService } from '../../core/logger/logger.service';

function shouldLogPath(path: string) {
  // Log only real API routes. Skip health/docs/static, etc.
  const skip = [
    /^\/?$/,                    // root
    /^\/docs/i,                 // swagger-ui
    /^\/swagger/i,
    /^\/api-docs/i,
    /^\/health/i,
    /^\/metrics/i,
    /^\/favicon\.ico$/i,
    /^\/assets\//i,
  ];
  return !skip.some((re) => re.test(path));
}

function redactBody(body: any) {
  if (!body || typeof body !== 'object') return body;
  const clone: any = Array.isArray(body) ? [...body] : { ...body };
  const redactKeys = [
    'password',
    'password_confirmation',
    'refresh_token',
    'token',
    'accessToken',
    'refreshToken',
  ];
  for (const k of Object.keys(clone)) {
    if (redactKeys.includes(k)) clone[k] = '[REDACTED]';
  }
  return clone;
}

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    if (ctx.getType() !== 'http') {
      return next.handle(); // only log HTTP
    }

    const http = ctx.switchToHttp();
    const req = http.getRequest<Request & { id?: string; user?: any }>();
    const res = http.getResponse<any>();

    // request id
    const requestId = req.id ?? randomUUID();
    (req as any).id = requestId;

    const start = Date.now();
    const method = (req as any).method || 'GET';
    const path = (req as any).originalUrl || (req as any).url || '';

    const ip =
      (req as any).headers?.['x-forwarded-for'] ||
      (req as any).socket?.remoteAddress ||
      undefined;

    const userAgent = (req as any).headers?.['user-agent'];
    const userId =
      (req as any).user?.id ||
      (req as any).user?.sub ||
      null;

    const params = (req as any).params ?? {};
    const query = (req as any).query ?? {};
    const body = redactBody((req as any).body ?? {});

    const logThisCall = shouldLogPath(path);

    return next.handle().pipe(
      tap(async (data) => {
        const statusCode = res.statusCode ?? 200;
        const responseTimeMs = Date.now() - start;

        // console mirror (always print one line)
        // enable/disable with ENV LOG_HTTP_CONSOLE=true|false (default true)
        const consoleOn = (process.env.LOG_HTTP_CONSOLE ?? 'true').toLowerCase() === 'true';
        if (consoleOn) {
          // Keep it succinct
          // Example: [HTTP] 201 POST /auth/candidate/register -> OK (123ms) req=abc-uuid user=cand_123
          const ok = statusCode < 400 ? 'OK' : `ERR ${statusCode}`;
          // eslint-disable-next-line no-console
          console.log(
            `[HTTP] ${statusCode} ${method} ${path} -> ${ok} (${responseTimeMs}ms)` +
              ` req=${requestId}` +
              (userId ? ` user=${userId}` : ''),
          );
        }

        // write to Mongo (only for API calls)
        if (logThisCall) {
          await this.logger.write({
            method,
            path,
            params,
            query,
            body,
            statusCode,
            responseTimeMs,
            ip,
            userAgent,
            userId,
            requestId,
          });
        }
      }),
      catchError((err) => {
        const statusCode = res.statusCode ?? (err?.getStatus?.() ?? 500);
        const responseTimeMs = Date.now() - start;

        const consoleOn = (process.env.LOG_HTTP_CONSOLE ?? 'true').toLowerCase() === 'true';
        if (consoleOn) {
          // eslint-disable-next-line no-console
          console.error(
            `[HTTP] ${statusCode} ${method} ${path} -> ERROR (${responseTimeMs}ms)` +
              ` req=${requestId}` +
              (userId ? ` user=${userId}` : ''),
          );
          const printStack = (process.env.LOG_ERRORS_CONSOLE ?? 'true').toLowerCase() === 'true';
          if (printStack && err?.stack) {
            // eslint-disable-next-line no-console
            console.error(err.stack);
          }
        }

        if (logThisCall) {
          this.logger.write({
            method,
            path,
            params,
            query,
            body,
            statusCode,
            responseTimeMs,
            ip,
            userAgent,
            userId,
            requestId,
            error: {
              code: err?.response?.error?.code || err?.code || 'ERR',
              message: err?.message,
              stack:
                (process.env.LOG_STORE_STACK ?? 'false').toLowerCase() === 'true'
                  ? err?.stack ?? null
                  : null,
            },
          }).catch(() => void 0);
        }

        return throwError(() => err);
      }),
    );
  }
}
