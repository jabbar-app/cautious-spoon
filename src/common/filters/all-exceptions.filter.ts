import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal Server Error';

    const details =
      exception instanceof HttpException
        ? (exception.getResponse() as any)?.message ?? null
        : null;

    const payload = {
      success: false,
      message,
      data: null,
      error: {
        code: this.codeFromStatus(status),
        details: Array.isArray(details) ? details.join(', ') : details,
        fields: null,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request?.headers?.['x-request-id'] ?? null,
        traceId: null,
        version: 'unversioned',
      },
      pagination: null,
      links: null,
    };

    response.status(status).json(payload);
  }

  private codeFromStatus(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
