import { Module } from '@nestjs/common'
import { EnhancedEscrowService } from './enhanced-escrow.service'
import { PrismaModule } from '../prisma/prisma.module'
import { LedgerModule } from '../ledger/ledger.module'
import { AuditModule } from '../audit/audit.module'
import { SecurityModule } from '../security/security.module'

@Module({
  imports: [PrismaModule, LedgerModule, AuditModule, SecurityModule],
  providers: [EnhancedEscrowService],
  exports: [EnhancedEscrowService]
})
export class EnhancedEscrowModule {}