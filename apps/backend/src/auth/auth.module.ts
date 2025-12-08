import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UsersModule } from "../users/users.module";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtSecretService } from "./jwt-secret.service";
import { BiometricAuthService } from "./biometric-auth.service";
import { TwoFactorAuthService } from "./two-factor-auth.service";
import { SessionService } from "./session.service";
import { RateLimitService } from "./rate-limit.service";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { 
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        issuer: 'dorce.ai',
        audience: 'dorce.ai-users'
      },
    }),
    UsersModule,
    PrismaModule,
    NotificationModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy, 
    JwtSecretService,
    BiometricAuthService,
    TwoFactorAuthService,
    SessionService,
    RateLimitService
  ],
  exports: [
    AuthService, 
    JwtSecretService,
    BiometricAuthService,
    TwoFactorAuthService,
    SessionService,
    RateLimitService
  ],
})
export class AuthModule {}
