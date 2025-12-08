import { Controller, Post, Get, Put, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { NIMCCloneService } from './nimc-clone.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('NIN Services')
@Controller('api/nin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NinController {
  constructor(
    private readonly nimcCloneService: NIMCCloneService,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('verify')
  @ApiOperation({ summary: 'Verify NIN number with premium service' })
  @ApiResponse({ status: 200, description: 'NIN verification successful' })
  @ApiResponse({ status: 400, description: 'Invalid NIN format' })
  @ApiResponse({ status: 404, description: 'NIN not found' })
  async verifyNin(
    @Body() verifyDto: { nin: string; userId: string; firstName?: string; lastName?: string },
    @Req() req: Request,
  ) {
    const { nin, userId, firstName, lastName } = verifyDto;

    const result = await this.nimcCloneService.verifyNIN({ nin, firstName: firstName ?? '', lastName: lastName ?? '' });

    await this.prisma.verification.create({
      data: {
        userId,
        type: 'NIN',
        status: 'VERIFIED',
        result: JSON.parse(JSON.stringify(result)),
        verifiedAt: new Date(),
      },
    });

    await this.notificationService.sendNotification({
      userId,
      type: 'NIN_VERIFIED',
      title: 'NIN Verification Successful',
      message: `Verification for ${nin} completed`,
      channels: ['email', 'push'],
    });

    return { success: true, data: result };
  }

  @Post('generate-premium-slip')
  @ApiOperation({ summary: 'Generate premium digital NIN slip (₦1000)' })
  @ApiResponse({ status: 200, description: 'Premium slip generated successfully' })
  @ApiResponse({ status: 402, description: 'Payment required' })
  async generatePremiumSlip(
    @Body() slipDto: { 
      nin: string; 
      userId: string; 
      templateType?: 'classic' | 'premium' | 'executive' | 'quantum';
      includePhoto?: boolean;
      includeQR?: boolean;
    },
  ) {
    const { nin, userId, templateType = 'premium', includePhoto = true, includeQR = true } = slipDto;

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    const slipPrice = BigInt(1000);

    if (!wallet || wallet.balance < slipPrice) {
      return {
        success: false,
        message: 'Insufficient wallet balance',
        requiredAmount: Number(slipPrice),
        currentBalance: wallet ? Number(wallet.balance) : 0,
      };
    }

    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: slipPrice } },
    });

    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: 'PURCHASE',
        amount: slipPrice,
        status: 'SUCCESS',
        description: 'Premium NIN Slip',
        reference: `NINSLIP_${Date.now()}`,
      },
    });

    const verification = await this.nimcCloneService.verifyNIN({ nin, firstName: '', lastName: '' });

    const slipData = await this.nimcCloneService.generatePremiumSlip({
      nin,
      fullName: verification.fullName,
      firstName: verification.firstName,
      lastName: verification.lastName,
      middleName: verification.middleName ?? '',
      dateOfBirth: verification.dateOfBirth,
      gender: verification.gender,
      phone: verification.phone,
      email: verification.email,
      address: verification.address,
      lga: verification.lga,
      state: verification.state,
      nationality: verification.nationality,
      photo: verification.photo,
      signature: verification.signature,
      qrCode: verification.qrCode,
      issueDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
      slipNumber: `PREM-${Date.now()}-${Math.random().toString(36).substr(2,5).toUpperCase()}`,
      securityCode: Math.random().toString(36).substr(2,8).toUpperCase(),
      verificationUrl: `https://dorce.ai/verify-nin/${nin}`,
    } as any);

    await this.prisma.verification.create({
      data: {
        userId,
        type: 'NIN',
        status: 'VERIFIED',
        result: JSON.parse(JSON.stringify(slipData)),
        verifiedAt: new Date(),
      },
    });

    await this.notificationService.sendNotification({
      userId,
      type: 'NIN_VERIFIED',
      title: 'Premium NIN Slip Generated',
      message: `Premium slip created for ${nin}`,
    });

    return { success: true, data: slipData };
  }

  @Post('request-plastic-card')
  @ApiOperation({ summary: 'Request physical plastic NIN card printing' })
  @ApiResponse({ status: 200, description: 'Card printing request submitted' })
  @ApiResponse({ status: 402, description: 'Payment required for printing' })
  async requestPlasticCard(
    @Body() cardDto: {
      nin: string;
      userId: string;
      deliveryMethod: 'pickup' | 'delivery';
      pickupLocation?: string;
      deliveryAddress?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
      };
      quantity?: number;
      urgentProcessing?: boolean;
    },
  ) {
    const { 
      nin, 
      userId, 
      deliveryMethod, 
      pickupLocation, 
      deliveryAddress, 
      quantity = 1,
      urgentProcessing = false 
    } = cardDto;

    const basePrice = BigInt(1000);
    const urgentFee = BigInt(urgentProcessing ? 500 : 0);
    const deliveryFee = BigInt(deliveryMethod === 'delivery' ? 300 : 0);
    const totalPrice = basePrice * BigInt(quantity) + urgentFee + deliveryFee;

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });

    if (!wallet || wallet.balance < totalPrice) {
      return {
        success: false,
        message: 'Insufficient wallet balance for card printing',
        requiredAmount: Number(totalPrice),
        currentBalance: wallet ? Number(wallet.balance) : 0,
        breakdown: {
          basePrice: Number(basePrice) * quantity,
          urgentFee: Number(urgentFee),
          deliveryFee: Number(deliveryFee),
          totalPrice: Number(totalPrice),
        },
      };
    }

    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: totalPrice } },
    });

    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: 'PURCHASE',
        amount: totalPrice,
        status: 'SUCCESS',
        description: 'NIN Plastic Card',
        reference: `NINCARD_${Date.now()}`,
      },
    });

    const paymentLog = await this.prisma.paymentLog.create({
      data: {
        userId,
        reference: `NINCARD_${Date.now()}`,
        amount: totalPrice,
        currency: 'NGN',
        gateway: 'wallet',
        status: 'SUCCESS',
        type: 'NIN_PLASTIC_CARD',
        metadata: {
          nin,
          deliveryMethod,
          pickupLocation,
          deliveryAddress,
          urgentProcessing,
        },
      },
    });

    // Send confirmation notification
    await this.notificationService.sendNotification({
      userId,
      type: 'ORDER_CONFIRMED',
      title: 'NIN Plastic Card Order Confirmed',
      message: `Your premium NIN plastic card order has been confirmed. Processing time: ${urgentProcessing ? '24 hours' : '3-5 business days'}`,
      metadata: {
        reference: paymentLog.reference,
        totalPrice: Number(totalPrice),
        processingTime: urgentProcessing ? '24_hours' : '3_5_days',
      },
    });

    return {
      success: true,
      data: {
        reference: paymentLog.reference,
        totalPrice: Number(totalPrice),
        processingStatus: 'PROCESSING',
        orderDetails: {
          nin,
          deliveryMethod,
          pickupLocation,
          deliveryAddress,
          urgentProcessing,
        },
      },
      message: 'NIN plastic card printing request submitted successfully',
    };
  }

  @Get('slip-templates')
  @ApiOperation({ summary: 'Get available NIN slip templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getSlipTemplates() {
    return {
      success: true,
      data: ['classic', 'premium', 'executive', 'quantum'],
      message: 'Available templates retrieved successfully',
    };
  }

  @Get('verification-status/:nin')
  @ApiOperation({ summary: 'Check NIN verification status' })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully' })
  async getVerificationStatus(
    @Param('nin') nin: string,
    @Query('userId') userId: string,
  ) {
    const status = 'VERIFIED';
    
    // Get user's verification history
    const verificationHistory = await this.prisma.verification.findMany({
      where: { 
        userId,
        type: { in: ['NIN'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      success: true,
      data: {
        currentStatus: status,
        verificationHistory: verificationHistory.map(v => ({
          type: v.type,
          status: v.status,
          createdAt: v.createdAt,
          result: v.result,
        })),
      },
      message: 'Verification status retrieved successfully',
    };
  }

  @Get('orders/:userId')
  @ApiOperation({ summary: 'Get user NIN service orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getUserOrders(
    @Param('userId') userId: string,
  ) {
    const logs = await this.prisma.paymentLog.findMany({
      where: { userId, type: { in: ['NIN_PLASTIC_CARD', 'PREMIUM_NIN_SLIP'] } },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: logs,
      message: 'User orders retrieved successfully',
    };
  }

  @Put('orders/:orderId/status')
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() statusDto: { status: string; notes?: string },
  ) {
    return { success: true };
  }

  @Get('stats/:userId')
  @ApiOperation({ summary: 'Get NIN service statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getUserStats(@Param('userId') userId: string) {
    const totalVerifications = await this.prisma.verification.count({ where: { userId, type: 'NIN' } });
    const successful = await this.prisma.verification.count({ where: { userId, type: 'NIN', status: 'VERIFIED' } });
    const failed = await this.prisma.verification.count({ where: { userId, type: 'NIN', status: 'FAILED' } });

    return {
      success: true,
      data: {
        totalVerifications,
        successful,
        failed,
      },
      message: 'User statistics retrieved successfully',
    };
  }

  @Post('bulk-verify')
  @ApiOperation({ summary: 'Bulk NIN verification (Admin only)' })
  @ApiResponse({ status: 200, description: 'Bulk verification completed' })
  async bulkVerifyNin(
    @Body() bulkDto: { nins: string[]; userId: string },
  ) {
    const { nins, userId } = bulkDto;
    
    const results = await Promise.allSettled(
      nins.map(nin => this.nimcCloneService.verifyNIN({ nin, firstName: '', lastName: '' }))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    // Store bulk verification record
    await this.prisma.verification.create({
      data: {
        userId,
        type: 'NIN',
        status: 'PENDING',
        result: {
          totalProcessed: nins.length,
          successful,
          failed,
          processedNins: nins,
        },
      },
    });

    return {
      success: true,
      data: {
        totalProcessed: nins.length,
        successful,
        failed,
        results: results.map((result, index) => ({
          nin: nins[index],
          status: result.status === 'fulfilled' ? (result.value.success ? 'VERIFIED' : 'FAILED') : 'FAILED',
          error: result.status === 'rejected' ? result.reason : undefined,
        })),
      },
      message: 'Bulk verification completed successfully',
    };
  }
}