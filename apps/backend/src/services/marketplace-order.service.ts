import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Order, OrderStatus, PaymentStatus, EscrowStatus } from '@prisma/client';
import { CreateOrderDto, OrderResponseDto, ApplyCouponDto } from '../dto/marketplace-order.dto';
import { MarketplaceCartService } from './marketplace-cart.service';
import { PaymentIntegrationService } from './payment-integration.service';
import { EscrowLedgerService } from './escrow-ledger.service';
import { CommissionService } from './commission.service';
import { CouponService } from './coupon.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MarketplaceOrderService {
  constructor(
    private prisma: PrismaService,
    private cartService: MarketplaceCartService,
    private paymentService: PaymentIntegrationService,
    private escrowService: EscrowLedgerService,
    private commissionService: CommissionService,
    private couponService: CouponService,
    private notificationService: NotificationService
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto): Promise<OrderResponseDto> {
    // Validate cart
    const validation = await this.cartService.validateCartForCheckout(userId);
    if (!validation.valid) {
      throw new BadRequestException(`Cart validation failed: ${validation.errors.join(', ')}`);
    }

    // Get cart data
    const cart = await this.cartService.getCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Group items by store for multi-vendor handling
    const storeItems = this.groupItemsByStore(cart.items);
    
    // Apply coupon if provided
    let discountAmount: bigint = BigInt(0);
    if (dto.couponCode) {
      const couponResult = await this.couponService.applyCoupon({
        userId,
        code: dto.couponCode,
        orderAmount: cart.totals.subtotal
      });
      discountAmount = couponResult.discountAmount;
    }

    // Calculate totals
    const subtotal = cart.totals.subtotal;
    const shippingCost = await this.calculateShippingCost(storeItems, dto.shippingAddress);
    const taxAmount = this.calculateTaxAmount(subtotal);
    const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Create order first
    const order = await this.prisma.order.create({
      data: {
        userId,
        storeId: storeItems[0].store.id, // Primary store for now
        orderNumber,
        status: 'PENDING',
        subtotal,
        shippingCost: shippingCost,
        taxAmount,
        discountAmount,
        totalAmount,
        currency: 'NGN', // Default currency
        paymentMethod: dto.paymentMethod,
        paymentStatus: 'PENDING',
        shippingAddress: dto.shippingAddress,
        billingAddress: dto.billingAddress,
        customerNotes: dto.customerNotes,
      },
      include: {
        store: true
      }
    });

    // Create order items separately
    const orderItems = await this.prisma.orderItem.createMany({
      data: cart.items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variant?.id,
        name: item.productName,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.subtotal
      }))
    });

    // Fetch the complete order with items
    const completeOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: {
              include: { store: true }
            },
            variant: true
          }
        },
        store: true
      }
    });

    if (!completeOrder) {
      throw new NotFoundException('Order not found after creation');
    }

    // Create escrow ledger entry
    await this.escrowService.createEscrowLedger({
      orderId: completeOrder.id,
      buyerId: userId,
      sellerIds: storeItems.map(s => s.store.userId),
      amountHeld: totalAmount,
      status: EscrowStatus.HELD
    });

    // Initialize payment
    const paymentResult = await this.paymentService.initializePayment({
      amount: Number(totalAmount), // Convert BigInt to number for payment service
      email: dto.customerEmail,
      reference: `order_${orderNumber}`,
      callbackUrl: dto.callbackUrl || `${process.env.FRONTEND_URL}/payment/callback`,
      metadata: {
        orderId: completeOrder.id,
        orderNumber,
        userId
      },
      provider: 'paystack',
    });

    // Update order with payment reference
    await this.prisma.order.update({
      where: { id: completeOrder.id },
      data: { paymentReference: paymentResult.reference }
    });

    // Clear cart
    await this.cartService.clearCart(userId);

    // Send notifications
    await this.notificationService.sendNotification({
      userId,
      type: 'ORDER_CREATED',
      title: 'Order Placed Successfully',
      message: `Your order #${orderNumber} has been placed. Payment is being processed.`,
      metadata: { orderId: completeOrder.id, orderNumber }
    });

    return this.mapOrderToResponse(completeOrder);
  }

  async getOrder(userId: string, orderId: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: {
          include: {
            product: {
              include: { store: true }
            },
            variant: true
          }
        },
        store: true,
        escrow: true
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.mapOrderToResponse(order);
  }

  async getUserOrders(userId: string, page: number = 1, limit: number = 20): Promise<OrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { store: true }
            },
            variant: true
          }
        },
        store: true,
        escrow: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return orders.map(order => this.mapOrderToResponse(order));
  }

  async confirmOrderDelivery(userId: string, orderId: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { escrow: true }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException('Order must be shipped before confirming delivery');
    }

    // Update order status
    await this.prisma.order.update({
      where: { id: orderId },
      data: { 
        status: OrderStatus.DELIVERED,
        deliveredAt: new Date()
      }
    });

    // Release escrow funds
    if (order.escrow) {
      await this.escrowService.releaseEscrowFunds(order.escrow.id, 'Order delivered');
    }

    // Send notifications
    await this.notificationService.sendNotification({
      userId,
      type: 'ORDER_DELIVERED',
      title: 'Order Delivered',
      message: `Your order #${order.orderNumber} has been delivered.`,
      metadata: { orderId, orderNumber: order.orderNumber }
    });

    return this.getOrder(userId, orderId);
  }

  private groupItemsByStore(items: any[]): any[] {
    const storeMap = new Map();
    
    items.forEach(item => {
      const storeId = item.product.store.id;
      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, {
          store: item.product.store,
          items: []
        });
      }
      storeMap.get(storeId).items.push(item);
    });

    return Array.from(storeMap.values());
  }

  private calculateShippingCost(storeItems: any[], shippingAddress: any): bigint {
    // Simple flat rate per store for now
    // In production, integrate with logistics providers
    const baseRate = BigInt(100000); // ₦1000 per store
    return baseRate * BigInt(storeItems.length);
  }

  private calculateTaxAmount(subtotal: bigint): bigint {
    // 7.5% VAT for Nigeria
    return (subtotal * BigInt(75)) / BigInt(1000);
  }

  private generateOrderNumber(): string {
    return `DOR${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  private mapOrderToResponse(order: Order & { items: any[], store: any, escrow?: any }): OrderResponseDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal.toString(),
      shippingCost: order.shippingCost.toString(),
      taxAmount: order.taxAmount.toString(),
      discountAmount: order.discountAmount.toString(),
      totalAmount: order.totalAmount.toString(),
      currency: order.currency,
      paymentStatus: order.paymentStatus,
      paymentReference: order.paymentReference || undefined,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      trackingNumber: order.trackingNumber || undefined,
      shippedAt: order.shippedAt || undefined,
      deliveredAt: order.deliveredAt || undefined,
      store: {
        id: order.store.id,
        name: order.store.name,
        slug: order.store.slug
      },
      escrow: order.escrow ? {
        id: order.escrow.id,
        status: order.escrow.status,
        amountHeld: order.escrow.amountHeld.toString(),
        amountReleased: order.escrow.amountReleased.toString(),
        amountRefunded: order.escrow.amountRefunded.toString()
      } : null,
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        totalPrice: item.totalPrice.toString(),
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          images: item.product.images
        },
        variant: item.variant ? {
          id: item.variant.id,
          name: item.variant.name
        } : null
      })),
      createdAt: order.createdAt
    };
  }
}