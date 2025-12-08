import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface InvestmentRecommendation {
  id: string;
  userId: string;
  investmentType: string;
  name: string;
  description: string;
  expectedReturn: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  reasoning: string[];
  createdAt: Date;
}

export interface RecommendationCriteria {
  userId: string;
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  investmentAmount: number;
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  preferredTypes?: string[];
}

@Injectable()
export class InvestmentRecommendationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async generateRecommendations(criteria: RecommendationCriteria): Promise<InvestmentRecommendation[]> {
    try {
      // Get user investment history
      const userInvestments = await this.prisma.document.findMany({
        where: {
          userId: criteria.userId,
          type: 'OTHER',
          fileName: 'INVESTMENT_RECORD'
        }
      });

      const investmentHistory = userInvestments.map(doc => JSON.parse(doc.fileUrl || '{}'));
      
      // Generate recommendations based on criteria and history
      const recommendations = this.createRecommendations(criteria, investmentHistory);

      // Store recommendations
      const storedRecommendations: any[] = [];
      for (const rec of recommendations) {
        const recDoc = await this.prisma.document.create({
        data: {
          userId: criteria.userId,
          type: 'OTHER',
          fileName: 'INVESTMENT_RECOMMENDATION',
          fileSize: 0,
          mimeType: 'application/json',
          fileUrl: JSON.stringify(rec)
        }
      });
        storedRecommendations.push({
          ...rec,
          id: recDoc.id
        });
      }

      await this.auditService.log({
        userId: criteria.userId,
        action: 'INVESTMENT_RECOMMENDATIONS_GENERATED',
        resourceType: 'INVESTMENT_RECOMMENDATION',
        actionDetails: { 
          riskTolerance: criteria.riskTolerance,
          investmentAmount: criteria.investmentAmount,
          recommendationCount: storedRecommendations.length
        }
      });

      return storedRecommendations;
    } catch (error) {
      await this.auditService.log({
        userId: criteria.userId,
        action: 'INVESTMENT_RECOMMENDATIONS_GENERATION_FAILED',
        resourceType: 'INVESTMENT_RECOMMENDATION',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getUserRecommendations(userId: string, limit: number = 10): Promise<InvestmentRecommendation[]> {
    try {
      const recommendationDocs = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'INVESTMENT_RECOMMENDATION'
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      const recommendations = recommendationDocs.map(doc => {
        const data = JSON.parse(doc.fileUrl || '{}');
        return {
          id: doc.id,
          ...data
        };
      });

      await this.auditService.log({
        userId,
        action: 'INVESTMENT_RECOMMENDATIONS_ACCESSED',
        resourceType: 'INVESTMENT_RECOMMENDATION',
        actionDetails: { count: recommendations.length }
      });

      return recommendations;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'INVESTMENT_RECOMMENDATIONS_ACCESS_FAILED',
        resourceType: 'INVESTMENT_RECOMMENDATION',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async acceptRecommendation(userId: string, recommendationId: string): Promise<void> {
    try {
      const recommendationDoc = await this.prisma.document.findFirst({
        where: {
          id: recommendationId,
          userId,
          type: 'OTHER',
          fileName: 'INVESTMENT_RECOMMENDATION'
        }
      });

      if (!recommendationDoc) {
        throw new Error('Recommendation not found');
      }

      // Update recommendation status (add accepted flag)
      const recommendationData = JSON.parse(recommendationDoc.fileUrl || '{}');
      recommendationData.accepted = true;
      recommendationData.acceptedAt = new Date();

      await this.prisma.document.update({
        where: { id: recommendationId },
        data: {
          fileUrl: JSON.stringify(recommendationData)
        }
      });

      await this.auditService.log({
        userId,
        action: 'INVESTMENT_RECOMMENDATION_ACCEPTED',
        resourceType: 'INVESTMENT_RECOMMENDATION',
        resourceId: recommendationId,
        actionDetails: { recommendationId }
      });
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'INVESTMENT_RECOMMENDATION_ACCEPTANCE_FAILED',
        resourceType: 'INVESTMENT_RECOMMENDATION',
        resourceId: recommendationId,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  private createRecommendations(criteria: RecommendationCriteria, history: any[]): InvestmentRecommendation[] {
    const recommendations: InvestmentRecommendation[] = [];
    const baseReturn = this.getBaseReturnForRisk(criteria.riskTolerance);

    // Stock recommendations
    if (this.shouldRecommendType('STOCKS', criteria, history)) {
      recommendations.push({
        id: '', // Will be set when stored
        userId: criteria.userId,
        investmentType: 'STOCKS',
        name: 'Diversified Stock Portfolio',
        description: 'A mix of large-cap and growth stocks',
        expectedReturn: baseReturn + 3,
        riskLevel: this.getRiskLevelForType('STOCKS', criteria.riskTolerance),
        confidence: 0.8,
        reasoning: ['Historical strong performance', 'Good for long-term growth'],
        createdAt: new Date()
      });
    }

    // Bond recommendations
    if (this.shouldRecommendType('BONDS', criteria, history)) {
      recommendations.push({
        id: '',
        userId: criteria.userId,
        investmentType: 'BONDS',
        name: 'Government Bond Portfolio',
        description: 'Low-risk government bonds',
        expectedReturn: baseReturn - 1,
        riskLevel: 'LOW',
        confidence: 0.9,
        reasoning: ['Stable returns', 'Low volatility'],
        createdAt: new Date()
      });
    }

    // Real Estate recommendations
    if (this.shouldRecommendType('REAL_ESTATE', criteria, history)) {
      recommendations.push({
        id: '',
        userId: criteria.userId,
        investmentType: 'REAL_ESTATE',
        name: 'REIT Portfolio',
        description: 'Real Estate Investment Trusts',
        expectedReturn: baseReturn + 2,
        riskLevel: 'MEDIUM',
        confidence: 0.7,
        reasoning: ['Diversification benefits', 'Inflation hedge'],
        createdAt: new Date()
      });
    }

    // Crypto recommendations (only for aggressive investors)
    if (criteria.riskTolerance === 'AGGRESSIVE' && this.shouldRecommendType('CRYPTO', criteria, history)) {
      recommendations.push({
        id: '',
        userId: criteria.userId,
        investmentType: 'CRYPTO',
        name: 'Cryptocurrency Portfolio',
        description: 'Major cryptocurrencies like BTC and ETH',
        expectedReturn: baseReturn + 10,
        riskLevel: 'HIGH',
        confidence: 0.6,
        reasoning: ['High growth potential', 'Portfolio diversification'],
        createdAt: new Date()
      });
    }

    return recommendations;
  }

  private getBaseReturnForRisk(riskTolerance: string): number {
    switch (riskTolerance) {
      case 'CONSERVATIVE': return 5;
      case 'MODERATE': return 8;
      case 'AGGRESSIVE': return 12;
      default: return 8;
    }
  }

  private getRiskLevelForType(type: string, tolerance: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const typeRisk = {
      'STOCKS': 'MEDIUM',
      'BONDS': 'LOW',
      'REAL_ESTATE': 'MEDIUM',
      'CRYPTO': 'HIGH'
    };

    return typeRisk[type as keyof typeof typeRisk] as 'LOW' | 'MEDIUM' | 'HIGH';
  }

  private shouldRecommendType(type: string, criteria: RecommendationCriteria, history: any[]): boolean {
    // Simple logic - can be enhanced
    if (criteria.preferredTypes && !criteria.preferredTypes.includes(type)) {
      return false;
    }

    // Don't recommend types already heavily invested in
    const existingAllocation = history.filter(inv => inv.type === type).reduce((sum, inv) => sum + inv.amount, 0);
    if (existingAllocation > criteria.investmentAmount * 0.5) {
      return false;
    }

    return true;
  }
}