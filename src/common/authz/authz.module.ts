import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';
import { PermissionsGuard } from '../guards/permissions.guard';

@Module({
  imports: [JwtModule.register({})],
  providers: [JwtAdminGuard, PermissionsGuard],
  exports: [JwtAdminGuard, PermissionsGuard],
})
export class AuthzModule {}
