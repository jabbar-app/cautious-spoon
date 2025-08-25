import { Module } from '@nestjs/common';
import { ConfigModule } from './core/config/config.module';
import { PrismaModule } from './core/database/prisma.module';
import { LoggerModule } from './core/logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { AdminsModule } from './modules/admins/admins.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './core/logger/logging.interceptor';
import { MailerModule } from './core/mailer/mailer.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    LoggerModule,
    MailerModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
    AdminsModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
