import { Controller, Post, Get, Put, Body, Param, Query, UploadedFile, UseInterceptors, Req, Res, HttpStatus, HttpException, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NinCardService } from '../services/nin-card.service';
import { PaymentIntegrationService } from '../services/payment-integration.service';
import { NotificationService } from '../notification/notification.service';
import { uploadToStorage } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('nin-card')
@UseGuards(JwtAuthGuard)
export class NinCardController {
  constructor(
    private ninCardService: NinCardService,
    private paymentService: PaymentIntegrationService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Create NIN card order
   * POST /api/nin-card/orders
   */
  @Post('orders')
  async createOrder(
    @Request() req: any,
    @Body() orderData: {
      cardType: string;
      quantity: number;
      deliveryMethod: string;
      deliveryAddress?: any;
      phoneNumber: string;
      email: string;
      ninOrVnin: string;
      paymentMethod: string;
    }
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      const {
        cardType,
        quantity,
        deliveryMethod,
        deliveryAddress,
        phoneNumber,
        email,
        ninOrVnin,
        paymentMethod
      } = orderData;

      // Validate input
      if (!cardType || !quantity || !deliveryMethod || !phoneNumber || !email || !ninOrVnin || !paymentMethod) {
        throw new HttpException('Missing required fields', HttpStatus.BAD_REQUEST);
      }

      // Validate card type
      const validCardTypes = ['PVC', 'LAMINATED', 'PREMIUM_PLASTIC'];
      if (!validCardTypes.includes(cardType)) {
        throw new HttpException('Invalid card type', HttpStatus.BAD_REQUEST);
      }

      // Validate delivery method
      const validDeliveryMethods = ['PICKUP', 'DELIVERY'];
      if (!validDeliveryMethods.includes(deliveryMethod)) {
        throw new HttpException('Invalid delivery method', HttpStatus.BAD_REQUEST);
      }

      // Validate payment method
      const validPaymentMethods = ['WALLET', 'PAYSTACK', 'FLUTTERWAVE'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        throw new HttpException('Invalid payment method', HttpStatus.BAD_REQUEST);
      }

      // Create order
      const order = await this.ninCardService.createOrder({
        userId,
        cardType,
        quantity,
        deliveryMethod,
        deliveryAddress,
        phoneNumber,
        email,
        ninOrVnin,
        paymentMethod
      });

      return {
        success: true,
        data: order
      };
    } catch (error) {
      console.error('Error creating NIN card order:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to create order',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Upload NIN slip PDF
   * POST /api/nin-card/orders/:orderId/upload-slip
   */
  @Post('orders/:orderId/upload-slip')
  @UseInterceptors(FileInterceptor('file'))
  async uploadNinSlip(
    @Request() req: any,
    @Param('orderId') orderId: string,
    @UploadedFile() file: any
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new HttpException('Invalid file type. Only PDF, JPEG, and PNG are allowed', HttpStatus.BAD_REQUEST);
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new HttpException('File size exceeds 5MB limit', HttpStatus.BAD_REQUEST);
      }

      // Upload to storage
      const fileName = `nin-slip-${orderId}-${uuidv4()}`;
      const fileUrl = await uploadToStorage(file.buffer, fileName, file.mimetype);

      // Update order with NIN slip
      const updatedOrder = await this.ninCardService.updateOrderWithNinSlip(orderId, userId, fileUrl);

      return {
        success: true,
        data: updatedOrder
      };
    } catch (error) {
      console.error('Error uploading NIN slip:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to upload NIN slip',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Process payment for NIN card order
   * POST /api/nin-card/orders/:orderId/pay
   */
  @Post('orders/:orderId/pay')
  async processPayment(
    @Request() req: any,
    @Param('orderId') orderId: string,
    @Body() paymentData: { paymentMethod?: string }
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      const { paymentMethod } = paymentData;
      const paymentProvider = paymentMethod || 'paystack';

      // Get order
      const order = await this.ninCardService.getOrder(orderId, userId);
      if (!order) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }

      if (order.status !== 'PENDING_PAYMENT') {
        throw new HttpException('Order is not in pending payment status', HttpStatus.BAD_REQUEST);
      }

      let paymentResult;

      if (paymentProvider === 'wallet') {
        // Process wallet payment
        paymentResult = await this.ninCardService.processWalletPayment(orderId, userId);
      } else {
        // Process external payment
        const amount = parseInt(order.totalAmount.toString());
        const reference = `nin-card-${orderId}-${uuidv4()}`;
        
        paymentResult = await this.paymentService.initializePayment({
          amount,
          email: order.email,
          reference,
          provider: (paymentProvider || 'paystack') as 'paystack' | 'flutterwave' | 'remita',
          callbackUrl: `${process.env.FRONTEND_URL}/nin-card/payment-callback`,
          metadata: {
            orderId,
            userId,
            service: 'nin-card',
            type: 'nin-card-order'
          }
        });
      }

      return {
        success: true,
        data: paymentResult
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to process payment',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get NIN card order by ID
   * GET /api/nin-card/orders/:orderId
   */
  @Get('orders/:orderId')
  async getOrder(
    @Request() req: any,
    @Param('orderId') orderId: string
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      const order = await this.ninCardService.getOrder(orderId, userId);
      if (!order) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: order
      };
    } catch (error) {
      console.error('Error getting order:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to get order',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get user's NIN card orders
   * GET /api/nin-card/orders
   */
  @Get('orders')
  async getUserOrders(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      const pageNum = parseInt(page || '1');
      const limitNum = parseInt(limit || '10');

      const orders = await this.ninCardService.getUserOrders(userId, {
        status,
        page: pageNum,
        limit: limitNum
      });

      return {
        success: true,
        data: orders
      };
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to get orders',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Track NIN card order
   * GET /api/nin-card/orders/:orderId/track
   */
  @Get('orders/:orderId/track')
  async trackOrder(
    @Request() req: any,
    @Param('orderId') orderId: string
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      const trackingInfo = await this.ninCardService.trackOrder(orderId, userId);

      return {
        success: true,
        data: trackingInfo
      };
    } catch (error) {
      console.error('Error tracking order:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to track order',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Verify NIN number
   * POST /api/nin-card/verify
   */
  @Post('verify')
  async verifyNin(
    @Request() req: any,
    @Body() verificationData: { ninOrVnin: string }
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      const { ninOrVnin } = verificationData;
      if (!ninOrVnin) {
        throw new HttpException('NIN or VNIN is required', HttpStatus.BAD_REQUEST);
      }

      const verificationResult = await this.ninCardService.verifyNin(ninOrVnin, userId);

      return {
        success: true,
        data: verificationResult
      };
    } catch (error) {
      console.error('Error verifying NIN:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to verify NIN',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('pricing')
  async getPricing() {
    return {
      success: true,
      data: {
        PVC: 3500,
        LAMINATED: 2000,
        PREMIUM_PLASTIC: 5000,
      },
    };
  }

  @Post('orders/:orderId/verify-payment')
  async verifyPayment(
    @Request() req: any,
    @Param('orderId') orderId: string,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    const order = await this.ninCardService.getOrder(orderId, userId);
    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
    return { success: true, data: { status: 'SUCCESS' } };
  }

  @Get('orders/:orderId/details')
  async getOrderDetails(
    @Request() req: any,
    @Param('orderId') orderId: string,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    const order = await this.ninCardService.getOrder(orderId, userId);
    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
    return { success: true, data: order };
  }

  @Get('admin/orders')
  async getAllOrders(@Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    const orders = await this.ninCardService.getUserOrders(userId, { page: 1, limit: 50 });
    return { success: true, data: orders };
  }

  @Put('admin/orders/:orderId/status')
  async updateOrderStatus(
    @Request() req: any,
    @Param('orderId') orderId: string,
    @Body() body: { status: string },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    await this.ninCardService['prisma'].order.update({
      where: { id: orderId },
      data: { status: body.status as any },
    });
    return { success: true };
  }

  @Get('admin/statistics')
  async getStatistics(@Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    const orders = await this.ninCardService.getUserOrders(userId, { page: 1, limit: 100 });
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'PENDING').length;
    const processing = orders.filter(o => o.status === 'PROCESSING').length;
    const completed = orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;
    return { success: true, data: { total, pending, processing, completed } };
  }
}