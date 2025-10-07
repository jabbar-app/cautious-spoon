import { Global, Module } from '@nestjs/common';
import { PrismaService, PrismaLegacyService } from './prisma.service';

@Global()
@Module({
  // providers: [PrismaService],
  // exports: [PrismaService],

  providers: [PrismaService, PrismaLegacyService],
  exports: [PrismaService, PrismaLegacyService],
})
export class PrismaModule {}

// src/core/database/database.module.ts

// import { Module } from '@nestjs/common';
// import { PrismaAppClient } from './prisma-app.clients';
// import { PrismaLegacyClient } from './prisma-legacy.client';

// @Module({
//   providers: [PrismaAppClient, PrismaLegacyClient],
//   exports: [PrismaAppClient, PrismaLegacyClient],
// })
// export class PrismaModule {}
