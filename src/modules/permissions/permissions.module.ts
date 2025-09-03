import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PrismaModule } from '../../core/database/prisma.module';
import { AuthzModule } from '../../common/authz/authz.module';
import { GuardsModule } from 'src/common/guards/guards.module';

@Module({
  imports: [PrismaModule, AuthzModule, GuardsModule],
  controllers: [PermissionsController],
  providers: [PermissionsService],
})
export class PermissionsModule {}
