import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BankStatementIntegrationService } from './bank-statement-integration.service';

export interface AIScores {
  identityScore: number; // ISS (0-100)
  financialScore: number; // FSS (0-100)
  behavioralScore: number; // BIS (0-100)
  repaymentScore: number; // RCS (0-100)
  finalScore: number; // Weighted final score
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
  factors: {
    positive: string[];
    negative: string[];
    warnings: string[];
  };
}

export interface ScoringContext {
  userId: string;
  loanAmount: number;
  loanTenure: number;
  bvn: string;
  bankStatementId?: string;
  employmentStatus?: string;
  monthlyIncome?: number;
}

@Injectable()
export class AIScoringService {
  constructor(
    private prisma: PrismaService,
    private bankStatementService: BankStatementIntegrationService,
  ) {}

  async calculateScores(context: ScoringContext): Promise<AIScores> {
    const [
      identityScore,
      financialScore,
      behavioralScore,
      repaymentScore,
    ] = await Promise.all([
      this.calculateIdentityScore(context),
      this.calculateFinancialScore(context),
      this.calculateBehavioralScore(context),
      this.calculateRepaymentScore(context),
    ]);

    // Calculate weighted final score as per blueprint formula
    const finalScore = 
      (identityScore * 0.25) + 
      (financialScore * 0.40) + 
      (behavioralScore * 0.20) + 
      (repaymentScore * 0.15);

    const riskLevel = this.determineRiskLevel(finalScore);
    const recommendation = this.getRecommendation(finalScore, riskLevel);
    const factors = this.analyzeFactors(
      identityScore,
      financialScore,
      behavioralScore,
      repaymentScore,
      context,
    );

    return {
      identityScore,
      financialScore,
      behavioralScore,
      repaymentScore,
      finalScore: Math.round(finalScore * 100) / 100,
      riskLevel,
      recommendation,
      factors,
    };
  }

  private async calculateIdentityScore(context: ScoringContext): Promise<number> {
    let score = 0;

    try {
      const user = await this.prisma.user.findUnique({ where: { id: context.userId } });
      if (!user) return 0;

      const kyc = await this.prisma.kYC.findUnique({ where: { userId: context.userId } });
      if (kyc?.status === 'APPROVED') score += 30;

      let profileScore = 0;
      if (user.firstName && user.lastName) profileScore += 10;
      if (user.phoneNumber) profileScore += 10;
      score += profileScore;

      const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000);
      if (accountAgeDays > 180) score += 15;
      else if (accountAgeDays > 90) score += 10;
      else if (accountAgeDays > 30) score += 5;

    } catch (error) {
      console.error('Error calculating identity score:', error);
    }

    return Math.min(100, Math.max(0, score));
  }

  private async calculateFinancialScore(context: ScoringContext): Promise<number> {
    let score = 0;

    try {
      // Bank statement analysis (60 points max)
      if (context.bankStatementId) {
        const statementAnalysis = await this.analyzeBankStatement(context.bankStatementId);
        score += statementAnalysis.score;
      }

      // Employment stability (20 points)
      if (context.employmentStatus === 'EMPLOYED') score += 20;
      else if (context.employmentStatus === 'SELF_EMPLOYED') score += 15;
      else if (context.employmentStatus === 'CONTRACT') score += 10;

      // Monthly income (20 points)
      if (context.monthlyIncome && context.monthlyIncome > 50000) {
        score += Math.min(20, (context.monthlyIncome / 100000) * 20);
      }

    } catch (error) {
      console.error('Error calculating financial score:', error);
    }

    return Math.min(100, Math.max(0, score));
  }

  private async calculateBehavioralScore(context: ScoringContext): Promise<number> {
    let score = 50; // Base score

    try {
      const transactions = await this.prisma.walletTransaction.findMany({
        where: { userId: context.userId },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      if (transactions.length >= 10) score += 10;

      // Additional activity bonus based on recent wallet transactions
      const recentTxCount = transactions.length;
      if (recentTxCount > 0) {
        score += 10;
      }

      // Repayment history (if any previous loans)
      const loanHistory = await this.prisma.loanApplication.findMany({
        where: {
          userId: context.userId,
          status: 'APPROVED',
        },
        include: {
          repayments: true,
        },
      });

      if (loanHistory.length > 0) {
        let onTimePayments = 0;
        let totalPayments = 0;

        loanHistory.forEach(loan => {
          loan.repayments.forEach(repayment => {
            totalPayments++;
            if (repayment.status === 'PAID' && repayment.paidAt) {
              onTimePayments++;
            }
          });
        });

        if (totalPayments > 0) {
          const repaymentRate = onTimePayments / totalPayments;
          if (repaymentRate >= 0.95) score += 20;
          else if (repaymentRate >= 0.85) score += 15;
          else if (repaymentRate >= 0.70) score += 10;
          else if (repaymentRate < 0.50) score -= 20;
        }
      }

    } catch (error) {
      console.error('Error calculating behavioral score:', error);
    }

    return Math.min(100, Math.max(0, score));
  }

  private async calculateRepaymentScore(context: ScoringContext): Promise<number> {
    let score = 0;

    try {
      // Income vs loan amount ratio (40 points)
      if (context.monthlyIncome) {
        const loanToIncomeRatio = (context.loanAmount / 100) / context.monthlyIncome;
        
        if (loanToIncomeRatio <= 0.2) score += 40;
        else if (loanToIncomeRatio <= 0.4) score += 30;
        else if (loanToIncomeRatio <= 0.6) score += 20;
        else if (loanToIncomeRatio <= 0.8) score += 10;
      }

      // Loan tenure appropriateness (20 points)
      if (context.loanTenure <= 6) score += 20; // Short term loans preferred
      else if (context.loanTenure <= 12) score += 15;
      else if (context.loanTenure <= 24) score += 10;

      // Existing loan burden (25 points)
      const existingLoans = await this.prisma.loanApplication.findMany({
        where: {
          userId: context.userId,
          status: 'APPROVED',
        },
      });

      if (existingLoans.length === 0) {
        score += 25; // No existing loans
      } else {
        // Calculate existing monthly burden
        let totalMonthlyBurden = 0;
        existingLoans.forEach(loan => {
          const monthlyPayment = this.calculateMonthlyRepayment(
            Number(loan.amount || 0),
            loan.tenure,
          );
          totalMonthlyBurden += monthlyPayment;
        });

        const burdenRatio = totalMonthlyBurden / (context.monthlyIncome || 1);
        
        if (burdenRatio <= 0.3) score += 20;
        else if (burdenRatio <= 0.5) score += 15;
        else if (burdenRatio <= 0.7) score += 5;
      }

      // Employment stability (15 points)
      if (context.employmentStatus === 'EMPLOYED') score += 15;
      else if (context.employmentStatus === 'SELF_EMPLOYED') score += 10;

    } catch (error) {
      console.error('Error calculating repayment score:', error);
    }

    return Math.min(100, Math.max(0, score));
  }

  private determineRiskLevel(finalScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    if (finalScore >= 75) return 'LOW';
    if (finalScore >= 60) return 'MEDIUM';
    if (finalScore >= 40) return 'HIGH';
    return 'VERY_HIGH';
  }

  private getRecommendation(finalScore: number, riskLevel: string): 'APPROVE' | 'REVIEW' | 'REJECT' {
    if (finalScore >= 70 && riskLevel === 'LOW') return 'APPROVE';
    if (finalScore >= 50 && riskLevel !== 'VERY_HIGH') return 'REVIEW';
    return 'REJECT';
  }

  private analyzeFactors(
    identityScore: number,
    financialScore: number,
    behavioralScore: number,
    repaymentScore: number,
    context: ScoringContext,
  ) {
    const positive: string[] = [];
    const negative: string[] = [];
    const warnings: string[] = [];

    if (identityScore >= 70) positive.push('Strong identity verification');
    else if (identityScore < 40) negative.push('Weak identity verification');

    if (financialScore >= 70) positive.push('Strong financial profile');
    else if (financialScore < 40) negative.push('Weak financial profile');

    if (behavioralScore >= 70) positive.push('Good behavioral patterns');
    else if (behavioralScore < 40) negative.push('Concerning behavioral patterns');

    if (repaymentScore >= 70) positive.push('Strong repayment capacity');
    else if (repaymentScore < 40) negative.push('Weak repayment capacity');

    if (context.loanTenure > 24) warnings.push('Long loan tenure increases risk');
    if (context.monthlyIncome && context.monthlyIncome < 30000) {
      warnings.push('Low monthly income');
    }

    return { positive, negative, warnings };
  }

  private async analyzeBankStatement(statementId: string): Promise<{ score: number }> {
    try {
      // Get bank statement data
      const statement = await this.prisma.bankStatement.findUnique({
        where: { id: statementId },
      });

      if (!statement) return { score: 0 };

      const txs = (statement.transactions as any[]) || [];
      let score = 0;

      const balances = txs.map(tx => Number(tx.balance || 0));
      const avgBalance = balances.length ? balances.reduce((a, b) => a + b, 0) / balances.length : 0;
      if (avgBalance > 100000) score += 30;
      else if (avgBalance > 50000) score += 20;
      else if (avgBalance > 20000) score += 10;

      const transactionCount = txs.length;
      if (transactionCount > 50) score += 20;
      else if (transactionCount > 20) score += 15;
      else if (transactionCount > 10) score += 10;

      const credits = txs.filter(tx => tx.type === 'credit');
      const debits = txs.filter(tx => tx.type === 'debit');
      const totalIncome = credits.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      const totalExpenses = debits.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

      const monthlyIncome: { [key: string]: number } = {};
      credits.forEach(tx => {
        const d = new Date(tx.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthlyIncome[key] = (monthlyIncome[key] || 0) + Number(tx.amount || 0);
      });
      const regularIncomeCount = Object.values(monthlyIncome).filter(v => v > 50000).length;
      if (regularIncomeCount > 2) score += 30;
      else if (regularIncomeCount > 1) score += 20;
      else if (credits.length > 0) score += 10;

      const expenseRatio = totalIncome > 0 ? totalExpenses / totalIncome : 1;
      if (expenseRatio < 0.6) score += 20;
      else if (expenseRatio < 0.8) score += 15;
      else if (expenseRatio < 1.0) score += 10;

      return { score: Math.min(60, score) };

    } catch (error) {
      console.error('Error analyzing bank statement:', error);
      return { score: 0 };
    }
  }

  private calculateMonthlyRepayment(principal: number, tenureMonths: number): number {
    // Simple calculation - can be enhanced with interest calculation
    const monthlyInterestRate = 0.03; // 3% monthly
    const monthlyPayment = (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, tenureMonths)) /
      (Math.pow(1 + monthlyInterestRate, tenureMonths) - 1);
    
    return monthlyPayment;
  }
}