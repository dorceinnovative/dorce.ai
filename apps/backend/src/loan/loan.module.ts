import { Module } from '@nestjs/common';
import { LoanController } from './loan.controller';
import { LoanService } from '../services/loan.service';
import { AIScoringService } from '../services/ai-scoring.service';
import { BankStatementIntegrationService } from '../services/bank-statement-integration.service';
import { PaymentIntegrationService } from '../services/payment-integration.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, HttpModule, NotificationModule],
  controllers: [LoanController],
  providers: [
    LoanService,
    AIScoringService,
    BankStatementIntegrationService,
    PaymentIntegrationService,
  ],
  exports: [
    LoanService,
  ],
})
export class LoanModule {}
