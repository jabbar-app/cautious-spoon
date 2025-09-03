import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { LoggerService } from './core/logger/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ZodValidationPipe } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const cookieParser = require('cookie-parser');
  const logger = app.get(LoggerService);

  // Security
  app.use(helmet());
  app.use(cookieParser());
  app.enableShutdownHooks();

  // Validation: Zod first (for new DTOs), then class-validator (for legacy DTOs)
  app.useGlobalPipes(
    new ZodValidationPipe(),
    // new ValidationPipe({
    //   whitelist: true,
    //   transform: true,
    //   transformOptions: { enableImplicitConversion: true },
    //   forbidUnknownValues: false,
    //   validationError: { target: false },
    // }),
  );

  // Interceptors: logging outermost → envelope last
  app.useGlobalInterceptors(
    new LoggingInterceptor(logger),
    new ResponseEnvelopeInterceptor(),
  );

  // Exceptions → standardized envelope
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Basic CORS for dev
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  logger.warn('App starting...');
  await app.listen(port);
  logger.log(`Server listening on :${port}`);
}
bootstrap();
