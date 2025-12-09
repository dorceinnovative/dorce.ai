import { Module, forwardRef } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"
import { BullModule } from "@nestjs/bull"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { HttpModule } from "@nestjs/axios"
import { PrismaModule } from "./prisma/prisma.module"
import { AuthModule } from "./auth/auth.module"
import { NinModule } from "./nin/nin.module"
import { UsersModule } from "./users/users.module"
import { WalletModule } from "./wallets/wallet.module"
import { TelecomModule } from "./telecom/telecom.module"
import { ChatModule } from "./chat/chat.module"
import { MarketplaceModule } from "./marketplace/marketplace.module"
import { FraudModule } from "./fraud/fraud.module"
import { NotificationModule } from "./notification/notification.module"
import { PaymentModule } from "./payment/payment.module"
import { LoanModule } from "./loan/loan.module"
import { CACModule } from "./cac/cac.module"
import { HealthController } from "./health/health.controller"
import { DICModule } from "./dic/dic.module"
import { TradingModule } from "./trading/trading.module"
import { ConstructionModule } from "./construction/construction.module"
import { InvestmentModule } from "./investment/investment.module"
import { PropertyManagementModule } from "./property-management/property-management.module"
import { RealEstateDevelopmentModule } from "./real-estate-development/real-estate-development.module"
import { SupabaseModule } from "./supabase/supabase.module"
import { OpenRouterModule } from "./openrouter/openrouter.module"
import { OpenAIModule } from "./openai/openai.module"
import { UpstashModule } from "./upstash/upstash.module"
import { IntegrationModule } from "./integration/integration.module"
import { OSModule } from "./os/os.module"
import { AuditModule } from "./audit/audit.module"
import { SecurityModule } from "./security/security.module"
import { NeuralCoreModule } from "./neural-core/neural-core.module"
import { AdsModule } from "./ads/ads.module"
import { CompatModule } from "./compat/compat.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    BullModule.forRoot({
      redis:
        (process.env.REDIS_URL as string) || {
          host: process.env.REDIS_HOST || "localhost",
          port: Number.parseInt(process.env.REDIS_PORT || "6379"),
          password: process.env.REDIS_PASSWORD,
        },
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 100,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    PrismaModule,
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "development-secret-key-change-in-production",
      signOptions: { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? process.env.JWT_EXPIRES_IN ?? "15m") as any },
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    AuthModule,
    UsersModule,
    WalletModule,
    TelecomModule,
    ChatModule,
    MarketplaceModule,
    FraudModule,
    NotificationModule,
    PaymentModule,
    LoanModule,
    CACModule,
    NinModule,
    DICModule,
    TradingModule,
    ConstructionModule,
    InvestmentModule,
    PropertyManagementModule,
    RealEstateDevelopmentModule,
    SupabaseModule,
    OpenRouterModule,
    OpenAIModule,
    UpstashModule,
    IntegrationModule,
    AuditModule,
    SecurityModule,
    NeuralCoreModule,
    AdsModule,
    CompatModule,
    forwardRef(() => OSModule),
  ],
  controllers: [HealthController],
})
export class AppModule {}
