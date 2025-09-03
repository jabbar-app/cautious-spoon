// src/common/interceptors/response-envelope.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { deepSerialize } from '../utils/serialize';
import { isPaginatedShape } from '../types/pagination';
import { randomUUID } from 'crypto';

type AnyData = unknown;

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    const requestId: string =
      (req?.headers?.['x-request-id'] as string) ||
      (req?.id as string) ||
      req?.requestId ||
      randomUUID();

    const apiVersion = process.env.API_VERSION || 'unversioned';

    return next.handle().pipe(
      map((body: AnyData) => {
        let data: AnyData = body;
        let pagination: any = null;

        // If controller returns "paginated shape", extract it into envelope.pagination
        if (isPaginatedShape(body)) {
          const { items, page, perPage, total, totalPages, nextCursor } = body;
          data = items;
          pagination = {
            page,
            perPage,
            total,
            totalPages,
            nextCursor: nextCursor ?? null,
          };
        }

        // Allow controllers to optionally set a human message via res.locals.message
        const message: string = res?.locals?.message || 'OK';

        // Build the standardized envelope
        const envelope = {
          success: true,
          message,
          data: deepSerialize(data),
          error: null as any,
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
            traceId: null as string | null, // wire tracing later if needed
            version: apiVersion,
          },
          pagination,
          links: null as any,
        };

        return envelope;
      }),
    );
  }
}
