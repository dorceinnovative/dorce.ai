import { Module } from '@nestjs/common';
import { InvestmentController } from './investment.controller';
import { InvestmentService } from './investment.service';
import { InvestmentPortfolioService } from './investment-portfolio.service';

import { InvestmentRiskService } from './investment-risk.service';
import { InvestmentRecommendationService } from './investment-recommendation.service';
import { InvestmentMarketService } from './investment-market.service';
import { WalletModule } from '../wallets/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityModule } from '../security/security.module';
import { AuditModule } from '../audit/audit.module';
import { OpenAIModule } from '../openai/openai.module';
import { ChatModule } from '../chat/chat.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [WalletModule, PrismaModule, SecurityModule, AuditModule, OpenAIModule, ChatModule, LedgerModule],
  controllers: [InvestmentController],
  providers: [
    InvestmentService,
    InvestmentPortfolioService,
    InvestmentRiskService,
    InvestmentRecommendationService,
    InvestmentMarketService,
  ],
  exports: [
    InvestmentService,
    InvestmentPortfolioService,
    InvestmentRiskService,
    InvestmentRecommendationService,
    InvestmentMarketService,
  ],
})
export class InvestmentModule {}
