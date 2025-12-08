import { Module } from '@nestjs/common';
import { ConstructionController } from './construction.controller';
import { ConstructionProjectService } from './construction-project.service';
import { ConstructionResourceService } from './construction-resource.service';
import { WalletModule } from '../wallets/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityModule } from '../security/security.module';
import { AuditModule } from '../audit/audit.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [WalletModule, PrismaModule, SecurityModule, AuditModule, LedgerModule],
  controllers: [ConstructionController],
  providers: [
    ConstructionProjectService,
    ConstructionResourceService,
  ],
  exports: [
    ConstructionProjectService,
    ConstructionResourceService,
  ],
})
export class ConstructionModule {}