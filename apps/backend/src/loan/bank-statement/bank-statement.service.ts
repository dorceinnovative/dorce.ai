import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface BankStatement {
  id: string;
  userId: string;
  bankAccountId: string;
  statementPeriod: string;
  startDate: Date;
  endDate: Date;
  fileUrl: string;
  fileName: string;
  transactions: any[];
  analysis?: any;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankStatementAnalysis {
  averageMonthlyIncome: number;
  averageMonthlyExpenses: number;
  incomeStability: number;
  expenseCategories: { [key: string]: number };
  topMerchants: string[];
  riskIndicators: string[];
}

@Injectable()
export class BankStatementService {
  private readonly logger = new Logger(BankStatementService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getBankStatements(userId: string): Promise<BankStatement[]> {
    try {
      const statements = await this.prisma.bankStatement.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100, // Last 100 statements
      });

      return statements.map(stmt => ({
        id: stmt.id,
        userId: stmt.userId,
        bankAccountId: stmt.bankAccountId,
        statementPeriod: stmt.statementPeriod,
        startDate: stmt.startDate,
        endDate: stmt.endDate,
        fileUrl: stmt.fileUrl,
        fileName: stmt.fileName,
        transactions: stmt.transactions,
        analysis: stmt.analysis,
        status: stmt.status,
        createdAt: stmt.createdAt,
        updatedAt: stmt.updatedAt,
      }));
    } catch (error) {
      this.logger.error(`Error fetching bank statements for user ${userId}:`, error);
      throw error;
    }
  }

  async analyzeBankStatements(userId: string): Promise<BankStatementAnalysis> {
    const statements = await this.getBankStatements(userId);
    
    if (statements.length === 0) {
      return {
        averageMonthlyIncome: 0,
        averageMonthlyExpenses: 0,
        incomeStability: 0,
        expenseCategories: {},
        topMerchants: [],
        riskIndicators: [],
      };
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentStatements = statements.filter(stmt => 
      new Date(stmt.createdAt) >= sixMonthsAgo
    );

    return {
      averageMonthlyIncome: this.calculateAverageMonthlyIncome(recentStatements),
      averageMonthlyExpenses: this.calculateAverageMonthlyExpenses(recentStatements),
      incomeStability: this.calculateIncomeStability(recentStatements),
      expenseCategories: this.categorizeExpenses(recentStatements),
      topMerchants: this.identifyTopMerchants(recentStatements),
      riskIndicators: this.identifyRiskIndicators(recentStatements),
    };
  }

  async saveBankStatement(statement: Omit<BankStatement, 'id'>): Promise<BankStatement> {
    try {
      const savedStatement = await this.prisma.bankStatement.create({
        data: {
          userId: statement.userId,
          bankAccountId: statement.bankAccountId,
          statementPeriod: statement.statementPeriod,
          startDate: statement.startDate,
          endDate: statement.endDate,
          fileUrl: statement.fileUrl,
          fileName: statement.fileName,
          transactions: statement.transactions,
          analysis: statement.analysis,
          status: statement.status,
        },
      });

      return {
        id: savedStatement.id,
        userId: savedStatement.userId,
        bankAccountId: savedStatement.bankAccountId,
        statementPeriod: savedStatement.statementPeriod,
        startDate: savedStatement.startDate,
        endDate: savedStatement.endDate,
        fileUrl: savedStatement.fileUrl,
        fileName: savedStatement.fileName,
        transactions: savedStatement.transactions,
        analysis: savedStatement.analysis,
        status: savedStatement.status,
        createdAt: savedStatement.createdAt,
        updatedAt: savedStatement.updatedAt,
      };
    } catch (error) {
      this.logger.error('Error saving bank statement:', error);
      throw error;
    }
  }

  async saveBankStatements(statements: Omit<BankStatement, 'id'>[]): Promise<BankStatement[]> {
    try {
      const savedStatements = await this.prisma.bankStatement.createMany({
        data: statements.map(stmt => ({
          userId: stmt.userId,
          bankAccountId: stmt.bankAccountId,
          statementPeriod: stmt.statementPeriod,
          startDate: stmt.startDate,
          endDate: stmt.endDate,
          fileUrl: stmt.fileUrl,
          fileName: stmt.fileName,
          transactions: stmt.transactions,
          analysis: stmt.analysis,
          status: stmt.status,
        })),
      });

      // Return the saved statements (we need to fetch them to get IDs)
      return this.getBankStatements(statements[0].userId);
    } catch (error) {
      this.logger.error('Error saving bank statements:', error);
      throw error;
    }
  }

  private calculateAverageMonthlyIncome(statements: BankStatement[]): number {
    const monthlyIncome: { [key: string]: number } = {};
    
    statements.forEach(stmt => {
      // Process transactions from the JSON array
      if (Array.isArray(stmt.transactions)) {
        stmt.transactions.forEach((transaction: any) => {
          if (transaction.type === 'CREDIT' || transaction.amount > 0) {
            const monthKey = new Date(transaction.date || stmt.startDate).toISOString().slice(0, 7);
            monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + Math.abs(transaction.amount || 0);
          }
        });
      }
    });

    const incomes = Object.values(monthlyIncome);
    if (incomes.length === 0) return 0;

    return incomes.reduce((sum, income) => sum + income, 0) / incomes.length;
  }

  private calculateAverageMonthlyExpenses(statements: BankStatement[]): number {
    const monthlyExpenses: { [key: string]: number } = {};
    
    statements.forEach(stmt => {
      // Process transactions from the JSON array
      if (Array.isArray(stmt.transactions)) {
        stmt.transactions.forEach((transaction: any) => {
          if (transaction.type === 'DEBIT' || transaction.amount < 0) {
            const monthKey = new Date(transaction.date || stmt.startDate).toISOString().slice(0, 7);
            monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + Math.abs(transaction.amount || 0);
          }
        });
      }
    });

    const expenses = Object.values(monthlyExpenses);
    if (expenses.length === 0) return 0;

    return expenses.reduce((sum, expense) => sum + expense, 0) / expenses.length;
  }

  private calculateIncomeStability(statements: BankStatement[]): number {
    const monthlyIncome: { [key: string]: number } = {};
    
    statements.forEach(stmt => {
      // Process transactions from the JSON array
      if (Array.isArray(stmt.transactions)) {
        stmt.transactions.forEach((transaction: any) => {
          if (transaction.type === 'CREDIT' || transaction.amount > 0) {
            const monthKey = new Date(transaction.date || stmt.startDate).toISOString().slice(0, 7);
            monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + Math.abs(transaction.amount || 0);
          }
        });
      }
    });

    const incomes = Object.values(monthlyIncome);
    if (incomes.length < 2) return 0;

    const avgIncome = incomes.reduce((sum, income) => sum + income, 0) / incomes.length;
    const variance = incomes.reduce((sum, income) => sum + Math.pow(income - avgIncome, 2), 0) / incomes.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Coefficient of variation (lower is better)
    const cv = standardDeviation / avgIncome;
    
    // Convert to stability score (0-1, where 1 is most stable)
    return Math.max(0, 1 - cv);
  }

  private categorizeExpenses(statements: BankStatement[]): { [key: string]: number } {
    const categories: { [key: string]: number } = {};
    
    statements.forEach(stmt => {
      // Process transactions from the JSON array
      if (Array.isArray(stmt.transactions)) {
        stmt.transactions.forEach((transaction: any) => {
          if (transaction.type === 'DEBIT' || transaction.amount < 0) {
            const category = this.categorizeTransaction(transaction.description || '');
            categories[category] = (categories[category] || 0) + Math.abs(transaction.amount || 0);
          }
        });
      }
    });

    return categories;
  }

  private categorizeTransaction(description: string): string {
    const descriptionLower = description.toLowerCase();
    
    // Common expense categories
    if (descriptionLower.includes('pos') || descriptionLower.includes('purchase')) {
      return 'purchases';
    } else if (descriptionLower.includes('transfer') || descriptionLower.includes('trf')) {
      return 'transfers';
    } else if (descriptionLower.includes('atm')) {
      return 'cash_withdrawal';
    } else if (descriptionLower.includes('fee') || descriptionLower.includes('charge')) {
      return 'fees';
    } else if (descriptionLower.includes('airtime') || descriptionLower.includes('data')) {
      return 'telecom';
    } else if (descriptionLower.includes('electricity') || descriptionLower.includes('power')) {
      return 'utilities';
    } else if (descriptionLower.includes('salary') || descriptionLower.includes('wage')) {
      return 'salary_related';
    } else {
      return 'other';
    }
  }

  private identifyTopMerchants(statements: BankStatement[]): string[] {
    const merchants: { [key: string]: number } = {};
    
    statements.forEach(stmt => {
      // Process transactions from the JSON array
      if (Array.isArray(stmt.transactions)) {
        stmt.transactions.forEach((transaction: any) => {
          const merchant = this.extractMerchant(transaction.description || '');
          if (merchant) {
            merchants[merchant] = (merchants[merchant] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(merchants)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([merchant]) => merchant);
  }

  private extractMerchant(description: string): string | null {
    // Simple merchant extraction - in reality, this would be more sophisticated
    const commonPatterns = [
      /POS\s+([A-Z0-9\s]+)/i,
      /PURCHASE\s+([A-Z0-9\s]+)/i,
      /TRANSFER\s+TO\s+([A-Z0-9\s]+)/i,
    ];

    for (const pattern of commonPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private identifyRiskIndicators(statements: BankStatement[]): string[] {
    const indicators: string[] = [];
    
    // Check for gambling transactions
    const gamblingKeywords = ['bet', 'lottery', 'casino', 'gambling', 'sportybet', 'bet9ja'];
    const hasGambling = statements.some(stmt => 
      gamblingKeywords.some(keyword => 
        stmt.description.toLowerCase().includes(keyword)
      )
    );
    
    if (hasGambling) {
      indicators.push('gambling_transactions');
    }

    // Check for frequent overdrafts
    const overdraftCount = statements.filter(stmt => stmt.balance < 0).length;
    if (overdraftCount > statements.length * 0.1) {
      indicators.push('frequent_overdrafts');
    }

    // Check for unusual large transactions
    const amounts = statements.map(stmt => Math.abs(stmt.amount));
    const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const largeTransactions = statements.filter(stmt => Math.abs(stmt.amount) > avgAmount * 10);
    
    if (largeTransactions.length > 0) {
      indicators.push('unusual_large_transactions');
    }

    // Check for rapid account draining
    const monthlyBalances = this.calculateMonthlyEndingBalances(statements);
    const hasRapidDrain = monthlyBalances.some((balance, index) => {
      if (index === 0) return false;
      return balance < monthlyBalances[index - 1] * 0.5;
    });

    if (hasRapidDrain) {
      indicators.push('rapid_account_draining');
    }

    return indicators;
  }

  private calculateMonthlyEndingBalances(statements: BankStatement[]): number[] {
    const monthlyBalances: { [key: string]: number } = {};
    
    statements.forEach(stmt => {
      const monthKey = new Date(stmt.date).toISOString().slice(0, 7);
      monthlyBalances[monthKey] = stmt.balance;
    });

    return Object.values(monthlyBalances);
  }

  async deleteBankStatements(userId: string): Promise<void> {
    try {
      await this.prisma.bankStatement.deleteMany({
        where: { userId },
      });
    } catch (error) {
      this.logger.error(`Error deleting bank statements for user ${userId}:`, error);
      throw error;
    }
  }

  async getBankStatementsByAccount(bankAccountId: string): Promise<BankStatement[]> {
    try {
      const statements = await this.prisma.bankStatement.findMany({
        where: { bankAccountId },
        orderBy: { date: 'desc' },
      });

      return statements.map(stmt => ({
        id: stmt.id,
        userId: stmt.userId,
        bankAccountId: stmt.bankAccountId,
        date: stmt.date,
        description: stmt.description,
        amount: stmt.amount,
        balance: stmt.balance,
        transactionType: stmt.transactionType as 'CREDIT' | 'DEBIT',
        category: stmt.category,
      }));
    } catch (error) {
      this.logger.error(`Error fetching bank statements for account ${bankAccountId}:`, error);
      throw error;
    }
  }
}