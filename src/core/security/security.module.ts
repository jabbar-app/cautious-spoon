import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: cfg.get<string>('JWT_ACCESS_TTL') ?? '15m',
        },
      }),
    }),
  ],
  providers: [JwtAdminGuard, PermissionsGuard],
  exports: [JwtModule, JwtAdminGuard, PermissionsGuard],
})
export class SecurityModule {}
