import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallets/wallet.service';
import { LedgerService } from '../ledger/ledger.service';
import { SecurityService } from '../security/security.service';
import { AuditService } from '../audit/audit.service';
import { DICService } from '../dic/dic.service';
import { ChatService } from '../chat/chat.service';
import { TransactionCategory } from '../ledger/ledger.service';

@Injectable()
export class TradingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly ledgerService: LedgerService,
    private readonly securityService: SecurityService,
    private readonly auditService: AuditService,
    private readonly dicService: DICService,
    private readonly chatService: ChatService,
  ) {}

  async createAsset(assetData: any, userId: string) {
    const asset = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `trading-asset-${Date.now()}`,
        fileUrl: JSON.stringify({
          ...assetData,
          userId,
          type: 'TRADING_ASSET',
          createdAt: new Date().toISOString(),
        }),
        fileSize: 512,
        mimeType: 'application/json',
        userId,
      },
    });

    await this.auditService.log({
      action: 'TRADING_ASSET_CREATED',
      resourceType: 'TRADING',
      resourceId: asset.id,
      actionDetails: {
        assetId: asset.id,
        assetData,
      },
      userId,
    });

    return asset;
  }

  async getAssets(userId: string) {
    return this.prisma.document.findMany({
      where: {
        userId,
        fileUrl: {
          contains: '"type":"TRADING_ASSET"',
        },
      },
    });
  }

  async getAsset(id: string, userId: string) {
    return this.prisma.document.findFirst({
      where: {
        id,
        userId,
        fileUrl: {
          contains: '"type":"TRADING_ASSET"',
        },
      },
    });
  }

  async executeTrade(tradeData: any, userId: string) {
    const { symbol, quantity, price, orderType, side } = tradeData;
    
    const wallet = await this.walletService.getWallet(userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const totalCost = quantity * price;
    
    if (side === 'BUY' && wallet.balance < totalCost) {
      throw new Error('Insufficient balance');
    }

    const trade = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `trade-${Date.now()}`,
        fileUrl: JSON.stringify({
          symbol,
          quantity,
          price,
          orderType,
          side,
          userId,
          type: 'TRADE_EXECUTION',
          status: 'EXECUTED',
          totalCost,
          createdAt: new Date().toISOString(),
        }),
        fileSize: 512,
        mimeType: 'application/json',
        userId,
      },
    });

    if (side === 'BUY') {
      // Use withdrawFromWallet for buying
      await this.walletService.withdrawFromWallet(userId, {
        amount: totalCost,
        description: `Trade: Buy ${quantity} ${symbol} @ ${price}`,
      });
      
      // Create ledger entry for the trade
      await this.ledgerService.createEntry({
        debitAccountId: wallet.id,
        creditAccountId: 'TRADING_REVENUE',
        amount: BigInt(Math.round(totalCost)),
        category: TransactionCategory.PURCHASE,
        description: `Trade: Buy ${quantity} ${symbol} @ ${price}`,
        externalReference: trade.id,
        createdBy: userId,
      });
    } else {
      // Use topupWallet for selling
      await this.walletService.topupWallet(userId, {
        amount: totalCost,
      });
      
      // Create ledger entry for the trade
      await this.ledgerService.createEntry({
        debitAccountId: 'TRADING_ASSET',
        creditAccountId: wallet.id,
        amount: BigInt(Math.round(totalCost)),
        category: TransactionCategory.REVENUE,
        description: `Trade: Sell ${quantity} ${symbol} @ ${price}`,
        externalReference: trade.id,
        createdBy: userId,
      });
    }

    await this.auditService.log({
      action: 'TRADE_EXECUTED',
      resourceType: 'TRADE',
      resourceId: trade.id,
      actionDetails: {
        tradeId: trade.id,
        symbol,
        quantity,
        price,
        side,
        totalCost,
      },
      userId,
    });

    await this.securityService.monitorTransaction({
      transactionId: trade.id,
      amount: BigInt(Math.round(totalCost)),
      fromWalletId: side === 'BUY' ? wallet.id : 'TRADING_ASSET',
      toWalletId: side === 'BUY' ? 'TRADING_REVENUE' : wallet.id,
      userId,
    });

    return trade;
  }

  async getPositions(userId: string) {
    const trades = await this.prisma.document.findMany({
      where: {
        userId,
        fileUrl: {
          contains: '"type":"TRADE_EXECUTION"',
        },
      },
    });

    const positions = new Map();
    
    trades.forEach(trade => {
      const tradeData = JSON.parse(trade.fileUrl);
      const { symbol, quantity, side } = tradeData;
      
      if (!positions.has(symbol)) {
        positions.set(symbol, { symbol, quantity: 0, avgPrice: 0 });
      }
      
      const position = positions.get(symbol);
      if (side === 'BUY') {
        position.quantity += quantity;
      } else {
        position.quantity -= quantity;
      }
    });

    return Array.from(positions.values()).filter(p => p.quantity > 0);
  }

  async getPerformance(userId: string) {
    const positions = await this.getPositions(userId);
    const trades = await this.prisma.document.findMany({
      where: {
        userId,
        fileUrl: {
          contains: '"type":"TRADE_EXECUTION"',
        },
      },
    });

    let totalInvested = 0;
    let totalValue = 0;
    let totalPnL = 0;

    trades.forEach(trade => {
      const tradeData = JSON.parse(trade.fileUrl);
      const { side, totalCost } = tradeData;
      
      if (side === 'BUY') {
        totalInvested += totalCost;
      } else {
        totalValue += totalCost;
      }
    });

    totalPnL = totalValue - totalInvested;
    const roi = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalValue,
      totalPnL,
      roi,
      positions,
      tradeCount: trades.length,
    };
  }

  async getAlerts(userId: string) {
    return this.prisma.document.findMany({
      where: {
        userId,
        fileUrl: {
          contains: '"type":"TRADING_ALERT"',
        },
      },
    });
  }

  async createAlert(alertData: any, userId: string) {
    const alert = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `trading-alert-${Date.now()}`,
        fileUrl: JSON.stringify({
          ...alertData,
          userId,
          type: 'TRADING_ALERT',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        }),
        fileSize: 0,
        mimeType: 'application/json',
        userId,
      },
    });

    await this.chatService.sendSystemMessage(userId, {
      type: 'TRADING_ALERT',
      title: 'Trading Alert Created',
      content: `Alert created for ${alertData.symbol || 'portfolio'}`,
      metadata: { alertId: alert.id },
    });

    return alert;
  }

  async processMarketData(marketData: any) {
    const alerts = await this.prisma.document.findMany({
      where: {
        fileUrl: {
          contains: '"type":"TRADING_ALERT"',
        },
      },
    });

    for (const alert of alerts) {
      const alertData = JSON.parse(alert.fileUrl);
      const { symbol, condition, threshold, userId } = alertData;
      
      if (marketData.symbol === symbol) {
        const shouldTrigger = this.evaluateAlertCondition(condition, marketData.price, threshold);
        
        if (shouldTrigger) {
          await this.triggerAlert(alert.id, userId, marketData);
        }
      }
    }
  }

  private evaluateAlertCondition(condition: string, currentPrice: number, threshold: number): boolean {
    switch (condition) {
      case 'ABOVE':
        return currentPrice > threshold;
      case 'BELOW':
        return currentPrice < threshold;
      case 'EQUALS':
        return currentPrice === threshold;
      default:
        return false;
    }
  }

  private async triggerAlert(alertId: string, userId: string, marketData: any) {
    const alertDoc = await this.prisma.document.findUnique({ where: { id: alertId } });
    
    if (!alertDoc || !alertDoc.fileUrl) {
      throw new Error('Alert document not found');
    }

    await this.prisma.document.update({
      where: { id: alertId },
      data: {
        fileUrl: JSON.stringify({
          ...JSON.parse(alertDoc.fileUrl as string),
          status: 'TRIGGERED',
          triggeredAt: new Date().toISOString(),
          triggeredData: marketData,
        }),
      },
    });

    await this.chatService.sendSystemMessage(userId, {
      type: 'TRADING_ALERT_TRIGGERED',
      title: 'Trading Alert Triggered',
      content: `Alert triggered for ${marketData.symbol} at ${marketData.price}`,
      metadata: { alertId, marketData },
    });
  }
}