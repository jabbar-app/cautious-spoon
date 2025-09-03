import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_ACCESS_SECRET')!,          // required
        signOptions: {
          expiresIn: cfg.get<string>('JWT_ACCESS_TTL') ?? '15m' // optional
        },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class CoreJwtModule {}