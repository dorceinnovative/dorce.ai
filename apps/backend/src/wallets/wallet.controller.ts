import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus, Req } from "@nestjs/common"
import type { Request as ExpressRequest } from "express"
import { AuthGuard } from "@nestjs/passport"
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { WalletService } from "./wallet.service"
import {
  CreateWalletDto,
  TopupWalletDto,
  WithdrawWalletDto,
  TransferMoneyDto,
  TransactionFilterDto,
} from "./dto/create-wallet.dto"

@ApiTags("wallets")
@Controller("api/wallets")
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a wallet for the current user' })
  @ApiResponse({ status: 201, description: 'Wallet created successfully' })
  @HttpCode(HttpStatus.CREATED)
  async createWallet(@Body() dto: CreateWalletDto, @Req() req: ExpressRequest) {
    const userId = (req as any).user?.id
    return this.walletService.createWallet(userId, dto)
  }

  @Get()
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user wallet" })
  @ApiResponse({ status: 200, description: "Wallet retrieved successfully" })
  async getWallet(@Req() req: ExpressRequest) {
    const userId = (req as any).user?.id
    return this.walletService.getWallet(userId)
  }

  @Get("balance")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user wallet balance" })
  @ApiResponse({ status: 200, description: "Balance retrieved successfully" })
  async getBalance(@Req() req: ExpressRequest) {
    const userId = (req as any).user?.id
    return this.walletService.getWalletBalance(userId)
  }

  @Post('topup')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Topup wallet' })
  @ApiResponse({ status: 200, description: 'Wallet topped up successfully' })
  @HttpCode(HttpStatus.OK)
  async topupWallet(@Body() dto: TopupWalletDto, @Req() req: ExpressRequest) {
    const userId = (req as any).user?.id
    return this.walletService.topupWallet(userId, dto)
  }

  @Post('withdraw')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw from wallet' })
  @ApiResponse({ status: 200, description: 'Withdrawal successful' })
  @HttpCode(HttpStatus.OK)
  async withdraw(@Body() dto: WithdrawWalletDto, @Req() req: ExpressRequest) {
    const userId = (req as any).user?.id
    return this.walletService.withdrawFromWallet(userId, dto)
  }

  @Post('transfer')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transfer money to another user' })
  @ApiResponse({ status: 200, description: 'Transfer successful' })
  @HttpCode(HttpStatus.OK)
  async transfer(@Body() dto: TransferMoneyDto, @Req() req: ExpressRequest) {
    const userId = (req as any).user?.id
    return this.walletService.transferMoney(userId, dto)
  }

  @Get('transactions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wallet transactions' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getTransactions(@Body() dto: TransactionFilterDto, @Req() req: ExpressRequest) {
    const userId = (req as any).user?.id
    return this.walletService.getTransactions(userId, dto)
  }

  @Get("transfers/sent")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get sent transfers" })
  @ApiResponse({ status: 200, description: "Sent transfers retrieved successfully" })
  async getSentTransfers(@Req() req: ExpressRequest) {
    const userId = (req as any).user?.id
    return this.walletService.getSentTransfers(userId)
  }

  @Get("transfers/received")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get received transfers" })
  @ApiResponse({ status: 200, description: "Received transfers retrieved successfully" })
  async getReceivedTransfers(@Req() req: ExpressRequest) {
    const userId = (req as any).user?.id
    return this.walletService.getReceivedTransfers(userId)
  }
}
