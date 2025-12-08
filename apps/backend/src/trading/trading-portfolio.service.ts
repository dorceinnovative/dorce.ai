import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallets/wallet.service';
import { LedgerService } from '../ledger/ledger.service';
import { SecurityService } from '../security/security.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TradingPortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly ledgerService: LedgerService,
    private readonly securityService: SecurityService,
    private readonly auditService: AuditService,
  ) {}

  async createPortfolio(portfolioData: any, userId: string) {
    const portfolio = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `portfolio-${Date.now()}`,
        fileUrl: JSON.stringify({
          ...portfolioData,
          userId,
          type: 'TRADING_PORTFOLIO',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          totalValue: 0,
          totalPnL: 0,
          roi: 0,
        }),
        fileSize: 1024,
        mimeType: 'application/json',
        userId,
      },
    });

    await this.auditService.log({
      action: 'PORTFOLIO_CREATED',
      resourceType: 'TRADING',
      resourceId: portfolio.id,
      actionDetails: {
        portfolioId: portfolio.id,
        portfolioData,
      },
      userId,
    });

    return portfolio;
  }

  async getPortfolio(id: string, userId: string) {
    return this.prisma.document.findFirst({
      where: {
        id,
        userId,
        fileUrl: {
          contains: '"type":"TRADING_PORTFOLIO"',
        },
      },
    });
  }

  async getPortfolioPerformance(id: string, userId: string) {
    const portfolio = await this.getPortfolio(id, userId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const portfolioData = JSON.parse(portfolio.fileUrl);
    const holdings = await this.getPortfolioHoldings(id);
    
    let totalValue = 0;
    let totalCost = 0;
    let totalPnL = 0;

    for (const holding of holdings) {
      const holdingData = JSON.parse(holding.fileUrl);
      totalValue += holdingData.currentValue || 0;
      totalCost += holdingData.costBasis || 0;
      totalPnL += holdingData.unrealizedPnL || 0;
    }

    const roi = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    return {
      portfolioId: id,
      totalValue,
      totalCost,
      totalPnL,
      roi,
      holdings: holdings.length,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getPortfolioHoldings(portfolioId: string) {
    return this.prisma.document.findMany({
      where: {
        AND: [
          { fileUrl: { contains: `"portfolioId":"${portfolioId}"` } },
          { fileUrl: { contains: '"type":"PORTFOLIO_HOLDING"' } }
        ]
      },
    });
  }

  async addHolding(portfolioId: string, holdingData: any, userId: string) {
    const holding = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `holding-${Date.now()}`,
        fileUrl: JSON.stringify({
          ...holdingData,
          portfolioId,
          userId,
          type: 'PORTFOLIO_HOLDING',
          createdAt: new Date().toISOString(),
        }),
        fileSize: 512,
        mimeType: 'application/json',
        userId,
      },
    });

    await this.updatePortfolioValue(portfolioId);

    await this.auditService.log({
      action: 'PORTFOLIO_HOLDING_ADDED',
      resourceType: 'TRADING',
      resourceId: holding.id,
      actionDetails: {
        portfolioId,
        holdingId: holding.id,
        holdingData,
      },
      userId,
    });

    return holding;
  }

  async removeHolding(portfolioId: string, holdingId: string, userId: string) {
    await this.prisma.document.delete({
      where: {
        id: holdingId,
        userId,
      },
    });

    await this.updatePortfolioValue(portfolioId);

    await this.auditService.log({
      action: 'PORTFOLIO_HOLDING_REMOVED',
      resourceType: 'TRADING',
      resourceId: portfolioId,
      actionDetails: {
        portfolioId,
        holdingId,
      },
      userId,
    });
  }

  async updatePortfolioValue(portfolioId: string) {
    const holdings = await this.getPortfolioHoldings(portfolioId);
    
    let totalValue = 0;
    let totalCost = 0;
    let totalPnL = 0;

    for (const holding of holdings) {
      const holdingData = JSON.parse(holding.fileUrl);
      totalValue += holdingData.currentValue || 0;
      totalCost += holdingData.costBasis || 0;
      totalPnL += holdingData.unrealizedPnL || 0;
    }

    const roi = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    const portfolio = await this.prisma.document.findUnique({ where: { id: portfolioId } })
    if (!portfolio) {
      throw new Error('Portfolio not found')
    }

    await this.prisma.document.update({
      where: { id: portfolioId },
      data: {
        fileUrl: JSON.stringify({
          ...JSON.parse(portfolio.fileUrl),
          totalValue,
          totalCost,
          totalPnL,
          roi,
          lastUpdated: new Date().toISOString(),
        }),
      },
    });
  }

  async rebalancePortfolio(rebalanceData: any, userId: string) {
    const { portfolioId, targetAllocation, strategy } = rebalanceData;
    
    const portfolio = await this.getPortfolio(portfolioId, userId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const currentHoldings = await this.getPortfolioHoldings(portfolioId);
    const rebalancing = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `rebalancing-${Date.now()}`,
        fileUrl: JSON.stringify({
          portfolioId,
          targetAllocation,
          strategy,
          userId,
          type: 'PORTFOLIO_REBALANCING',
          status: 'PENDING',
          currentHoldings: currentHoldings.length,
          createdAt: new Date().toISOString(),
        }),
        fileSize: 1024,
        mimeType: 'application/json',
        userId,
      },
    });

    await this.auditService.log({
      action: 'PORTFOLIO_REBALANCING_INITIATED',
      resourceType: 'TRADING',
      resourceId: portfolioId,
      actionDetails: {
        portfolioId,
        rebalancingId: rebalancing.id,
        targetAllocation,
        strategy,
      },
      userId,
    });

    await this.securityService.monitorTransaction({
      transactionId: rebalancing.id,
      amount: BigInt(0),
      fromWalletId: portfolioId,
      toWalletId: portfolioId,
      userId,
    });

    return rebalancing;
  }

  async getUserPortfolios(userId: string) {
    return this.prisma.document.findMany({
      where: {
        userId,
        fileUrl: {
          contains: '"type":"TRADING_PORTFOLIO"',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPortfolioAnalytics(portfolioId: string, userId: string) {
    const holdings = await this.getPortfolioHoldings(portfolioId);
    const performance = await this.getPortfolioPerformance(portfolioId, userId);
    
    const sectorAllocation = {};
    const assetTypeAllocation = {};
    let diversificationScore = 0;

    holdings.forEach(holding => {
      const holdingData = JSON.parse(holding.fileUrl);
      const { sector, assetType, weight } = holdingData;
      
      if (sector) {
        sectorAllocation[sector] = (sectorAllocation[sector] || 0) + (weight || 0);
      }
      
      if (assetType) {
        assetTypeAllocation[assetType] = (assetTypeAllocation[assetType] || 0) + (weight || 0);
      }
    });

    const sectorCount = Object.keys(sectorAllocation).length;
    const assetTypeCount = Object.keys(assetTypeAllocation).length;
    
    diversificationScore = Math.min(100, (sectorCount * 10) + (assetTypeCount * 5));

    return {
      ...performance,
      sectorAllocation,
      assetTypeAllocation,
      diversificationScore,
      riskMetrics: {
        volatility: this.calculateVolatility(holdings),
        sharpeRatio: this.calculateSharpeRatio(performance.roi, holdings),
        maxDrawdown: this.calculateMaxDrawdown(holdings),
      },
    };
  }

  private calculateVolatility(holdings: any[]): number {
    if (holdings.length === 0) return 0;
    
    const returns = holdings.map(h => {
      const data = JSON.parse(h.fileUrl);
      return data.dailyReturn || 0;
    }).filter(r => r !== 0);

    if (returns.length === 0) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(252);
  }

  private calculateSharpeRatio(roi: number, holdings: any[]): number {
    const volatility = this.calculateVolatility(holdings);
    const riskFreeRate = 0.02;
    
    return volatility > 0 ? (roi - riskFreeRate) / volatility : 0;
  }

  private calculateMaxDrawdown(holdings: any[]): number {
    let maxDrawdown = 0;
    let peak = 0;

    holdings.forEach(holding => {
      const data = JSON.parse(holding.fileUrl);
      const value = data.currentValue || 0;
      
      if (value > peak) {
        peak = value;
      } else {
        const drawdown = (peak - value) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    });

    return maxDrawdown;
  }
}