import { Module } from '@nestjs/common';
import { JwtAdminGuard } from './jwt-admin.guard';
import { PermissionsGuard } from './permissions.guard';
import { PrismaModule } from '../../core/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [JwtAdminGuard, PermissionsGuard],
  exports: [JwtAdminGuard, PermissionsGuard],
})
export class GuardsModule {}
