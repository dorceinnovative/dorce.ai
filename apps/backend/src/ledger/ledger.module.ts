import { Module } from '@nestjs/common'
import { LedgerService } from './ledger.service'
import { PrismaModule } from '../prisma/prisma.module'
import { AuditModule } from '../audit/audit.module'
import { SecurityModule } from '../security/security.module'

@Module({
  imports: [PrismaModule, AuditModule, SecurityModule],
  providers: [LedgerService],
  exports: [LedgerService]
})
export class LedgerModule {}