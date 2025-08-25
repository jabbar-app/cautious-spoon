import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggerService } from './core/logger/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const cookieParser = require('cookie-parser');
  const logger = app.get(LoggerService);
  // Security
  app.use(helmet());
  app.use(cookieParser());
  app.enableShutdownHooks();

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidUnknownValues: false,
      validationError: { target: false },
    }),
  );

  // Envelope + Errors
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(logger));
  app.useGlobalFilters(new GlobalExceptionFilter(logger));

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
