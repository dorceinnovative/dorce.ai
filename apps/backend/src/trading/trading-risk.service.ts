import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { SecurityService } from '../security/security.service'

@Injectable()
export class TradingRiskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly securityService: SecurityService
  ) {}

  async assessRisk(userId: string, tradeData: {
    symbol: string
    quantity: number
    price: number
    side: 'BUY' | 'SELL'
  }): Promise<{
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    riskScore: number
    recommendations: string[]
  }> {
    try {
      // Risk assessment logic
      const riskScore = Math.random() * 100
      const riskLevel = riskScore < 30 ? 'LOW' : riskScore < 70 ? 'MEDIUM' : 'HIGH'
      
      const recommendations: string[] = []
      if (riskLevel === 'HIGH') {
        recommendations.push('Consider reducing position size')
        recommendations.push('Set stop-loss orders')
      }

      await this.auditService.log({
        userId,
        action: 'RISK_ASSESSMENT',
        resourceType: 'TRADING',
        actionDetails: { tradeData, riskScore, riskLevel }
      })

      return {
        riskLevel,
        riskScore,
        recommendations
      }
    } catch (error: any) {
      await this.auditService.log({
        userId,
        action: 'RISK_ASSESSMENT_FAILED',
        resourceType: 'TRADING',
        actionDetails: { error: error.message }
      })
      throw error
    }
  }

  async setRiskLimits(userId: string, limits: {
    maxPositionSize: number
    maxDailyLoss: number
    maxMonthlyLoss: number
  }): Promise<void> {
    try {
      // Store risk limits as a document
      const riskLimitData = {
        userId,
        limits,
        type: 'RISK_LIMIT',
        createdAt: new Date().toISOString(),
      };
      
      await this.prisma.document.upsert({
        where: { 
          id: `risk-limit-${userId}`
        },
        update: {
          fileUrl: JSON.stringify(riskLimitData),
          updatedAt: new Date(),
        },
        create: {
          id: `risk-limit-${userId}`,
          type: 'OTHER',
          fileName: `risk-limit-${userId}`,
          fileUrl: JSON.stringify(riskLimitData),
          fileSize: 512,
          mimeType: 'application/json',
          userId,
        }
      })

      await this.auditService.log({
        userId,
        action: 'RISK_LIMITS_SET',
        resourceType: 'TRADING',
        actionDetails: { limits }
      })
    } catch (error: any) {
      await this.auditService.log({
        userId,
        action: 'RISK_LIMITS_SET_FAILED',
        resourceType: 'TRADING',
        actionDetails: { error: error.message }
      })
      throw error
    }
  }

  async checkRiskLimits(userId: string, proposedTrade: {
    quantity: number
    price: number
    symbol: string
  }): Promise<{
    allowed: boolean
    reason?: string
  }> {
    try {
      // Get risk limits from document
      const riskLimitDoc = await this.prisma.document.findFirst({
        where: { 
          userId,
          fileUrl: {
            contains: '"type":"RISK_LIMIT"'
          }
        }
      })

      if (!riskLimitDoc) {
        return { allowed: true }
      }

      // Parse risk limits from document
      const limits = JSON.parse(riskLimitDoc.fileUrl as string).limits;

      // Get current positions from trading documents
      const currentPositions = await this.prisma.document.findMany({
        where: { 
          userId,
          fileUrl: {
            contains: '"type":"TRADE_EXECUTION"'
          }
        }
      })

      // Calculate total exposure from positions
      let totalExposure = 0;
      currentPositions.forEach(pos => {
        const posData = JSON.parse(pos.fileUrl as string);
        if (posData.side === 'BUY' && posData.status === 'EXECUTED') {
          totalExposure += posData.totalCost;
        }
      });
      const proposedExposure = proposedTrade.quantity * proposedTrade.price

      if (totalExposure + proposedExposure > limits.maxPositionSize) {
        return {
          allowed: false,
          reason: 'Position size exceeds risk limits'
        }
      }

      return { allowed: true }
    } catch (error: any) {
      await this.auditService.log({
        userId,
        action: 'RISK_LIMIT_CHECK_FAILED',
        resourceType: 'TRADING',
        actionDetails: { error: error.message }
      })
      throw error
    }
  }
}