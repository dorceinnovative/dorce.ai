import { Module } from '@nestjs/common'
import { AdsController } from './ads.controller'
import { AdsService } from './ads.service'
import { PrismaModule } from '../prisma/prisma.module'
import { NotificationModule } from '../notification/notification.module'
import { TelecomModule } from '../telecom/telecom.module'
import { WalletModule } from '../wallets/wallet.module'
import { NeuralCoreModule } from '../neural-core/neural-core.module'

@Module({
  imports: [PrismaModule, NotificationModule, TelecomModule, WalletModule, NeuralCoreModule],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService]
})
export class AdsModule {}
