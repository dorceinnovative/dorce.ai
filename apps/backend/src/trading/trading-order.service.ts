import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallets/wallet.service';
import { LedgerService } from '../ledger/ledger.service';
import { SecurityService } from '../security/security.service';
import { AuditService } from '../audit/audit.service';
import { TransactionCategory } from '../ledger/ledger.service';

@Injectable()
export class TradingOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly ledgerService: LedgerService,
    private readonly securityService: SecurityService,
    private readonly auditService: AuditService,
  ) {}

  async createOrder(orderData: any, userId: string) {
    const { symbol, quantity, price, orderType, side, timeInForce = 'GTC' } = orderData;
    
    const wallet = await this.walletService.getWallet(userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const totalCost = quantity * price;
    
    if (side === 'BUY' && wallet.balance < totalCost) {
      throw new Error('Insufficient balance');
    }

    const order = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `order-${Date.now()}`,
        fileUrl: JSON.stringify({
          symbol,
          quantity,
          price,
          orderType,
          side,
          timeInForce,
          userId,
          type: 'TRADING_ORDER',
          status: 'PENDING',
          filledQuantity: 0,
          remainingQuantity: quantity,
          totalCost,
          createdAt: new Date().toISOString(),
        }),
        fileSize: 1024,
        mimeType: 'application/json',
        userId,
      },
    });

    await this.auditService.log({
      action: 'ORDER_CREATED',
      resourceType: 'TRADING',
      resourceId: order.id,
      actionDetails: {
        orderId: order.id,
        symbol,
        quantity,
        price,
        side,
        orderType,
      },
      userId,
    });

    await this.securityService.monitorTransaction({
      transactionId: order.id,
      amount: BigInt(Math.round(totalCost)),
      fromWalletId: userId,
      toWalletId: 'ORDER_BOOK',
      userId,
    });

    if (orderType === 'MARKET') {
      setTimeout(() => this.executeOrder(order.id), 1000);
    }

    return order;
  }

  async executeOrder(orderId: string) {
    const order = await this.prisma.document.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const orderData = JSON.parse(order.fileUrl);
    
    if (orderData.status !== 'PENDING') {
      throw new Error('Order already executed or cancelled');
    }

    const executionPrice = await this.getMarketPrice(orderData.symbol);
    const filledQuantity = orderData.quantity;
    const totalValue = filledQuantity * executionPrice;

    const updatedOrder = await this.prisma.document.update({
      where: { id: orderId },
      data: {
        fileUrl: JSON.stringify({
          ...orderData,
          status: 'FILLED',
          filledQuantity,
          remainingQuantity: 0,
          executionPrice,
          totalValue,
          executedAt: new Date().toISOString(),
        }),
      },
    });

    await this.processOrderSettlement(updatedOrder);

    await this.auditService.log({
      action: 'ORDER_EXECUTED',
      resourceType: 'TRADING',
      resourceId: orderId,
      actionDetails: {
        orderId,
        executionPrice,
        filledQuantity,
        totalValue,
      },
      userId: orderData.userId,
    });

    return updatedOrder;
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.prisma.document.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const orderData = JSON.parse(order.fileUrl);
    
    if (orderData.status !== 'PENDING') {
      throw new Error('Order already executed or cancelled');
    }

    const cancelledOrder = await this.prisma.document.update({
      where: { id: orderId },
      data: {
        fileUrl: JSON.stringify({
          ...orderData,
          status: 'CANCELLED',
          cancelledAt: new Date().toISOString(),
        }),
      },
    });

    await this.auditService.log({
      action: 'ORDER_CANCELLED',
      resourceType: 'TRADING',
      resourceId: orderId,
      actionDetails: {
        orderId,
        cancelledAt: new Date().toISOString(),
      },
      userId,
    });

    return cancelledOrder;
  }

  async getOrders(userId: string) {
    return this.prisma.document.findMany({
      where: {
        userId,
        fileUrl: {
          contains: '"type":"TRADING_ORDER"',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrder(id: string, userId: string) {
    return this.prisma.document.findFirst({
      where: {
        id,
        userId,
        fileUrl: {
          contains: '"type":"TRADING_ORDER"',
        },
      },
    });
  }

  async getActiveOrders(userId: string) {
    return this.prisma.document.findMany({
      where: {
        userId,
        AND: [
          { fileUrl: { contains: '"type":"TRADING_ORDER"' } },
          { fileUrl: { contains: '"status":"PENDING"' } }
        ]
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrderHistory(userId: string, limit: number = 50) {
    return this.prisma.document.findMany({
      where: {
        userId,
        fileUrl: {
          contains: '"type":"TRADING_ORDER"',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async updateOrderStatus(orderId: string, status: string, metadata: any = {}) {
    const order = await this.prisma.document.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const orderData = JSON.parse(order.fileUrl);
    
    const updatedOrder = await this.prisma.document.update({
      where: { id: orderId },
      data: {
        fileUrl: JSON.stringify({
          ...orderData,
          status,
          ...metadata,
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    await this.auditService.log({
      action: 'ORDER_STATUS_UPDATED',
      resourceType: 'TRADING',
      resourceId: orderId,
      actionDetails: {
        orderId,
        status,
        metadata,
      },
      userId: orderData.userId,
    });

    return updatedOrder;
  }

  private async processOrderSettlement(order: any) {
    const orderData = JSON.parse(order.fileUrl);
    const { userId, side, executionPrice, filledQuantity, totalValue } = orderData;

    if (side === 'BUY') {
      await this.walletService.withdrawFromWallet(userId, totalValue);
      await this.ledgerService.createEntry({
        debitAccountId: 'USER_WALLET',
        creditAccountId: 'TRADING_REVENUE',
        amount: BigInt(Math.round(totalValue)),
        category: TransactionCategory.PURCHASE,
        description: `Order executed: Buy ${filledQuantity} ${orderData.symbol} @ ${executionPrice}`,
        externalReference: order.id,
        createdBy: userId,
      });
    } else {
      await this.walletService.topupWallet(userId, totalValue);
      await this.ledgerService.createEntry({
        debitAccountId: 'TRADING_ASSET',
        creditAccountId: 'USER_WALLET',
        amount: BigInt(Math.round(totalValue)),
        category: TransactionCategory.REVENUE,
        description: `Order executed: Sell ${filledQuantity} ${orderData.symbol} @ ${executionPrice}`,
        externalReference: order.id,
        createdBy: userId,
      });
    }
  }

  private async getMarketPrice(symbol: string): Promise<number> {
    return this.generateRandomPrice(50, 500);
  }

  private generateRandomPrice(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  async validateOrder(orderData: any, userId: string): Promise<boolean> {
    const { symbol, quantity, price, side } = orderData;
    
    if (!symbol || !quantity || !price || !side) {
      return false;
    }

    if (quantity <= 0 || price <= 0) {
      return false;
    }

    if (!['BUY', 'SELL'].includes(side)) {
      return false;
    }

    const wallet = await this.walletService.getWallet(userId);
    if (!wallet) {
      return false;
    }

    const totalCost = quantity * price;
    
    if (side === 'BUY' && wallet.balance < totalCost) {
      return false;
    }

    return true;
  }

  async getOrderStatistics(userId: string) {
    const orders = await this.prisma.document.findMany({
      where: {
        userId,
        fileUrl: {
          contains: '"type":"TRADING_ORDER"',
        },
      },
    });

    const statistics = {
      totalOrders: orders.length,
      filledOrders: 0,
      cancelledOrders: 0,
      pendingOrders: 0,
      totalVolume: 0,
      totalValue: 0,
      averageOrderSize: 0,
      successRate: 0,
    };

    orders.forEach(order => {
      const orderData = JSON.parse(order.fileUrl);
      
      switch (orderData.status) {
        case 'FILLED':
          statistics.filledOrders++;
          statistics.totalVolume += orderData.filledQuantity || 0;
          statistics.totalValue += orderData.totalValue || 0;
          break;
        case 'CANCELLED':
          statistics.cancelledOrders++;
          break;
        case 'PENDING':
          statistics.pendingOrders++;
          break;
      }
    });

    statistics.successRate = statistics.totalOrders > 0 
      ? (statistics.filledOrders / statistics.totalOrders) * 100 
      : 0;
    
    statistics.averageOrderSize = statistics.filledOrders > 0 
      ? statistics.totalValue / statistics.filledOrders 
      : 0;

    return statistics;
  }
}