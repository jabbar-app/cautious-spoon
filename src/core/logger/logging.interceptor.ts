import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { LoggerService } from './logger.service';
import { requestContext, initRequestContext } from './request-context';

function isApi(path: string) {
  const csv = process.env.LOG_API_PREFIXES || '/';
  const prefixes = csv.split(',').map((s) => s.trim()).filter(Boolean);
  return prefixes.some((p) => path.startsWith(p));
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const http = ctx.switchToHttp();
    const req = http.getRequest();
    if (!req) return next.handle();

    const path = (req.originalUrl || req.url || '').split('?')[0] || '/';
    if (!isApi(path)) return next.handle();

    const method = req.method;
    const params = req.params ?? {};
    const query = req.query ?? {};
    const ip = req.ip;
    const userAgent = req.get('user-agent') ?? '';
    const requestId = req.requestId ?? req.id ?? undefined;

    const rawBody = { ...(req.body ?? {}) };
    const body = truncateBody(redactSecrets(rawBody), Number(process.env.LOG_BODY_MAX || 5000));

    const store = initRequestContext({ requestId, userId: req.user?.sub ?? null });
    const start = Date.now();

    return requestContext.run(store, () =>
      next.handle().pipe(
        tap({
          next: () => {
            this.logger.write({
              method, path, params, query, body,
              statusCode: (req.res?.statusCode as number) || 200,
              responseTimeMs: Date.now() - start,
              ip, userAgent, userId: store.userId ?? null, requestId,
              prisma: store.prisma,
            });
          },
          error: (err) => {
            this.logger.write({
              method, path, params, query, body,
              statusCode: (err?.status as number) || 500,
              responseTimeMs: Date.now() - start,
              ip, userAgent, userId: store.userId ?? null, requestId,
              error: {
                code: err?.response?.error || err?.name,
                message: err?.message,
                stack: process.env.NODE_ENV === 'development' ? err?.stack : null,
              },
              prisma: store.prisma,
            });
          },
        }),
      ),
    );
  }
}

function redactSecrets(b: any) {
  const copy = { ...b };
  for (const k of Object.keys(copy)) {
    const lower = k.toLowerCase();
    if (['password', 'token', 'refresh_token', 'access_token'].some((s) => lower.includes(s))) {
      copy[k] = '[REDACTED]';
    }
  }
  return copy;
}
function truncateBody(b: any, max: number) {
  try {
    const s = JSON.stringify(b);
    if (s.length <= max) return b;
    return { _truncated: true, preview: s.slice(0, max) + '…' };
  } catch {
    return { _nonSerializable: true };
  }
}
