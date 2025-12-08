import { Module } from '@nestjs/common';
import { TradingController } from './trading.controller';
import { TradingService } from './trading.service';
import { TradingPortfolioService } from './trading-portfolio.service';
import { TradingMarketService } from './trading-market.service';
import { TradingOrderService } from './trading-order.service';
import { TradingRiskService } from './trading-risk.service';
import { TradingAnalyticsService } from './trading-analytics.service';
import { TradingIntegrationService } from './trading-integration.service';
import { WalletModule } from '../wallets/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';
import { SecurityModule } from '../security/security.module';
import { AuditModule } from '../audit/audit.module';
import { OpenAIModule } from '../openai/openai.module';
import { ChatModule } from '../chat/chat.module';
import { DICModule } from '../dic/dic.module';

@Module({
  imports: [WalletModule, PrismaModule, LedgerModule, SecurityModule, AuditModule, OpenAIModule, ChatModule, DICModule],
  controllers: [TradingController],
  providers: [
    TradingService,
    TradingPortfolioService,
    TradingMarketService,
    TradingOrderService,
    TradingRiskService,
    TradingAnalyticsService,
    TradingIntegrationService,
  ],
  exports: [
    TradingService,
    TradingPortfolioService,
    TradingMarketService,
    TradingOrderService,
    TradingRiskService,
    TradingAnalyticsService,
    TradingIntegrationService,
  ],
})
export class TradingModule {}
