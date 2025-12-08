import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
