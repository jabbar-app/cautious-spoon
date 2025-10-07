import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaClient as PrismaLegacyClient } from '@prisma/legacy-client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  [prop: string]: any;
  constructor() {
    super({ log: ['warn', 'error'] });
  }
  async onModuleInit() {
    await this.$connect();
  }
}

export class PrismaLegacyService
  extends PrismaLegacyClient
  implements OnModuleInit
{
  [prop: string]: any;
  constructor() {
    super({ log: ['warn', 'error'] });
  }
  async onModuleInit() {
    await this.$connect();
  }
}
