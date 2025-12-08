import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface RiskAssessmentDto {
  userId: string;
  investmentId: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number;
  riskFactors: string[];
  assessmentDate: Date;
  nextReviewDate: Date;
}

@Injectable()
export class InvestmentRiskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async assessInvestmentRisk(userId: string, investmentId: string): Promise<RiskAssessmentDto> {
    try {
      // Get investment data
      const investmentDoc = await this.prisma.document.findFirst({
        where: {
          id: investmentId,
          userId,
          type: 'OTHER',
          fileName: 'INVESTMENT_RECORD'
        }
      });

      if (!investmentDoc) {
        throw new Error('Investment not found');
      }

      const investmentData = JSON.parse(investmentDoc.fileUrl || '{}');
      
      // Simplified risk assessment
      const riskScore = this.calculateRiskScore(investmentData);
      const riskLevel = this.getRiskLevel(riskScore);
      const riskFactors = this.identifyRiskFactors(investmentData);

      const riskAssessment = {
        userId,
        investmentId,
        riskLevel,
        riskScore,
        riskFactors,
        assessmentDate: new Date(),
        nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      // Store risk assessment
      await this.prisma.document.create({
        data: {
          userId,
          type: 'OTHER',
          fileName: 'RISK_ASSESSMENT',
          fileSize: 0,
          mimeType: 'application/json',
          fileUrl: JSON.stringify(riskAssessment)
        }
      });

      await this.auditService.log({
        userId,
        action: 'INVESTMENT_RISK_ASSESSED',
        resourceType: 'INVESTMENT',
        resourceId: investmentId,
        actionDetails: { riskLevel, riskScore }
      });

      return riskAssessment;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'INVESTMENT_RISK_ASSESSMENT_FAILED',
        resourceType: 'INVESTMENT',
        resourceId: investmentId,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getInvestmentRiskHistory(userId: string, investmentId: string): Promise<RiskAssessmentDto[]> {
    try {
      const riskDocs = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'RISK_ASSESSMENT',
          fileUrl: {
            contains: `"investmentId":"${investmentId}"`
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const riskHistory = riskDocs.map(doc => JSON.parse(doc.fileUrl || '{}'));

      await this.auditService.log({
        userId,
        action: 'INVESTMENT_RISK_HISTORY_ACCESSED',
        resourceType: 'INVESTMENT',
        resourceId: investmentId,
        actionDetails: { historyCount: riskHistory.length }
      });

      return riskHistory;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'INVESTMENT_RISK_HISTORY_ACCESS_FAILED',
        resourceType: 'INVESTMENT',
        resourceId: investmentId,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  private calculateRiskScore(investment: any): number {
    let score = 0;

    // Risk based on type
    const typeRisk = {
      'STOCKS': 7,
      'BONDS': 3,
      'REAL_ESTATE': 5,
      'COMMODITIES': 8,
      'CRYPTO': 9,
      'MUTUAL_FUNDS': 4,
      'ETF': 6
    };

    score += typeRisk[investment.type as keyof typeof typeRisk] || 5;

    // Risk based on expected return
    if (investment.expectedReturn > 15) score += 3;
    else if (investment.expectedReturn > 10) score += 2;
    else if (investment.expectedReturn > 5) score += 1;

    // Risk based on duration
    if (investment.duration && investment.duration.includes('long')) score += 2;

    return Math.min(score, 10); // Cap at 10
  }

  private getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score <= 3) return 'LOW';
    if (score <= 6) return 'MEDIUM';
    return 'HIGH';
  }

  private identifyRiskFactors(investment: any): string[] {
    const factors: string[] = [];

    if (investment.expectedReturn > 15) {
      factors.push('High expected returns');
    }

    if (investment.type === 'CRYPTO') {
      factors.push('Cryptocurrency volatility');
    }

    if (investment.type === 'STOCKS') {
      factors.push('Market volatility');
    }

    if (investment.duration && investment.duration.includes('long')) {
      factors.push('Long-term commitment');
    }

    return factors;
  }
}