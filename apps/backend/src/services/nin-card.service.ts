import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentIntegrationService } from './payment-integration.service';
import { NotificationService } from '../notification/notification.service';
import { v4 as uuidv4 } from 'uuid';

export interface NinCardOrder {
  id: string;
  userId: string;
  cardType: string;
  quantity: number;
  deliveryMethod: string;
  deliveryAddress?: any;
  phoneNumber: string;
  email: string;
  ninOrVnin: string;
  paymentMethod: string;
  status: string;
  totalAmount: bigint;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class NinCardService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentIntegrationService,
    private notificationService: NotificationService,
  ) {}

  async createOrder(data: {
    userId: string;
    cardType: string;
    quantity: number;
    deliveryMethod: string;
    deliveryAddress?: any;
    phoneNumber: string;
    email: string;
    ninOrVnin: string;
    paymentMethod: string;
  }): Promise<NinCardOrder> {
    // Calculate total amount based on card type and quantity
    const basePrice = this.getBasePrice(data.cardType);
    const totalAmount = BigInt(basePrice * data.quantity);

    // Get or create system store for NIN services
    let systemStore = await this.prisma.store.findFirst({
      where: { name: 'Dorce NIN Services' }
    });

    if (!systemStore) {
      // Create system user if not exists
      let systemUser = await this.prisma.user.findFirst({
        where: { email: 'system@dorce.ai' }
      });

      if (!systemUser) {
        systemUser = await this.prisma.user.create({
          data: {
            email: 'system@dorce.ai',
            phone: '00000000000',
            passwordHash: 'system',
            firstName: 'System',
            lastName: 'User',
            role: 'ADMIN'
          }
        });
      }

      systemStore = await this.prisma.store.create({
        data: {
          userId: systemUser.id,
          name: 'Dorce NIN Services',
          description: 'Official NIN card printing and processing services',
          slug: 'dorce-nin-services',
          isActive: true
        }
      });
    }

    const order = await this.prisma.order.create({
      data: {
        userId: data.userId,
        storeId: systemStore.id,
        orderNumber: `NIN-${uuidv4().substring(0, 8).toUpperCase()}`,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal: totalAmount,
        shippingCost: BigInt(0),
        taxAmount: BigInt(0),
        totalAmount,
        currency: 'NGN',
        shippingAddress: {
          cardType: data.cardType,
          quantity: data.quantity,
          deliveryMethod: data.deliveryMethod,
          deliveryDetails: data.deliveryAddress,
          phoneNumber: data.phoneNumber,
          email: data.email,
          ninOrVnin: data.ninOrVnin,
          paymentMethod: data.paymentMethod,
          serviceType: 'nin-card',
        },
      },
    });

    return {
      id: order.id,
      userId: order.userId,
      cardType: data.cardType,
      quantity: data.quantity,
      deliveryMethod: data.deliveryMethod,
      deliveryAddress: data.deliveryAddress,
      phoneNumber: data.phoneNumber,
      email: data.email,
      ninOrVnin: data.ninOrVnin,
      paymentMethod: data.paymentMethod,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async getOrder(orderId: string, userId: string): Promise<NinCardOrder | null> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order) {
      return null;
    }

    const shippingData = order.shippingAddress as any;
    return {
      id: order.id,
      userId: order.userId,
      cardType: shippingData?.cardType,
      quantity: shippingData?.quantity,
      deliveryMethod: shippingData?.deliveryMethod,
      deliveryAddress: shippingData?.deliveryDetails,
      phoneNumber: shippingData?.phoneNumber,
      email: shippingData?.email,
      ninOrVnin: shippingData?.ninOrVnin,
      paymentMethod: shippingData?.paymentMethod,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async getUserOrders(userId: string, options?: { status?: string; page?: number; limit?: number }): Promise<NinCardOrder[]> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        ...(options?.status && { status: options.status as any })
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return orders.map(order => {
      const shippingData = order.shippingAddress as any;
      return {
        id: order.id,
        userId: order.userId,
        cardType: shippingData?.cardType,
        quantity: shippingData?.quantity,
        deliveryMethod: shippingData?.deliveryMethod,
        deliveryAddress: shippingData?.deliveryDetails,
        phoneNumber: shippingData?.phoneNumber,
        email: shippingData?.email,
        ninOrVnin: shippingData?.ninOrVnin,
        paymentMethod: shippingData?.paymentMethod,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });
  }

  async updateOrderWithNinSlip(orderId: string, userId: string, ninSlipUrl: string): Promise<NinCardOrder> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        shippingAddress: {
          ...(order.shippingAddress as any),
          ninSlipUrl,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    const shippingData = updatedOrder.shippingAddress as any;
    return {
      id: updatedOrder.id,
      userId: updatedOrder.userId,
      cardType: shippingData?.cardType,
      quantity: shippingData?.quantity,
      deliveryMethod: shippingData?.deliveryMethod,
      deliveryAddress: shippingData?.deliveryDetails,
      phoneNumber: shippingData?.phoneNumber,
      email: shippingData?.email,
      ninOrVnin: shippingData?.ninOrVnin,
      paymentMethod: shippingData?.paymentMethod,
      status: updatedOrder.status,
      totalAmount: updatedOrder.totalAmount,
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt,
    };
  }

  async processWalletPayment(orderId: string, userId: string): Promise<any> {
    const order = await this.getOrder(orderId, userId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Process wallet payment logic here
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PROCESSING',
        paymentStatus: 'SUCCESS',
      },
    });

    // Send notification
    await this.notificationService.sendNotification({
      userId,
      type: 'ORDER_CONFIRMED',
      title: 'NIN Card Order Confirmed',
      message: `Your NIN card order #${orderId} has been confirmed and is now being processed.`,
      metadata: {
        orderId,
        serviceType: 'nin-card',
      },
    });

    return {
      success: true,
      message: 'Payment processed successfully',
      orderId,
    };
  }

  async trackOrder(orderId: string, userId: string): Promise<any> {
    const order = await this.getOrder(orderId, userId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Mock tracking information
    return {
      orderId,
      status: order.status,
      trackingNumber: `NIN${orderId.substring(0, 8).toUpperCase()}`,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      trackingHistory: [
        {
          status: 'ORDER_PLACED',
          timestamp: order.createdAt,
          description: 'Order placed successfully',
        },
        {
          status: 'PAYMENT_CONFIRMED',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          description: 'Payment confirmed',
        },
        {
          status: 'PROCESSING',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          description: 'Order is being processed',
        },
      ],
    };
  }

  async verifyNin(ninOrVnin: string, userId: string): Promise<any> {
    // Mock NIN verification
    const isValidFormat = /^\d{11}$/.test(ninOrVnin);
    
    if (!isValidFormat) {
      throw new BadRequestException('Invalid NIN format. NIN must be 11 digits.');
    }

    return {
      success: true,
      verified: true,
      nin: ninOrVnin,
      fullName: 'John Doe',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      phoneNumber: '08012345678',
      email: 'john.doe@example.com',
      address: '123 Main Street, Lagos',
      state: 'Lagos',
      lga: 'Ikeja',
      enrollmentDate: '2020-01-01',
    };
  }

  private getBasePrice(cardType: string): number {
    const prices = {
      'PVC': 1000,
      'LAMINATED': 1500,
      'PREMIUM_PLASTIC': 2000,
    };
    return prices[cardType] || 1000;
  }
}