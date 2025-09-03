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
import { SecurityModule } from './core/security';
import { CoreJwtModule } from './core/jwt/jwt.module';
import { CdnModule } from './modules/cdn/cdn.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
@Module({
  imports: [
    ConfigModule,
    CoreJwtModule,
    PrismaModule,
    LoggerModule,
    MailerModule,
    AuthModule,
    // SecurityModule,
    RolesModule,
    PermissionsModule,
    AdminsModule,
    CdnModule,
    CandidatesModule
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
