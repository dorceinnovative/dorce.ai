import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { VTPassService } from './vtpass.service'
import { BillsPayService } from './billspay.service'
import { VTUService } from './vtu.service'
import { TelecomAggregatorService } from './telecom-aggregator.service'
import { TelecomIntentService } from './telecom-intent.service'
import { TelecomController } from './telecom.controller'
import { OpenAIModule } from '../openai/openai.module'
import { WalletModule } from '../wallets/wallet.module'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [HttpModule, OpenAIModule, WalletModule, PrismaModule],
  controllers: [TelecomController],
  providers: [
    VTPassService,
    BillsPayService,
    VTUService,
    TelecomAggregatorService,
    TelecomIntentService,
  ],
  exports: [TelecomAggregatorService, TelecomIntentService],
})
export class TelecomModule {}
