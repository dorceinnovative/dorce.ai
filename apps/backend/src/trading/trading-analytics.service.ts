import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class TradingAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async getTradingAnalytics(userId: string, timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<{
    totalTrades: number
    profitableTrades: number
    lossTrades: number
    totalVolume: number
    averageReturn: number
    winRate: number
  }> {
    try {
      const now = new Date()
      let startDate: Date

      switch (timeframe) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
      }

      const trades = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'TRADING_ASSET',
          createdAt: {
            gte: startDate
          }
        }
      })

      const totalTrades = trades.length
      const profitableTrades = trades.filter(trade => {
        const data = JSON.parse(trade.fileUrl || '{}')
        return data.currentPrice > data.purchasePrice
      }).length
      const lossTrades = totalTrades - profitableTrades
      const totalVolume = trades.reduce((sum, trade) => {
        const data = JSON.parse(trade.fileUrl || '{}')
        return sum + (data.quantity * data.purchasePrice)
      }, 0)
      const averageReturn = totalTrades > 0 ? trades.reduce((sum, trade) => {
        const data = JSON.parse(trade.fileUrl || '{}')
        const returnPct = ((data.currentPrice - data.purchasePrice) / data.purchasePrice) * 100
        return sum + returnPct
      }, 0) / totalTrades : 0
      const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0

      await this.auditService.log({
        userId,
        action: 'TRADING_ANALYTICS_ACCESSED',
        resourceType: 'TRADING',
        actionDetails: { timeframe, totalTrades, profitableTrades, winRate }
      })

      return {
        totalTrades,
        profitableTrades,
        lossTrades,
        totalVolume,
        averageReturn,
        winRate
      }
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'TRADING_ANALYTICS_FAILED',
        resourceType: 'TRADING',
        actionDetails: { error: (error as Error).message }
      })
      throw error
    }
  }

  async getPortfolioPerformance(userId: string): Promise<{
    totalValue: number
    totalCost: number
    totalReturn: number
    returnPercentage: number
    topPerformers: Array<{
      symbol: string
      return: number
      returnPercentage: number
    }>
    underPerformers: Array<{
      symbol: string
      return: number
      returnPercentage: number
    }>
  }> {
    try {
      const positions = await this.prisma.document.findMany({
        where: { userId, type: 'OTHER', fileName: 'TRADING_POSITION' }
      })

      const assets = await this.prisma.document.findMany({
        where: { userId, type: 'OTHER', fileName: 'TRADING_ASSET' }
      })

      const totalValue = positions.reduce((sum, pos) => {
        const data = JSON.parse(pos.fileUrl || '{}')
        return sum + (data.quantity * data.currentPrice)
      }, 0) + assets.reduce((sum, asset) => {
        const data = JSON.parse(asset.fileUrl || '{}')
        return sum + (data.quantity * data.currentPrice)
      }, 0)

      const totalCost = positions.reduce((sum, pos) => {
        const data = JSON.parse(pos.fileUrl || '{}')
        return sum + (data.quantity * data.entryPrice)
      }, 0) + assets.reduce((sum, asset) => {
        const data = JSON.parse(asset.fileUrl || '{}')
        return sum + (data.quantity * data.purchasePrice)
      }, 0)

      const totalReturn = totalValue - totalCost
      const returnPercentage = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0

      const performers = [...positions, ...assets].map(item => {
        const data = JSON.parse(item.fileUrl || '{}')
        const entryPrice = data.entryPrice || data.purchasePrice
        return {
          symbol: data.symbol,
          return: (data.currentPrice - entryPrice) * data.quantity,
          returnPercentage: entryPrice > 0 ? ((data.currentPrice - entryPrice) / entryPrice) * 100 : 0
        }
      })

      const topPerformers = performers
        .filter(p => p.return > 0)
        .sort((a, b) => b.returnPercentage - a.returnPercentage)
        .slice(0, 5)

      const underPerformers = performers
        .filter(p => p.return < 0)
        .sort((a, b) => a.returnPercentage - b.returnPercentage)
        .slice(0, 5)

      await this.auditService.log({
        action: 'PORTFOLIO_PERFORMANCE_ACCESSED',
        resourceType: 'TRADING',
        resourceId: 'PORTFOLIO_PERFORMANCE',
        actionDetails: { totalValue, totalReturn, returnPercentage },
        userId,
      })

      return {
        totalValue,
        totalCost,
        totalReturn,
        returnPercentage,
        topPerformers,
        underPerformers
      }
    } catch (error: any) {
      await this.auditService.log({
        action: 'PORTFOLIO_PERFORMANCE_FAILED',
        resourceType: 'TRADING',
        resourceId: 'PORTFOLIO_PERFORMANCE',
        actionDetails: { error: error.message },
        userId,
      })
      throw error
    }
  }

  async generateTradingReport(userId: string, startDate: Date, endDate: Date): Promise<{
    reportId: string
    downloadUrl: string
  }> {
    try {
      const trades = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'TRADING_ASSET',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      })

      const reportData = {
        period: { startDate, endDate },
        totalTrades: trades.length,
        trades: trades.map(trade => {
          const data = JSON.parse(trade.fileUrl || '{}')
          return {
            symbol: data.symbol,
            quantity: data.quantity,
            purchasePrice: data.purchasePrice,
            currentPrice: data.currentPrice,
            return: ((data.currentPrice - data.purchasePrice) / data.purchasePrice) * 100
          }
        })
      }

      // Generate report file (simplified)
      const reportId = `report_${Date.now()}`
      const downloadUrl = `/api/trading/reports/${reportId}.pdf`

      await this.auditService.log({
        userId,
        action: 'TRADING_REPORT_GENERATED',
        resourceType: 'TRADING',
        resourceId: 'TRADING_REPORT',
        actionDetails: { reportId, period: { startDate, endDate } }
      })

      return {
        reportId,
        downloadUrl
      }
    } catch (error: any) {
      await this.auditService.log({
        action: 'TRADING_REPORT_GENERATION_FAILED',
        resourceType: 'TRADING',
        resourceId: 'TRADING_REPORT',
        actionDetails: { error: error.message },
        userId,
      })
      throw error
    }
  }
}