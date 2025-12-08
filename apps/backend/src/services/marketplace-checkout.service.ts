import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketplaceCartService } from './marketplace-cart.service';
import { PaymentIntegrationService } from './payment-integration.service';
import { NotificationService } from '../notification/notification.service';

interface CheckoutData {
  cart?: any;
  shippingAddress: {
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
  };
  paymentMethod: 'paystack' | 'flutterwave' | 'wallet';
  saveAddress?: boolean;
  notes?: string;
}

interface OrderResult {
  success: boolean;
  orders: Array<{
    orderId: string;
    vendorId: string;
    orderNumber: string;
    subtotal: bigint;
    shipping: bigint;
    tax: bigint;
    total: bigint;
  }>;
  payment?: {
    reference: string;
    authorizationUrl?: string;
    amount: bigint;
  };
  errors?: string[];
}

@Injectable()
export class MarketplaceCheckoutService {
  constructor(
    private prisma: PrismaService,
    private cartService: MarketplaceCartService,
    private paymentService: PaymentIntegrationService,
    private notificationService: NotificationService,
  ) {}

  async processCheckout(userId: string, checkoutData: CheckoutData): Promise<OrderResult> {
    const validation = await this.cartService.validateCartForCheckout(userId);
    if (!validation.valid) {
      throw new BadRequestException(`Cart validation failed: ${validation.errors.join(', ')}`);
    }

    const cart = await this.cartService.getCart(userId);
    
    let shippingAddressData = checkoutData.shippingAddress;
    if (checkoutData.saveAddress) {
      // Save address as user preference (implement user address book if needed)
      // For now, just use the provided address data
      shippingAddressData = checkoutData.shippingAddress;
    }

    const vendorOrders = this.groupItemsByVendor(cart.items);
    const orders: any[] = [];
    const errors: string[] = [];

    const result = await this.prisma.$transaction(async (tx) => {
      for (const [vendorId, items] of Object.entries(vendorOrders)) {
        try {
          const order = await this.createVendorOrder(
            tx,
            userId,
            vendorId,
            items,
            checkoutData,
            shippingAddressData,
          );
          orders.push(order);
        } catch (error: any) {
          errors.push(`Failed to create order for vendor ${vendorId}: ${error.message}`);
        }
      }

      if (errors.length > 0) {
        throw new Error(`Order creation failed: ${errors.join(', ')}`);
      }

      return orders;
    });

    let paymentResult: { reference: string; authorizationUrl?: string; amount: bigint } | undefined;
    if (checkoutData.paymentMethod !== 'wallet') {
      const totalAmount = orders.reduce((sum, order) => sum + order.total, BigInt(0));
      
      // Get user email for payment
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      const paymentResponse = await this.paymentService.initializePayment(
        {
          amount: Number(totalAmount),
          email: user.email,
          reference: `dorce-marketplace-${Date.now()}`,
          callbackUrl: `${process.env.APP_URL}/marketplace/payment/callback`,
          provider: checkoutData.paymentMethod,
          metadata: {
            orderIds: orders.map(o => o.id),
            type: 'marketplace_order',
            userId,
          },
        }
      );
      
      paymentResult = {
        reference: paymentResponse.reference,
        authorizationUrl: paymentResponse.authorizationUrl,
        amount: totalAmount,
      };
    } else {
      paymentResult = await this.processWalletPayment(
        userId,
        orders.map((o: any) => o.id),
        orders.reduce((sum, order) => sum + order.total, BigInt(0)),
      );
    }

    await this.sendOrderNotifications(userId, orders);
    await this.cartService.clearCart(userId);

    return {
      success: true,
      orders: orders.map((order: any) => ({
        orderId: order.id,
        vendorId: order.storeId,
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        shipping: order.shipping,
        tax: order.tax,
        total: order.total,
      })),
      payment: paymentResult,
    };
  }

  private groupItemsByVendor(items: any[]): Record<string, any[]> {
    return items.reduce((groups, item) => {
      if (!groups[item.vendorId]) {
        groups[item.vendorId] = [];
      }
      groups[item.vendorId].push(item);
      return groups;
    }, {});
  }

  private async createVendorOrder(
    tx: any,
    userId: string,
    vendorId: string,
    items: any[],
    checkoutData: CheckoutData,
    shippingAddressData?: any,
  ) {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, BigInt(0));
    const shipping = items[0].vendor.shipping || BigInt(500);
    const tax = (subtotal * BigInt(5)) / BigInt(100);
    const total = subtotal + shipping + tax;

    const orderNumber = await this.generateOrderNumber();

    const order = await tx.order.create({
      data: {
        userId,
        storeId: vendorId,
        orderNumber,
        status: 'PENDING',
        subtotal,
        shipping,
        tax,
        total,
        notes: checkoutData.notes,
        shippingAddress: shippingAddressData,
        paymentStatus: 'PENDING',
        escrowStatus: 'HELD',
        items: {
          create: items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
            variantId: item.variant?.id,
            variantName: item.variant?.name,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    for (const item of items) {
      // Update product inventory
      const productInventory = await tx.inventory.findUnique({
        where: { productId: item.productId },
      });

      if (productInventory) {
        await tx.inventory.update({
          where: { id: productInventory.id },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      if (item.variant?.id) {
        // Update variant inventory
        const variantInventory = await tx.inventory.findUnique({
          where: { variantId: item.variant.id },
        });

        if (variantInventory) {
          await tx.inventory.update({
            where: { id: variantInventory.id },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }
    }

    return order;
  }

  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DOR${timestamp}${random}`;
  }



  private async processWalletPayment(
    userId: string,
    orderIds: string[],
    amount: bigint,
  ): Promise<{ reference: string; amount: bigint }> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    await this.prisma.wallet.update({
      where: { userId },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });

    const reference = `wallet-marketplace-${Date.now()}`;
    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        amount,
        type: 'PURCHASE',
        description: 'Marketplace order payment',
        reference,
        status: 'SUCCESS',
      },
    });

    await this.prisma.order.updateMany({
      where: {
        id: { in: orderIds },
      },
      data: {
        paymentStatus: 'SUCCESS',
        status: 'CONFIRMED',
      },
    });

    return {
      reference,
      amount,
    };
  }

  private async sendOrderNotifications(userId: string, orders: any[]): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phoneNumber: true },
    });

    await this.notificationService.sendNotification({
      userId,
      type: 'GENERAL',
      title: 'Order Placed Successfully',
      message: `Your ${orders.length} order(s) have been placed successfully. You will receive updates as vendors process your orders.`,
      channels: ['email', 'push'],
    });

    for (const order of orders) {
      await this.notificationService.sendNotification({
        userId: order.store?.userId,
        type: 'GENERAL',
        title: 'New Order Received',
        message: `You have received a new order #${order.orderNumber} from a customer.`,
        channels: ['email', 'push'],
      });
    }
  }

  async confirmPayment(reference: string): Promise<void> {
    const payment = await this.prisma.paymentLog.findFirst({
      where: { reference },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const orderIds = (payment.metadata as any)?.orderIds || [];

    await this.prisma.paymentLog.updateMany({
      where: { reference },
      data: {
        status: 'SUCCESS',
      },
    });

    await this.prisma.order.updateMany({
      where: {
        id: { in: orderIds },
      },
      data: {
        paymentStatus: 'SUCCESS',
        status: 'CONFIRMED',
      },
    });

    for (const orderId of orderIds) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true, store: true },
      });

      if (order) {
        await this.notificationService.sendNotification({
          userId: order.userId,
          type: 'GENERAL',
          title: 'Payment Confirmed',
          message: `Payment for order #${order.orderNumber} has been confirmed. Your order is now being processed.`,
          channels: ['email', 'push'],
        });
      }
    }
  }
}