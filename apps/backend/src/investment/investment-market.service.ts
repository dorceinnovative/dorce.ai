import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface MarketData {
  symbol: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercentage: number;
  volume: number;
  marketCap: number;
  lastUpdated: Date;
}

export interface MarketTrend {
  symbol: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  confidence: number;
  factors: string[];
}

@Injectable()
export class InvestmentMarketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async getMarketData(symbols: string[]): Promise<MarketData[]> {
    try {
      // In a real implementation, this would fetch from external APIs
      // For now, we'll use mock data stored in documents
      const marketDataDocs = await this.prisma.document.findMany({
        where: {
          type: 'OTHER',
          fileName: {
            in: symbols.map(symbol => `MARKET_DATA_${symbol}`)
          }
        }
      });

      const marketData = marketDataDocs.map(doc => JSON.parse(doc.fileUrl || '{}'));

      // If no data found, create mock data
      if (marketData.length === 0) {
        return this.generateMockMarketData(symbols);
      }

      return marketData;
    } catch (error) {
      throw new Error(`Failed to fetch market data: ${(error as Error).message}`);
    }
  }

  async getMarketTrends(symbols: string[]): Promise<MarketTrend[]> {
    try {
      const trends: MarketTrend[] = [];

      for (const symbol of symbols) {
        const trend = await this.analyzeTrend(symbol);
        trends.push(trend);
      }

      return trends;
    } catch (error) {
      throw new Error(`Failed to analyze market trends: ${(error as Error).message}`);
    }
  }

  async updateMarketData(symbol: string, data: Partial<MarketData>): Promise<MarketData> {
    try {
      const existingData = await this.prisma.document.findFirst({
        where: {
          type: 'OTHER',
          fileName: `MARKET_DATA_${symbol}`
        }
      });

      let marketData: MarketData;
      if (existingData) {
        const existingMarketData = JSON.parse(existingData.fileUrl || '{}');
        marketData = {
          ...existingMarketData,
          ...data,
          lastUpdated: new Date()
        };

        await this.prisma.document.update({
          where: { id: existingData.id },
          data: {
            fileUrl: JSON.stringify(marketData)
          }
        });
      } else {
        marketData = {
          symbol,
          name: data.name || symbol,
          currentPrice: data.currentPrice || 100,
          previousClose: data.previousClose || 100,
          change: data.change || 0,
          changePercentage: data.changePercentage || 0,
          volume: data.volume || 0,
          marketCap: data.marketCap || 0,
          lastUpdated: new Date()
        };

        await this.prisma.document.create({
          data: {
            userId: 'SYSTEM',
            type: 'OTHER',
            fileName: `MARKET_DATA_${symbol}`,
            fileSize: 0,
            mimeType: 'application/json',
            fileUrl: JSON.stringify(marketData)
          }
        });
      }

      await this.auditService.log({
        userId: 'SYSTEM',
        action: 'MARKET_DATA_UPDATED',
        resourceType: 'MARKET_DATA',
        resourceId: symbol,
        actionDetails: { 
          currentPrice: marketData.currentPrice,
          change: marketData.changePercentage 
        }
      });

      return marketData;
    } catch (error) {
      await this.auditService.log({
        userId: 'SYSTEM',
        action: 'MARKET_DATA_UPDATE_FAILED',
        resourceType: 'MARKET_DATA',
        resourceId: symbol,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getMarketSummary(): Promise<{
    totalSymbols: number;
    gainers: number;
    losers: number;
    unchanged: number;
    averageChange: number;
  }> {
    try {
      const allMarketData = await this.prisma.document.findMany({
        where: {
          type: 'OTHER',
          fileName: {
            startsWith: 'MARKET_DATA_'
          }
        }
      });

      const marketData = allMarketData.map(doc => JSON.parse(doc.fileUrl || '{}'));

      const gainers = marketData.filter(data => data.changePercentage > 0).length;
      const losers = marketData.filter(data => data.changePercentage < 0).length;
      const unchanged = marketData.filter(data => data.changePercentage === 0).length;
      const averageChange = marketData.reduce((sum, data) => sum + data.changePercentage, 0) / marketData.length;

      return {
        totalSymbols: marketData.length,
        gainers,
        losers,
        unchanged,
        averageChange
      };
    } catch (error) {
      throw new Error(`Failed to get market summary: ${(error as Error).message}`);
    }
  }

  private async analyzeTrend(symbol: string): Promise<MarketTrend> {
    // Simplified trend analysis
    const marketData = await this.getMarketData([symbol]);
    if (marketData.length === 0) {
      return {
        symbol,
        trend: 'STABLE',
        confidence: 0.5,
        factors: ['Insufficient data']
      };
    }

    const data = marketData[0];
    let trend: 'UP' | 'DOWN' | 'STABLE';
    let confidence = 0.5;
    const factors: string[] = [];

    if (data.changePercentage > 2) {
      trend = 'UP';
      confidence = 0.7;
      factors.push('Strong positive movement');
    } else if (data.changePercentage < -2) {
      trend = 'DOWN';
      confidence = 0.7;
      factors.push('Strong negative movement');
    } else {
      trend = 'STABLE';
      confidence = 0.6;
      factors.push('Minimal price change');
    }

    if (data.volume > 1000000) {
      confidence += 0.1;
      factors.push('High trading volume');
    }

    return {
      symbol,
      trend,
      confidence: Math.min(confidence, 1.0),
      factors
    };
  }

  private generateMockMarketData(symbols: string[]): MarketData[] {
    return symbols.map(symbol => ({
      symbol,
      name: `${symbol} Inc.`,
      currentPrice: 100 + Math.random() * 50,
      previousClose: 100 + Math.random() * 50,
      change: (Math.random() - 0.5) * 10,
      changePercentage: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 1000000),
      marketCap: Math.floor(Math.random() * 1000000000),
      lastUpdated: new Date()
    }));
  }
}