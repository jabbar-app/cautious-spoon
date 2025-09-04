import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { MailerService } from '../../core/mailer/mailer.service';
import { WebinarsService } from './webinars.service';
import { WebinarsController } from './webinars.controller'; // your existing program-scoped controller (assign/filter)
// import { AdminWebinarsRootController } from './admin-webinars.root.controller'; // new standalone controller

@Module({
  controllers: [WebinarsController],
  providers: [WebinarsService, PrismaService, MailerService],
  exports: [WebinarsService],
})
export class WebinarsModule {}
