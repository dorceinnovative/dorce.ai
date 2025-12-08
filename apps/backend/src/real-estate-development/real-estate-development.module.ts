import { Module } from '@nestjs/common';
import { RealEstateDevelopmentController } from './real-estate-development.controller';
import { RealEstateDevelopmentService } from './real-estate-development.service';
import { WalletModule } from '../wallets/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';
import { SecurityModule } from '../security/security.module';
import { AuditModule } from '../audit/audit.module';
import { OpenAIModule } from '../openai/openai.module';
import { ChatModule } from '../chat/chat.module';
import { DICModule } from '../dic/dic.module';

import { ProjectPlanningService } from './services/project-planning.service';
import { LandAcquisitionService } from './services/land-acquisition.service';
import { DevelopmentFinanceService } from './services/development-finance.service';
import { ConstructionCoordinationService } from './services/construction-coordination.service';
import { SalesMarketingService } from './services/sales-marketing.service';
import { RegulatoryComplianceService } from './services/regulatory-compliance.service';
import { EnvironmentalAssessmentService } from './services/environmental-assessment.service';
import { InfrastructurePlanningService } from './services/infrastructure-planning.service';
import { CommunityDevelopmentService } from './services/community-development.service';

@Module({
  imports: [WalletModule, PrismaModule, LedgerModule, SecurityModule, AuditModule, OpenAIModule, ChatModule, DICModule],
  controllers: [RealEstateDevelopmentController],
  providers: [
    RealEstateDevelopmentService,
    ProjectPlanningService,
    LandAcquisitionService,
    DevelopmentFinanceService,
    ConstructionCoordinationService,
    SalesMarketingService,
    RegulatoryComplianceService,
    EnvironmentalAssessmentService,
    InfrastructurePlanningService,
    CommunityDevelopmentService,
  ],
  exports: [
    RealEstateDevelopmentService,
    ProjectPlanningService,
    LandAcquisitionService,
    DevelopmentFinanceService,
    ConstructionCoordinationService,
    SalesMarketingService,
    RegulatoryComplianceService,
    EnvironmentalAssessmentService,
    InfrastructurePlanningService,
    CommunityDevelopmentService,
  ],
})
export class RealEstateDevelopmentModule {}
