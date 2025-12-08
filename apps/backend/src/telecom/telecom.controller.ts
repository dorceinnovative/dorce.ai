import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common'
import { TransactionStatus } from '@prisma/client'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { TelecomAggregatorService } from './telecom-aggregator.service'
import { TelecomIntentService } from './telecom-intent.service'
import { VTPassService } from './vtpass.service'
import { BillsPayService } from './billspay.service'
import { VTUService } from './vtu.service'
import { ServiceRequest, ServiceResponse, TelecomIntent } from './telecom.types'
import { WalletService } from '../wallets/wallet.service'
import { PrismaService } from '../prisma/prisma.service'

@Controller('telecom')
@UseGuards(JwtAuthGuard)
export class TelecomController {
  private readonly logger = new Logger(TelecomController.name)

  constructor(
    private readonly telecomAggregator: TelecomAggregatorService,
    private readonly telecomIntent: TelecomIntentService,
    private readonly vtPassService: VTPassService,
    private readonly billsPayService: BillsPayService,
    private readonly vtuService: VTUService,
    private readonly walletService: WalletService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * AI-powered telecom service purchase
   * Users can chat naturally: "I need 2GB MTN data for 08012345678"
   */
  @Post('ai-purchase')
  async aiPurchase(
    @Body() body: { message: string; context?: Record<string, any> },
    @Req() req: any,
  ): Promise<ServiceResponse> {
    const userId = req.user.id
    const { message, context } = body

    this.logger.log(`AI telecom purchase request from user ${userId}: "${message}"`)

    try {
      // Step 1: Parse user intent using AI
      const intent: TelecomIntent = await this.telecomIntent.parseTelecomIntent(message, context)
      
      if (intent.needsClarification) {
        return {
          success: false,
          message: intent.clarificationMessage || 'Could you please provide more details?',
          status: 'clarification_needed',
          amount: 0,
          commission: 0,
          timestamp: new Date(),
        }
      }

      // Step 2: Convert intent to service request
      const serviceRequest: ServiceRequest | null = this.telecomIntent.convertIntentToServiceRequest(intent)
      
      if (!serviceRequest) {
        return {
          success: false,
          message: 'Sorry, I couldn\'t understand your request. Please try rephrasing.',
          status: 'invalid_intent',
          amount: 0,
          commission: 0,
          timestamp: new Date(),
        }
      }

      // Step 3: Validate user has sufficient balance
      const userWallet = await this.walletService.getWallet(userId)
      const estimatedCost = serviceRequest.amount // This should be calculated based on service
      
      if (userWallet.balance < estimatedCost) {
        return {
          success: false,
          message: `Insufficient balance. You need ₦${estimatedCost} but have ₦${userWallet.balance}`,
          status: 'insufficient_balance',
          amount: estimatedCost,
          commission: 0,
          timestamp: new Date(),
        }
      }

      // Step 4: Process the telecom service purchase
      const response: ServiceResponse = await this.telecomAggregator.purchaseService(serviceRequest)

      if (response.success) {
        // Step 5: Update user wallet (debit the amount)
        await this.walletService.withdrawFromWallet(userId, {
          amount: estimatedCost,
          description: `Telecom purchase: ${serviceRequest.serviceType} on ${serviceRequest.network}`,
        })

        // Step 6: Create marketplace transaction record
        await this.createTransactionRecord(userId, serviceRequest, response)

        // Step 7: Generate success response
        const successMessage = this.telecomIntent.generateSuccessResponse(intent, response)
        
        return {
          ...response,
          message: successMessage,
        }
      }

      return response

    } catch (error) {
      this.logger.error(`AI purchase failed for user ${userId}:`, error)
      
      return {
        success: false,
        message: 'An error occurred while processing your request. Please try again.',
        status: 'error',
        amount: 0,
        commission: 0,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Direct telecom service purchase (for traditional API usage)
   */
  @Post('purchase')
  async purchase(
    @Body() request: ServiceRequest,
    @Req() req: any,
  ): Promise<ServiceResponse> {
    const userId = req.user.id

    this.logger.log(`Direct telecom purchase from user ${userId}:`, request)

    try {
      // Validate balance
      const userWallet = await this.walletService.getWallet(userId)
      
      if (userWallet.balance < request.amount) {
        return {
          success: false,
          message: `Insufficient balance. You need ₦${request.amount} but have ₦${userWallet.balance}`,
          status: 'insufficient_balance',
          amount: request.amount,
          commission: 0,
          timestamp: new Date(),
        }
      }

      // Process purchase
      const response = await this.telecomAggregator.purchaseService(request)

      if (response.success) {
        // Update wallet
        await this.walletService.withdrawFromWallet(userId, {
          amount: request.amount,
          description: `Telecom purchase: ${request.serviceType} on ${request.network}`,
        })

        // Create transaction record
        await this.createTransactionRecord(userId, request, response)
      }

      return response

    } catch (error) {
      this.logger.error(`Direct purchase failed for user ${userId}:`, error)
      
      return {
        success: false,
        message: 'Failed to process telecom purchase',
        status: 'error',
        amount: 0,
        commission: 0,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Get real-time pricing across all providers
   */
  @Get('pricing')
  async getPricing(
    @Query('serviceType') serviceType: string,
    @Query('network') network: string,
    @Query('amount') amount?: number,
  ) {
    return await this.telecomAggregator.getPricing(serviceType, network, amount)
  }

  /**
   * Check service availability across providers
   */
  @Get('availability')
  async getAvailability(
    @Query('serviceType') serviceType: string,
    @Query('network') network: string,
  ) {
    return await this.telecomAggregator.getAvailability(serviceType, network)
  }

  /**
   * Query transaction status
   */
  @Get('transaction/:transactionId')
  async queryTransaction(
    @Param('transactionId') transactionId: string,
    @Query('provider') provider?: string,
  ) {
    return await this.telecomAggregator.queryTransaction(transactionId, provider)
  }

  /**
   * Verify meter number for electricity
   */
  @Post('verify-meter')
  async verifyMeter(
    @Body() body: { meterNumber: string; provider: string; type: 'prepaid' | 'postpaid' },
  ) {
    const { meterNumber, provider, type } = body
    
    try {
      // Map provider to electricity service ID
      const serviceMap = {
        'ikeja': 'ikeja-electric',
        'eko': 'eko-electric',
        'ibadan': 'ibadan-electric',
        'abuja': 'abuja-electric',
        'ph': 'portharcourt-electric',
        'kano': 'kano-electric',
        'kaduna': 'kaduna-electric',
        'jos': 'jos-electric',
      }

      const serviceId = serviceMap[provider.toLowerCase()] || 'ikeja-electric'
      
      return await this.telecomAggregator.verifyMeter(serviceId, meterNumber, type)
    } catch (error) {
      this.logger.error(`Meter verification failed:`, error)
      throw error
    }
  }

  /**
   * Get provider statistics
   */
  @Get('providers/stats')
  async getProviderStats() {
    return await this.telecomAggregator.getProviderStats()
  }

  /**
   * Get user's telecom transaction history
   */
  @Get('history')
  async getTransactionHistory(
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const userId = req.user.id
    
    return await this.prisma.rechargeTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit || 20,
      skip: offset || 0,
      include: {
        product: true,
      },
    })
  }

  /**
   * Create transaction record in database
   */
  private async createTransactionRecord(
    userId: string,
    request: ServiceRequest,
    response: ServiceResponse,
  ): Promise<void> {
    try {
      await this.prisma.rechargeTransaction.create({
        data: {
          userId,
          productId: 'default-product-id',
          amount: BigInt(request.amount * 100), // Convert to kobo
          phone: request.phone || 'unknown',
          reference: `TEL${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
          status: this.mapServiceResponseToTransactionStatus(response.status) as any,
        },
      })
    } catch (error) {
      this.logger.error('Failed to create transaction record:', error)
      // Don't throw - we don't want to fail the purchase if logging fails
    }
  }

  /**
   * Webhook endpoint for provider notifications
   */
  @Post('webhook/:provider')
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
  ) {
    this.logger.log(`Webhook received from ${provider}:`, payload)
    
    try {
      // Route webhook to appropriate provider service
      switch (provider) {
        case 'vtpass':
          await this.vtPassService.handleWebhook(payload)
          break
        case 'billspay':
          await this.billsPayService.handleWebhook(payload)
          break
        case 'vtu':
          await this.vtuService.handleWebhook(payload)
          break
        default:
          this.logger.warn(`Unknown webhook provider: ${provider}`)
      }
      
      return { status: 'received' }
    } catch (error) {
      this.logger.error(`Webhook processing failed:`, error)
      throw error
    }
  }

  /**
   * Map service response status to transaction status
   */
  private mapServiceResponseToTransactionStatus(status: string): TransactionStatus {
    const statusMap: Record<string, TransactionStatus> = {
      'success': TransactionStatus.SUCCESS,
      'failed': TransactionStatus.FAILED,
      'pending': TransactionStatus.PENDING,
      'processing': TransactionStatus.PROCESSING,
      'error': TransactionStatus.FAILED,
      'clarification_needed': TransactionStatus.PENDING,
      'invalid_intent': TransactionStatus.FAILED,
      'insufficient_balance': TransactionStatus.FAILED,
    }
    return statusMap[status] || TransactionStatus.PENDING
  }
}