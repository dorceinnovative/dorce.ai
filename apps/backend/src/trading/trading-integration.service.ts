import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from '../security/security.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TradingIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly securityService: SecurityService,
    private readonly auditService: AuditService,
  ) {}

  async connectBroker(brokerData: any, userId: string) {
    const { brokerName, apiKey, apiSecret, accountType } = brokerData;
    
    const connection = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `broker-connection-${Date.now()}`,
        fileUrl: JSON.stringify({
          brokerName,
          apiKey: this.encryptApiKey(apiKey),
          apiSecret: this.encryptApiSecret(apiSecret),
          accountType,
          userId,
          type: 'BROKER_CONNECTION',
          status: 'CONNECTED',
          createdAt: new Date().toISOString(),
        }),
        fileSize: 1024,
        mimeType: 'application/json',
        userId,
      },
    });

    await this.auditService.log({
      action: 'BROKER_CONNECTED',
      resourceType: 'TRADING',
      resourceId: connection.id,
      actionDetails: {
        brokerName,
        accountType,
        connectionId: connection.id,
      },
      userId,
    });

    await this.securityService.monitorTransaction({
      transactionId: connection.id,
      amount: BigInt(0),
      fromWalletId: 'EXTERNAL_BROKER',
      toWalletId: 'TRADING_ACCOUNT',
      userId,
    });

    return connection;
  }

  async getConnectedBrokers(userId: string) {
    return this.prisma.document.findMany({
      where: {
        userId,
        AND: [
          { fileUrl: { contains: '"type":"BROKER_CONNECTION"' } },
          { fileUrl: { contains: '"status":"CONNECTED"' } }
        ]
      },
    });
  }

  async disconnectBroker(connectionId: string, userId: string) {
    const connection = await this.prisma.document.findFirst({
      where: {
        id: connectionId,
        userId,
      },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    const connectionData = JSON.parse(connection.fileUrl);
    
    const updatedConnection = await this.prisma.document.update({
      where: { id: connectionId },
      data: {
        fileUrl: JSON.stringify({
          ...connectionData,
          status: 'DISCONNECTED',
          disconnectedAt: new Date().toISOString(),
        }),
      },
    });

    await this.auditService.log({
      action: 'BROKER_DISCONNECTED',
      resourceType: 'TRADING',
      resourceId: connectionId,
      actionDetails: {
        connectionId,
        brokerName: connectionData.brokerName,
      },
      userId,
    });

    return updatedConnection;
  }

  async syncBrokerData(connectionId: string, userId: string) {
    const connection = await this.prisma.document.findFirst({
      where: {
        id: connectionId,
        userId,
      },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    const connectionData = JSON.parse(connection.fileUrl);
    
    if (connectionData.status !== 'CONNECTED') {
      throw new Error('Broker not connected');
    }

    const brokerData = await this.fetchBrokerData(connectionData);
    
    const syncRecord = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `broker-sync-${Date.now()}`,
        fileUrl: JSON.stringify({
          connectionId,
          brokerName: connectionData.brokerName,
          syncData: brokerData,
          userId,
          type: 'BROKER_SYNC',
          syncedAt: new Date().toISOString(),
        }),
        fileSize: 2048,
        mimeType: 'application/json',
        userId,
      },
    });

    await this.auditService.log({
      action: 'BROKER_DATA_SYNCED',
      resourceType: 'TRADING',
      resourceId: connectionId,
      actionDetails: {
        connectionId,
        brokerName: connectionData.brokerName,
        syncId: syncRecord.id,
      }
    });

    return syncRecord;
  }

  async executeBrokerTrade(connectionId: string, tradeData: any, userId: string) {
    const connection = await this.prisma.document.findFirst({
      where: {
        id: connectionId,
        userId,
      },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    const connectionData = JSON.parse(connection.fileUrl);
    
    if (connectionData.status !== 'CONNECTED') {
      throw new Error('Broker not connected');
    }

    const tradeResult = await this.placeBrokerTrade(connectionData, tradeData);
    
    const tradeRecord = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `broker-trade-${Date.now()}`,
        fileUrl: JSON.stringify({
          connectionId,
          brokerName: connectionData.brokerName,
          tradeData,
          tradeResult,
          userId,
          type: 'BROKER_TRADE',
          executedAt: new Date().toISOString(),
        }),
        fileSize: 1024,
        mimeType: 'application/json',
        userId,
      },
    });

    await this.auditService.log({
      action: 'BROKER_TRADE_EXECUTED',
      resourceType: 'TRADING',
      resourceId: tradeRecord.id,
      actionDetails: {
        connectionId,
        brokerName: connectionData.brokerName,
        tradeId: tradeRecord.id,
        symbol: tradeData.symbol,
        quantity: tradeData.quantity,
      },
      userId,
    });

    await this.securityService.monitorTransaction({
      transactionId: tradeRecord.id,
      amount: BigInt(Math.round(tradeData.quantity * tradeData.price)),
      fromWalletId: 'BROKER_ACCOUNT',
      toWalletId: 'TRADING_ACCOUNT',
      userId,
    });

    return tradeRecord;
  }

  async getBrokerPositions(connectionId: string, userId: string) {
    const connection = await this.prisma.document.findFirst({
      where: {
        id: connectionId,
        userId,
      },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    const connectionData = JSON.parse(connection.fileUrl);
    
    if (connectionData.status !== 'CONNECTED') {
      throw new Error('Broker not connected');
    }

    const positions = await this.fetchBrokerPositions(connectionData);
    
    await this.auditService.log({
      action: 'BROKER_POSITIONS_ACCESSED',
      resourceType: 'TRADING',
      resourceId: connectionId,
      actionDetails: {
        connectionId,
        brokerName: connectionData.brokerName,
        positionCount: positions.length,
      }
    });

    return positions;
  }

  async getBrokerOrders(connectionId: string, userId: string) {
    const connection = await this.prisma.document.findFirst({
      where: {
        id: connectionId,
        userId,
      },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    const connectionData = JSON.parse(connection.fileUrl);
    
    if (connectionData.status !== 'CONNECTED') {
      throw new Error('Broker not connected');
    }

    const orders = await this.fetchBrokerOrders(connectionData);
    
    await this.auditService.log({
      action: 'BROKER_ORDERS_ACCESSED',
      resourceType: 'TRADING',
      resourceId: connectionId,
      actionDetails: {
        connectionId,
        brokerName: connectionData.brokerName,
        orderCount: orders.length,
      },
      userId,
    });

    return orders;
  }

  private encryptApiKey(apiKey: string): string {
    return `encrypted_${apiKey.slice(0, 4)}***${apiKey.slice(-4)}`;
  }

  private encryptApiSecret(apiSecret: string): string {
    return `encrypted_${apiSecret.slice(0, 4)}***${apiSecret.slice(-4)}`;
  }

  private async fetchBrokerData(connectionData: any) {
    return {
      accountBalance: Math.random() * 100000 + 10000,
      buyingPower: Math.random() * 50000 + 5000,
      positions: Math.floor(Math.random() * 20) + 1,
      orders: Math.floor(Math.random() * 10),
      dailyPnL: (Math.random() - 0.5) * 5000,
      totalPnL: (Math.random() - 0.5) * 20000,
    };
  }

  private async placeBrokerTrade(connectionData: any, tradeData: any) {
    const { symbol, quantity, side, orderType, price } = tradeData;
    
    return {
      orderId: `broker_${Date.now()}`,
      symbol,
      quantity,
      side,
      orderType,
      price: price || Math.random() * 500 + 50,
      status: 'FILLED',
      filledQuantity: quantity,
      remainingQuantity: 0,
      averageFillPrice: price || Math.random() * 500 + 50,
      commission: quantity * 0.01,
      timestamp: new Date().toISOString(),
    };
  }

  private async fetchBrokerPositions(connectionData: any) {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
    
    return symbols.slice(0, Math.floor(Math.random() * 3) + 1).map(symbol => ({
      symbol,
      quantity: Math.floor(Math.random() * 100) + 10,
      averagePrice: Math.random() * 500 + 50,
      currentPrice: Math.random() * 500 + 50,
      marketValue: Math.random() * 50000 + 1000,
      unrealizedPnL: (Math.random() - 0.5) * 10000,
      unrealizedPnLPercent: (Math.random() - 0.5) * 20,
    }));
  }

  private async fetchBrokerOrders(connectionData: any) {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
    const statuses = ['FILLED', 'PENDING', 'CANCELLED'];
    
    return Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => ({
      orderId: `order_${Date.now()}_${i}`,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      quantity: Math.floor(Math.random() * 100) + 10,
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      orderType: ['MARKET', 'LIMIT', 'STOP'][Math.floor(Math.random() * 3)],
      price: Math.random() * 500 + 50,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      filledQuantity: Math.floor(Math.random() * 100),
      remainingQuantity: Math.floor(Math.random() * 50),
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    }));
  }
}