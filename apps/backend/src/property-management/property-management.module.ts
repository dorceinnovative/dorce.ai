import { Module } from '@nestjs/common';
import { PropertyManagementController } from './property-management.controller';
import { PropertyManagementService } from './property-management.service';
import { PropertyTenantService } from './property-tenant.service';
import { PropertyLeaseService } from './property-lease.service';
import { PropertyMaintenanceService } from './property-maintenance.service';
import { PropertyAnalyticsService } from './property-analytics.service';
import { PropertyFinancialService } from './property-financial.service';
import { WalletModule } from '../wallets/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';
import { SecurityModule } from '../security/security.module';
import { AuditModule } from '../audit/audit.module';
import { OpenAIModule } from '../openai/openai.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [WalletModule, PrismaModule, LedgerModule, SecurityModule, AuditModule, OpenAIModule, ChatModule],
  controllers: [PropertyManagementController],
  providers: [
    PropertyManagementService,
    PropertyTenantService,
    PropertyLeaseService,
    PropertyMaintenanceService,
    PropertyAnalyticsService,
    PropertyFinancialService,
  ],
  exports: [
    PropertyManagementService,
    PropertyTenantService,
    PropertyLeaseService,
    PropertyMaintenanceService,
    PropertyAnalyticsService,
    PropertyFinancialService,
  ],
})
export class PropertyManagementModule {}