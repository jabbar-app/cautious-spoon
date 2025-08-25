import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get accessSecret(): string {
    return process.env.JWT_ACCESS_SECRET!;
  }
  get refreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET!;
  }
  get accessTtl(): string {
    return process.env.JWT_ACCESS_TTL || '15m';
  }
  get refreshTtl(): string {
    return process.env.JWT_REFRESH_TTL || '7d';
  }
  get cookieDomain(): string {
    return process.env.COOKIE_DOMAIN || 'localhost';
  }
  get mongoUri(): string {
    return process.env.MONGODB_URI || 'mongodb://localhost:27017';
  }
  get mongoDb(): string {
    return process.env.MONGODB_DB || 'nest_logs';
  }
  get bcryptRounds(): number {
    return Number(process.env.BCRYPT_SALT_ROUNDS || 12);
  }
}
