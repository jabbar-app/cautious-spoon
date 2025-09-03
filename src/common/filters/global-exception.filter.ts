// src/common/filters/global-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { deepSerialize } from '../utils/serialize';
import { randomUUID } from 'crypto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const requestId =
      (req?.headers?.['x-request-id'] as string) ||
      (req as any)?.id ||
      (req as any)?.requestId ||
      randomUUID();

    const apiVersion = process.env.API_VERSION || 'unversioned';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let code = 'UNHANDLED_ERROR';
    let details: string | null = null;
    let fields: Record<string, string> | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        message = resp;
      } else if (resp && typeof resp === 'object') {
        const r = resp as any;
        message = r.message ?? message;
        code = r.code ?? code;
        details = r.details ?? null;

        // Class-validator errors (if formatted)
        if (Array.isArray(r.message) && r.message.length && typeof r.message[0] === 'string') {
          details = r.message.join('; ');
        }
        if (r.errors && typeof r.errors === 'object') {
          fields = r.errors as Record<string, string>;
        }
      } else {
        message = exception.message ?? message;
      }

      if (code === 'UNHANDLED_ERROR') {
        // Derive from exception name if useful
        code = exception.name?.replace(/\W+/g, '_').toUpperCase() || code;
      }
    } else if (exception && typeof exception === 'object') {
      const anyErr = exception as any;
      message = anyErr.message ?? message;
      code = (anyErr.code ?? anyErr.name)?.toString()?.replace(/\W+/g, '_').toUpperCase() || code;
      details = anyErr.stack ? (process.env.NODE_ENV === 'production' ? null : anyErr.stack) : null;
    }

    // Never leak stack traces in production responses
    if (process.env.NODE_ENV === 'production') {
      details = null;
    }

    const envelope = {
      success: false,
      message: message || 'Error',
      data: null,
      error: deepSerialize({
        code,
        details,
        fields,
      }),
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        traceId: null,
        version: apiVersion,
      },
      pagination: null,
      links: null,
    };

    res.status(status).json(envelope);
  }
}
