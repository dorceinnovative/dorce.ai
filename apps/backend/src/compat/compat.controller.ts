import { Controller, Get, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common'
import type { Request as ExpressRequest } from 'express'
import { AuthGuard } from '@nestjs/passport'
import { WalletService } from '../wallets/wallet.service'

@Controller('api')
export class CompatController {
  constructor(private readonly walletService: WalletService) {}

  @Get('wallet')
  @UseGuards(AuthGuard('jwt'))
  async getWalletCompat(@Req() req: ExpressRequest) {
    const userId = (req as any).user?.id
    const wallet = await this.walletService.getWallet(userId)
    return {
      balance: Number(wallet.balance || 0),
      currency: 'NGN',
      accountId: wallet.id,
    }
  }

  @Get('transactions')
  @UseGuards(AuthGuard('jwt'))
  async getTransactionsCompat(@Req() req: ExpressRequest) {
    const userId = (req as any).user?.id
    const data = await this.walletService.getTransactions(userId, { take: 20, skip: 0 } as any)
    return { transactions: data.transactions, total: data.total }
  }

  @Post('wallet/fund')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async fundWalletCompat(@Req() req: ExpressRequest, @Body() body: any) {
    const userId = (req as any).user?.id
    const amount = Number(body?.amount || body?.customAmount || 0)
    return this.walletService.topupWallet(userId, { amount, paymentMethod: body?.paymentMethod } as any)
  }

  @Post('wallet/withdraw')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async withdrawWalletCompat(@Req() req: ExpressRequest, @Body() body: any) {
    const userId = (req as any).user?.id
    const amount = Number(body?.amount || 0)
    return this.walletService.withdrawFromWallet(userId, { amount, description: body?.description } as any)
  }

  @Post('wallet/transfer')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async transferCompat(@Req() req: ExpressRequest, @Body() body: any) {
    const userId = (req as any).user?.id
    return this.walletService.transferMoney(userId, { recipientId: body?.to, amount: Number(body?.amount || 0), description: body?.note } as any)
  }
}

