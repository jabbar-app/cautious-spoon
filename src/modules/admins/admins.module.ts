import { Module } from '@nestjs/common';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { PrismaModule } from '../../core/database/prisma.module';
import { AuthzModule } from '../../common/authz/authz.module';
import { GuardsModule } from 'src/common/guards/guards.module';
// improt { GuardsModule}
@Module({
  // imports: [PrismaModule, AuthzModule],
  imports: [PrismaModule, GuardsModule],

  controllers: [AdminsController],
  providers: [AdminsService],
})
export class AdminsModule {}
