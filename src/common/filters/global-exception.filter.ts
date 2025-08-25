import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { LoggerService } from '../../core/logger/logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const now = new Date().toISOString();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let details = 'Internal Server Error';

    // Extract message & code safely
    if (exception instanceof HttpException) {
      status = exception.getStatus?.() ?? status;
      const body = exception.getResponse?.();
      if (typeof body === 'string') {
        details = body;
      } else if (body && typeof body === 'object') {
        // common Nest shapes: { message: string | string[], error?: string, code?: string }
        const anyBody = body as any;
        const msg = Array.isArray(anyBody.message)
          ? anyBody.message.join(', ')
          : anyBody.message || anyBody.error;
        if (msg) details = msg;
        if (anyBody.code && typeof anyBody.code === 'string') code = anyBody.code;
      }
    } else if (exception && typeof exception === 'object') {
      const err = exception as any;
      if (typeof err.status === 'number') status = err.status;
      if (typeof err.code === 'string') code = err.code;
      if (typeof err.message === 'string') details = err.message;
    }

    // Ensure we have a request id
    let requestId = (req.headers['x-request-id'] as string) || undefined;
    if (!requestId) {
      requestId = randomUUID();
      res.setHeader('x-request-id', requestId);
    }

    // Console log with stack if present
    const method = req.method;
    const url = (req as any).originalUrl || req.url;
    const stack =
      (exception as any)?.stack && typeof (exception as any).stack === 'string'
        ? (exception as any).stack
        : undefined;

    this.logger.error(
      `[EXC] ${status} ${method} ${url} reqId=${requestId} code=${code} msg=${details}`,
      stack,
    );

    // Standardized envelope
    const payload = {
      success: false,
      message: HttpStatus[status] || 'Error',
      data: null,
      error: {
        code,
        details,
        fields: null,
      },
      meta: {
        timestamp: now,
        requestId,
        traceId: null,
        version: 'unversioned',
      },
      pagination: null,
      links: null,
    };

    res.status(status).json(payload);
  }
}
