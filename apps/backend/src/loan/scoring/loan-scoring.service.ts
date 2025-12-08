import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BankStatementService } from '../bank-statement/bank-statement.service';
import { NotificationService } from '../../notification/notification.service';

export interface ScoringResult {
  identityScore: number;      // ISS (0-100)
  financialScore: number;     // FSS (0-100)
  behavioralScore: number;    // BIS (0-100)
  repaymentScore: number;     // RCS (0-100)
  finalScore: number;         // Weighted final score (0-100)
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
  reasons: string[];
}

export interface ScoringContext {
  userId: string;
  loanAmount: number;
  loanPurpose: string;
  tenure: number;
  bankStatements?: any[];
  userProfile?: any;
  creditHistory?: any[];
}

@Injectable()
export class LoanScoringService {
  private readonly logger = new Logger(LoanScoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bankStatementService: BankStatementService,
    private readonly notificationService: NotificationService,
  ) {}

  async calculateScore(context: ScoringContext): Promise<ScoringResult> {
    this.logger.log(`Calculating loan score for user ${context.userId}`);

    try {
      // Calculate individual component scores
      const identityScore = await this.calculateIdentityScore(context);
      const financialScore = await this.calculateFinancialScore(context);
      const behavioralScore = await this.calculateBehavioralScore(context);
      const repaymentScore = await this.calculateRepaymentScore(context);

      // Calculate weighted final score
      const finalScore = this.calculateFinalScore({
        identityScore,
        financialScore,
        behavioralScore,
        repaymentScore,
      });

      // Generate recommendation
      const recommendation = this.generateRecommendation(finalScore);
      const reasons = this.generateReasons({
        identityScore,
        financialScore,
        behavioralScore,
        repaymentScore,
        finalScore,
      });

      const result: ScoringResult = {
        identityScore,
        financialScore,
        behavioralScore,
        repaymentScore,
        finalScore,
        recommendation,
        reasons,
      };

      this.logger.log(`Loan scoring completed for user ${context.userId}: Final Score ${finalScore}, Recommendation: ${recommendation}`);
      
      return result;
    } catch (error) {
      this.logger.error(`Error calculating loan score for user ${context.userId}:`, error);
      throw error;
    }
  }

  private async calculateIdentityScore(context: ScoringContext): Promise<number> {
    let score = 0;
    const user = await this.prisma.user.findUnique({
      where: { id: context.userId },
      include: {
        kyc: true,
        documents: true,
        verifications: true,
      },
    });

    if (!user) return 0;

    // BVN verification (20 points)
    if (user.kyc?.bvn) {
      score += 20;
    }

    // Government ID verification (15 points)
    const governmentId = user.documents.find(doc => 
      doc.type === 'GOVERNMENT_ID' && doc.status === 'VERIFIED'
    );
    if (governmentId) {
      score += 15;
    }

    // Address verification (15 points)
    const addressDoc = user.documents.find(doc => 
      doc.type === 'UTILITY_BILL' || doc.type === 'ADDRESS_PROOF'
    );
    if (addressDoc && addressDoc.status === 'VERIFIED') {
      score += 15;
    }

    // Phone number verification (10 points)
    if (user.phoneVerified) {
      score += 10;
    }

    // Email verification (10 points)
    if (user.emailVerified) {
      score += 10;
    }

    // Profile completeness (20 points) - using KYC data
    const kyc = user.kyc;
    if (kyc) {
      let profileScore = 0;
      if (user.firstName && user.lastName) profileScore += 5;
      if (kyc.dateOfBirth) profileScore += 5;
      if (kyc.address) profileScore += 5;
      if (kyc.city && kyc.state) profileScore += 5;
      score += profileScore;
    }

    // Social verification (10 points)
    const linkedInVerified = user.verifications.find(v => v.type === 'LINKEDIN');
    if (linkedInVerified && linkedInVerified.status === 'VERIFIED') {
      score += 5;
    }

    const employmentVerified = user.verifications.find(v => v.type === 'EMPLOYMENT');
    if (employmentVerified && employmentVerified.status === 'VERIFIED') {
      score += 5;
    }

    return Math.min(score, 100);
  }

  private async calculateFinancialScore(context: ScoringContext): Promise<number> {
    let score = 0;

    try {
      // Get bank statements if not provided
      if (!context.bankStatements) {
        context.bankStatements = await this.bankStatementService.getBankStatements(context.userId);
      }

      if (!context.bankStatements || context.bankStatements.length === 0) {
        return 0; // No financial data available
      }

      const statements = context.bankStatements;
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Filter last 6 months of statements
      const recentStatements = statements.filter(stmt => 
        new Date(stmt.date) >= sixMonthsAgo
      );

      if (recentStatements.length === 0) {
        return 0;
      }

      // Calculate average monthly balance (25 points)
      const monthlyBalances = this.calculateMonthlyBalances(recentStatements);
      const avgMonthlyBalance = monthlyBalances.reduce((sum, balance) => sum + balance, 0) / monthlyBalances.length;
      
      if (avgMonthlyBalance > context.loanAmount * 0.5) {
        score += 25;
      } else if (avgMonthlyBalance > context.loanAmount * 0.3) {
        score += 15;
      } else if (avgMonthlyBalance > context.loanAmount * 0.1) {
        score += 10;
      }

      // Income stability (25 points)
      const monthlyIncome = this.calculateMonthlyIncome(recentStatements);
      const incomeStability = this.calculateIncomeStability(monthlyIncome);
      
      if (incomeStability > 0.8) {
        score += 25;
      } else if (incomeStability > 0.6) {
        score += 20;
      } else if (incomeStability > 0.4) {
        score += 15;
      } else if (incomeStability > 0.2) {
        score += 10;
      }

      // Expense management (20 points)
      const monthlyExpenses = this.calculateMonthlyExpenses(recentStatements);
      const expenseRatio = monthlyExpenses.reduce((sum, expense) => sum + expense, 0) / 
                          monthlyIncome.reduce((sum, income) => sum + income, 0);
      
      if (expenseRatio < 0.5) {
        score += 20;
      } else if (expenseRatio < 0.7) {
        score += 15;
      } else if (expenseRatio < 0.9) {
        score += 10;
      }

      // Account activity (15 points)
      const avgMonthlyTransactions = recentStatements.length / 6;
      if (avgMonthlyTransactions > 20) {
        score += 15;
      } else if (avgMonthlyTransactions > 10) {
        score += 10;
      } else if (avgMonthlyTransactions > 5) {
        score += 5;
      }

      // Overdraft history (15 points)
      const overdraftMonths = monthlyBalances.filter(balance => balance < 0).length;
      if (overdraftMonths === 0) {
        score += 15;
      } else if (overdraftMonths <= 1) {
        score += 10;
      } else if (overdraftMonths <= 2) {
        score += 5;
      }

    } catch (error) {
      this.logger.error('Error calculating financial score:', error);
      return 0;
    }

    return Math.min(score, 100);
  }

  private async calculateBehavioralScore(context: ScoringContext): Promise<number> {
    let score = 0;

    try {
      // Get user's loan history
      const loanHistory = await this.prisma.loanApplication.findMany({
        where: { 
          userId: context.userId,
          status: { in: ['APPROVED', 'REJECTED', 'COMPLETED'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Previous loan performance (40 points)
      if (loanHistory.length > 0) {
        const completedLoans = loanHistory.filter(loan => loan.status === 'COMPLETED');
        const rejectedLoans = loanHistory.filter(loan => loan.status === 'REJECTED');
        
        if (completedLoans.length > 0) {
          const completionRate = completedLoans.length / loanHistory.length;
          if (completionRate >= 0.9) {
            score += 40;
          } else if (completionRate >= 0.7) {
            score += 30;
          } else if (completionRate >= 0.5) {
            score += 20;
          } else {
            score += 10;
          }
        } else if (rejectedLoans.length === loanHistory.length) {
          score += 0; // All previous loans rejected
        } else {
          score += 5; // Mixed history
        }
      } else {
        score += 25; // No previous loans (neutral)
      }

      // Application frequency (20 points)
      const recentApplications = loanHistory.filter(loan => {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return new Date(loan.createdAt) >= threeMonthsAgo;
      });

      if (recentApplications.length <= 2) {
        score += 20;
      } else if (recentApplications.length <= 4) {
        score += 15;
      } else if (recentApplications.length <= 6) {
        score += 10;
      } else {
        score += 5; // Too many recent applications
      }

      // Loan purpose analysis (20 points)
      const legitimatePurposes = [
        'business_expansion',
        'inventory_purchase',
        'equipment_purchase',
        'working_capital',
        'education',
        'medical',
        'home_improvement'
      ];

      if (legitimatePurposes.includes(context.loanPurpose.toLowerCase())) {
        score += 20;
      } else {
        score += 10;
      }

      // Account age and stability (20 points)
      const userAccount = await this.prisma.user.findUnique({
        where: { id: context.userId },
        select: { createdAt: true, isActive: true }
      });

      if (userAccount) {
        const accountAge = (new Date().getTime() - new Date(userAccount.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
        
        if (accountAge >= 12) {
          score += 20;
        } else if (accountAge >= 6) {
          score += 15;
        } else if (accountAge >= 3) {
          score += 10;
        } else {
          score += 5;
        }
      }

    } catch (error) {
      this.logger.error('Error calculating behavioral score:', error);
      return 0;
    }

    return Math.min(score, 100);
  }

  private async calculateRepaymentScore(context: ScoringContext): Promise<number> {
    let score = 0;

    try {
      // Get bank statements for repayment capacity analysis
      if (!context.bankStatements) {
        context.bankStatements = await this.bankStatementService.getBankStatements(context.userId);
      }

      if (!context.bankStatements || context.bankStatements.length === 0) {
        return 0;
      }

      const statements = context.bankStatements;
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const recentStatements = statements.filter(stmt => 
        new Date(stmt.date) >= sixMonthsAgo
      );

      if (recentStatements.length === 0) {
        return 0;
      }

      // Calculate monthly income and expenses
      const monthlyIncome = this.calculateMonthlyIncome(recentStatements);
      const monthlyExpenses = this.calculateMonthlyExpenses(recentStatements);
      
      const avgMonthlyIncome = monthlyIncome.reduce((sum, income) => sum + income, 0) / monthlyIncome.length;
      const avgMonthlyExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense, 0) / monthlyExpenses.length;
      const netMonthlyIncome = avgMonthlyIncome - avgMonthlyExpenses;

      // Calculate monthly loan repayment amount
      const monthlyRepayment = this.calculateMonthlyRepayment(context.loanAmount, context.tenure);

      // Debt-to-income ratio (40 points)
      const debtToIncomeRatio = monthlyRepayment / netMonthlyIncome;
      
      if (debtToIncomeRatio <= 0.3) {
        score += 40;
      } else if (debtToIncomeRatio <= 0.4) {
        score += 30;
      } else if (debtToIncomeRatio <= 0.5) {
        score += 20;
      } else if (debtToIncomeRatio <= 0.6) {
        score += 10;
      }

      // Income stability for repayment (30 points)
      const incomeStability = this.calculateIncomeStability(monthlyIncome);
      
      if (incomeStability > 0.8) {
        score += 30;
      } else if (incomeStability > 0.6) {
        score += 25;
      } else if (incomeStability > 0.4) {
        score += 20;
      } else if (incomeStability > 0.2) {
        score += 10;
      }

      // Loan amount vs income ratio (30 points)
      const loanToIncomeRatio = context.loanAmount / (avgMonthlyIncome * 12); // Annual income
      
      if (loanToIncomeRatio <= 0.5) {
        score += 30;
      } else if (loanToIncomeRatio <= 1.0) {
        score += 25;
      } else if (loanToIncomeRatio <= 1.5) {
        score += 20;
      } else if (loanToIncomeRatio <= 2.0) {
        score += 15;
      } else if (loanToIncomeRatio <= 3.0) {
        score += 10;
      }

    } catch (error) {
      this.logger.error('Error calculating repayment score:', error);
      return 0;
    }

    return Math.min(score, 100);
  }

  private calculateFinalScore(scores: {
    identityScore: number;
    financialScore: number;
    behavioralScore: number;
    repaymentScore: number;
  }): number {
    // Weighted formula: FinalScore = (ISS * 0.25) + (FSS * 0.40) + (BIS * 0.20) + (RCS * 0.15)
    const weightedScore = 
      (scores.identityScore * 0.25) +
      (scores.financialScore * 0.40) +
      (scores.behavioralScore * 0.20) +
      (scores.repaymentScore * 0.15);

    return Math.round(weightedScore * 100) / 100;
  }

  private generateRecommendation(finalScore: number): 'APPROVE' | 'REVIEW' | 'REJECT' {
    if (finalScore >= 70) {
      return 'APPROVE';
    } else if (finalScore >= 50) {
      return 'REVIEW';
    } else {
      return 'REJECT';
    }
  }

  private generateReasons(scores: {
    identityScore: number;
    financialScore: number;
    behavioralScore: number;
    repaymentScore: number;
    finalScore: number;
  }): string[] {
    const reasons: string[] = [];

    if (scores.identityScore < 50) {
      reasons.push('Insufficient identity verification');
    }

    if (scores.financialScore < 50) {
      reasons.push('Weak financial profile');
    }

    if (scores.behavioralScore < 50) {
      reasons.push('Poor credit behavior history');
    }

    if (scores.repaymentScore < 50) {
      reasons.push('Insufficient repayment capacity');
    }

    if (scores.finalScore >= 70) {
      reasons.push('Strong overall credit profile');
    } else if (scores.finalScore >= 50) {
      reasons.push('Moderate credit profile - manual review recommended');
    } else {
      reasons.push('High credit risk');
    }

    return reasons;
  }

  // Helper methods for financial calculations
  private calculateMonthlyBalances(statements: any[]): number[] {
    // Group statements by month and calculate ending balances
    const monthlyBalances: { [key: string]: number } = {};
    
    statements.forEach(stmt => {
      const monthKey = new Date(stmt.date).toISOString().slice(0, 7); // YYYY-MM
      monthlyBalances[monthKey] = stmt.endingBalance || 0;
    });

    return Object.values(monthlyBalances);
  }

  private calculateMonthlyIncome(statements: any[]): number[] {
    // Filter credit transactions and group by month
    const monthlyIncome: { [key: string]: number } = {};
    
    statements.forEach(stmt => {
      if (stmt.amount > 0) { // Credit transaction
        const monthKey = new Date(stmt.date).toISOString().slice(0, 7);
        monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + stmt.amount;
      }
    });

    return Object.values(monthlyIncome);
  }

  private calculateMonthlyExpenses(statements: any[]): number[] {
    // Filter debit transactions and group by month
    const monthlyExpenses: { [key: string]: number } = {};
    
    statements.forEach(stmt => {
      if (stmt.amount < 0) { // Debit transaction
        const monthKey = new Date(stmt.date).toISOString().slice(0, 7);
        monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + Math.abs(stmt.amount);
      }
    });

    return Object.values(monthlyExpenses);
  }

  private calculateIncomeStability(monthlyIncome: number[]): number {
    if (monthlyIncome.length < 2) return 0;

    const avgIncome = monthlyIncome.reduce((sum, income) => sum + income, 0) / monthlyIncome.length;
    const variance = monthlyIncome.reduce((sum, income) => sum + Math.pow(income - avgIncome, 2), 0) / monthlyIncome.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Coefficient of variation (lower is better)
    const cv = standardDeviation / avgIncome;
    
    // Convert to stability score (0-1, where 1 is most stable)
    return Math.max(0, 1 - cv);
  }

  private calculateMonthlyRepayment(loanAmount: number, tenure: number): number {
    // Simple calculation - in reality, this would use proper loan amortization
    const monthlyInterestRate = 0.02; // 2% monthly interest
    const totalAmount = loanAmount * (1 + monthlyInterestRate * tenure);
    return totalAmount / tenure;
  }
}