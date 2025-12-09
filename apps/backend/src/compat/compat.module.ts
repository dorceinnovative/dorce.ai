import { Module } from '@nestjs/common'
import { CompatController } from './compat.controller'
import { WalletModule } from '../wallets/wallet.module'

@Module({
  imports: [WalletModule],
  controllers: [CompatController],
})
export class CompatModule {}

