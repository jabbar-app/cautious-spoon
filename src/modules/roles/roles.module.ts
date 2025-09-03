import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PrismaModule } from '../../core/database/prisma.module';
import { AuthzModule } from '../../common/authz/authz.module';
import { GuardsModule } from 'src/common/guards/guards.module';

@Module({
  imports: [PrismaModule, GuardsModule],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
