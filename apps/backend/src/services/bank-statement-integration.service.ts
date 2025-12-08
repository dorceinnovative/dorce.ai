import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

export interface BankStatementProvider {
  mono: {
    secretKey: string;
    publicKey: string;
    baseUrl: string;
  };
  okra: {
    secretKey: string;
    publicKey: string;
    baseUrl: string;
  };
  onepipe: {
    secretKey: string;
    publicKey: string;
    baseUrl: string;
  };
}

export interface ConnectBankAccountDto {
  userId: string;
  bankCode: string;
  accountNumber: string;
  provider: 'mono' | 'okra' | 'onepipe';
}

export interface BankStatementData {
  accountNumber: string;
  bankName: string;
  accountName: string;
  accountType: string;
  balance: number;
  currency: string;
  transactions: TransactionData[];
  statementPeriod: {
    startDate: Date;
    endDate: Date;
  };
}

export interface TransactionData {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  balance: number;
  category?: string;
  reference?: string;
}

export interface StatementAnalysis {
  averageBalance: number;
  totalIncome: number;
  totalExpenses: number;
  incomeCount: number;
  expenseCount: number;
  regularIncomeCount: number;
  transactionCount: number;
  monthlyAverageIncome: number;
  monthlyAverageExpense: number;
  incomeConsistency: number;
  expenseCategories: { [key: string]: number };
}

@Injectable()
export class BankStatementIntegrationService {
  private config: BankStatementProvider;

  constructor(
    private httpService: HttpService,
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {
    this.config = {
      mono: {
        secretKey: process.env.MONO_SECRET_KEY || '',
        publicKey: process.env.MONO_PUBLIC_KEY || '',
        baseUrl: 'https://api.withmono.com',
      },
      okra: {
        secretKey: process.env.OKRA_SECRET_KEY || '',
        publicKey: process.env.OKRA_PUBLIC_KEY || '',
        baseUrl: 'https://api.okra.ng',
      },
      onepipe: {
        secretKey: process.env.ONEPIPE_SECRET_KEY || '',
        publicKey: process.env.ONEPIPE_PUBLIC_KEY || '',
        baseUrl: 'https://api.onepipe.io',
      },
    };
  }

  async connectBankAccount(connectData: ConnectBankAccountDto): Promise<any> {
    try {
      let connectionData: any;

      switch (connectData.provider) {
        case 'mono':
          connectionData = await this.connectMonoAccount(connectData);
          break;
        case 'okra':
          connectionData = await this.connectOkraAccount(connectData);
          break;
        case 'onepipe':
          connectionData = await this.connectOnepipeAccount(connectData);
          break;
        default:
          throw new HttpException('Invalid provider', HttpStatus.BAD_REQUEST);
      }

      // Save bank account connection
      const bankAccount = await this.prisma.bankAccount.create({
        data: {
          userId: connectData.userId,
          bankName: connectionData.bankName,
          accountNumber: connectionData.accountNumber,
          accountName: connectionData.accountName,
          accountType: connectionData.accountType || 'SAVINGS',
          isVerified: true,
          isPrimary: false,
        },
      });

      // Send notification
      await this.notificationService.sendNotification({
        userId: connectData.userId,
        type: 'GENERAL',
        title: 'Bank Account Connected',
        message: `Your ${connectionData.bankName} account has been successfully connected.`,
        channels: ['email', 'push'],
        metadata: {
          bankName: connectionData.bankName,
          accountNumber: connectionData.accountNumber,
          provider: connectData.provider,
        },
      });

      return {
        success: true,
        bankAccount,
        connectionData,
      };
    } catch (error) {
      // Log error
      await this.prisma.paymentLog.create({
        data: {
          userId: connectData.userId,
          type: 'BANK_CONNECTION',
          amount: 0,
          currency: 'NGN',
          status: 'FAILED',
          gateway: connectData.provider,
          reference: `${connectData.provider}_${Date.now()}`,
          metadata: {
            ...JSON.parse(JSON.stringify(connectData)),
            error: error instanceof Error ? error.message : String(error),
          },
        },
      });

      throw error;
    }
  }

  private async connectMonoAccount(connectData: ConnectBankAccountDto): Promise<any> {
    const payload = {
      code: connectData.bankCode,
      account_number: connectData.accountNumber,
    };

    const response: any = await firstValueFrom(
      this.httpService.post(`${this.config.mono.baseUrl}/v1/accounts/auth`, payload, {
        headers: {
          'mono-sec-key': this.config.mono.secretKey,
          'Content-Type': 'application/json',
        },
      })
    );

    if (response.data.status === 'successful') {
      const data = response.data.data;
      return {
        bankName: data.institution.name,
        accountNumber: data.account.number,
        accountName: data.account.name,
        accountType: data.account.type,
        balance: data.account.balance,
        currency: data.account.currency,
        connectionId: data.id,
      };
    } else {
      throw new HttpException('Bank connection failed', HttpStatus.BAD_REQUEST);
    }
  }

  private async connectOkraAccount(connectData: ConnectBankAccountDto): Promise<any> {
    const payload = {
      bank: connectData.bankCode,
      account_number: connectData.accountNumber,
    };

    const response: any = await firstValueFrom(
      this.httpService.post(`${this.config.okra.baseUrl}/v2/accounts/connect`, payload, {
        headers: {
          'Authorization': `Bearer ${this.config.okra.secretKey}`,
          'Content-Type': 'application/json',
        },
      })
    );

    if (response.data.status === 'success') {
      const data = response.data.data;
      return {
        bankName: data.bank.name,
        accountNumber: data.account.number,
        accountName: data.account.name,
        accountType: data.account.type,
        balance: data.account.balance.available,
        currency: data.account.currency,
        connectionId: data.id,
      };
    } else {
      throw new HttpException('Bank connection failed', HttpStatus.BAD_REQUEST);
    }
  }

  private async connectOnepipeAccount(connectData: ConnectBankAccountDto): Promise<any> {
    const payload = {
      bank_code: connectData.bankCode,
      account_number: connectData.accountNumber,
    };

    const response: any = await firstValueFrom(
      this.httpService.post(`${this.config.onepipe.baseUrl}/v1/accounts/verify`, payload, {
        headers: {
          'Authorization': `Bearer ${this.config.onepipe.secretKey}`,
          'Content-Type': 'application/json',
        },
      })
    );

    if (response.data.status === 'success') {
      const data = response.data.data;
      return {
        bankName: data.bank_name,
        accountNumber: data.account_number,
        accountName: data.account_name,
        accountType: data.account_type,
        balance: data.available_balance,
        currency: data.currency,
        connectionId: data.account_id,
      };
    } else {
      throw new HttpException('Bank connection failed', HttpStatus.BAD_REQUEST);
    }
  }

  async fetchBankStatement(userId: string, accountId: string, period: { startDate: Date; endDate: Date }): Promise<BankStatementData> {
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { id: accountId, userId },
      include: { statements: true },
    });

    if (!bankAccount) {
      throw new HttpException('Bank account not found', HttpStatus.NOT_FOUND);
    }

    // Determine provider from existing payment logs
    const connectionLog = await this.prisma.paymentLog.findFirst({
      where: { 
        userId, 
        type: 'BANK_CONNECTION',
        status: 'SUCCESS' 
      },
      orderBy: { createdAt: 'desc' },
    });

    const provider = (connectionLog?.metadata as any)?.provider || 'mono'; // Default to mono

    let statementData: BankStatementData;

    switch (provider) {
      case 'mono':
        statementData = await this.fetchMonoStatement(bankAccount, period);
        break;
      case 'okra':
        statementData = await this.fetchOkraStatement(bankAccount, period);
        break;
      case 'onepipe':
        statementData = await this.fetchOnepipeStatement(bankAccount, period);
        break;
      default:
        throw new HttpException('Invalid provider', HttpStatus.BAD_REQUEST);
    }

    // Save statement data to database
    await this.saveStatementData(bankAccount.id, statementData);

    return statementData;
  }

  private async fetchMonoStatement(bankAccount: any, period: { startDate: Date; endDate: Date }): Promise<BankStatementData> {
    const response: any = await firstValueFrom(
      this.httpService.get(`${this.config.mono.baseUrl}/v1/accounts/${bankAccount.id}/statement`, {
        params: {
          start: period.startDate.toISOString().split('T')[0],
          end: period.endDate.toISOString().split('T')[0],
        },
        headers: {
          'mono-sec-key': this.config.mono.secretKey,
          'Content-Type': 'application/json',
        },
      })
    );

    if (response.data.status === 'successful') {
      const data = response.data.data;
      return {
        accountNumber: bankAccount.accountNumber,
        bankName: bankAccount.bankName,
        accountName: bankAccount.accountName,
        accountType: bankAccount.accountType,
        balance: data.balance,
        currency: data.currency,
        transactions: data.transactions.map((tx: any) => ({
          id: tx.id,
          date: new Date(tx.date),
          description: tx.narration,
          amount: Math.abs(tx.amount),
          type: tx.amount >= 0 ? 'credit' : 'debit',
          balance: tx.balance,
          category: tx.category,
          reference: tx.reference,
        })),
        statementPeriod: {
          startDate: new Date(data.period.start),
          endDate: new Date(data.period.end),
        },
      };
    } else {
      throw new HttpException('Failed to fetch bank statement', HttpStatus.BAD_REQUEST);
    }
  }

  private async fetchOkraStatement(bankAccount: any, period: { startDate: Date; endDate: Date }): Promise<BankStatementData> {
    const response: any = await firstValueFrom(
      this.httpService.get(`${this.config.okra.baseUrl}/v2/accounts/${bankAccount.id}/transactions`, {
        params: {
          from: period.startDate.toISOString().split('T')[0],
          to: period.endDate.toISOString().split('T')[0],
        },
        headers: {
          'Authorization': `Bearer ${this.config.okra.secretKey}`,
          'Content-Type': 'application/json',
        },
      })
    );

    if (response.data.status === 'success') {
      const data = response.data.data;
      const transactions = data.transactions || [];
      
      return {
        accountNumber: bankAccount.accountNumber,
        bankName: bankAccount.bankName,
        accountName: bankAccount.accountName,
        accountType: bankAccount.accountType,
        balance: data.balance?.available || 0,
        currency: data.currency || 'NGN',
        transactions: transactions.map((tx: any) => ({
          id: tx.id,
          date: new Date(tx.date),
          description: tx.description || tx.narration,
          amount: Math.abs(tx.amount),
          type: tx.credit ? 'credit' : 'debit',
          balance: tx.balance,
          category: tx.category,
          reference: tx.ref,
        })),
        statementPeriod: {
          startDate: period.startDate,
          endDate: period.endDate,
        },
      };
    } else {
      throw new HttpException('Failed to fetch bank statement', HttpStatus.BAD_REQUEST);
    }
  }

  private async fetchOnepipeStatement(bankAccount: any, period: { startDate: Date; endDate: Date }): Promise<BankStatementData> {
    const response: any = await firstValueFrom(
      this.httpService.get(`${this.config.onepipe.baseUrl}/v1/accounts/${bankAccount.id}/transactions`, {
        params: {
          start_date: period.startDate.toISOString().split('T')[0],
          end_date: period.endDate.toISOString().split('T')[0],
        },
        headers: {
          'Authorization': `Bearer ${this.config.onepipe.secretKey}`,
          'Content-Type': 'application/json',
        },
      })
    );

    if (response.data.status === 'success') {
      const data = response.data.data;
      return {
        accountNumber: bankAccount.accountNumber,
        bankName: bankAccount.bankName,
        accountName: bankAccount.accountName,
        accountType: bankAccount.accountType,
        balance: data.current_balance,
        currency: data.currency,
        transactions: data.transactions.map((tx: any) => ({
          id: tx.transaction_id,
          date: new Date(tx.transaction_date),
          description: tx.description,
          amount: Math.abs(tx.amount),
          type: tx.type,
          balance: tx.balance,
          category: tx.category,
          reference: tx.reference,
        })),
        statementPeriod: {
          startDate: new Date(data.start_date),
          endDate: new Date(data.end_date),
        },
      };
    } else {
      throw new HttpException('Failed to fetch bank statement', HttpStatus.BAD_REQUEST);
    }
  }

  private async saveStatementData(accountId: string, statementData: BankStatementData) {
    const user = await this.prisma.bankAccount.findUnique({ where: { id: accountId } });
    await this.prisma.bankStatement.create({
      data: {
        userId: user!.userId,
        bankAccountId: accountId,
        transactions: statementData.transactions.map(t => ({
          id: t.id,
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          balance: t.balance,
          category: t.category,
          reference: t.reference,
        })),
        fileName: `${statementData.bankName}_${statementData.accountNumber}_${Date.now()}.pdf`,
        fileUrl: `statements/${accountId}/${Date.now()}.pdf`,
        statementPeriod: `${statementData.statementPeriod.startDate.toISOString()}_${statementData.statementPeriod.endDate.toISOString()}`,
        startDate: statementData.statementPeriod.startDate,
        endDate: statementData.statementPeriod.endDate,
        status: 'PENDING',
      },
    });
  }

  async analyzeBankStatement(userId: string, accountId: string): Promise<StatementAnalysis> {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { bankAccountId: accountId },
      orderBy: { endDate: 'desc' },
    });

    if (!statement) {
      throw new HttpException('No bank statement data found', HttpStatus.NOT_FOUND);
    }

    // Calculate analysis metrics
    const txs = (statement.transactions as any[]) || [];
    const credits = txs.filter(tx => tx.type === 'credit');
    const debits = txs.filter(tx => tx.type === 'debit');

    const totalIncome = credits.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const totalExpenses = debits.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const averageBalance = txs.reduce((sum, tx) => sum + Number(tx.balance || 0), 0) / Math.max(1, txs.length);

    // Calculate monthly averages
    const months = new Set(txs.map((tx: any) => {
      const d = new Date(tx.date);
      return `${d.getFullYear()}-${d.getMonth()}`;
    })).size;
    const monthlyAverageIncome = totalIncome / Math.max(1, months);
    const monthlyAverageExpense = totalExpenses / Math.max(1, months);

    // Calculate income consistency
    const monthlyIncome: { [key: string]: number } = {};
    credits.forEach(tx => {
      const monthKey = `${tx.date.getFullYear()}-${tx.date.getMonth()}`;
      monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + tx.amount.toNumber();
    });

    const incomeValues = Object.values(monthlyIncome);
    const avgMonthlyIncome = incomeValues.reduce((sum, income) => sum + income, 0) / incomeValues.length;
    const incomeVariance = incomeValues.reduce((sum, income) => sum + Math.pow(income - avgMonthlyIncome, 2), 0) / incomeValues.length;
    const incomeConsistency = avgMonthlyIncome > 0 ? Math.sqrt(incomeVariance) / avgMonthlyIncome : 1;

    // Categorize expenses
    const expenseCategories: { [key: string]: number } = {};
    debits.forEach((tx: any) => {
      const category = tx.category || 'OTHER';
      expenseCategories[category] = (expenseCategories[category] || 0) + Number(tx.amount || 0);
    });

    // Count regular income (salary-like patterns)
    const regularIncomeCount = credits.filter((tx: any) => {
      const amount = Number(tx.amount || 0);
      const isSalaryLike = amount > 50000 && amount < 500000; // Reasonable salary range
      const isMonthlyPattern = credits.filter((c: any) => {
        const cAmount = Number(c.amount || 0);
        return Math.abs(cAmount - amount) / amount < 0.1; // Within 10% variance
      }).length >= 2;
      return isSalaryLike && isMonthlyPattern;
    }).length;

    return {
      averageBalance,
      totalIncome,
      totalExpenses,
      incomeCount: credits.length,
      expenseCount: debits.length,
      regularIncomeCount,
      transactionCount: txs.length,
      monthlyAverageIncome,
      monthlyAverageExpense,
      incomeConsistency: Math.max(0, 100 - (incomeConsistency * 100)), // Convert to score (0-100)
      expenseCategories,
    };
  }

  async getConnectedAccounts(userId: string) {
    return this.prisma.bankAccount.findMany({
      where: { userId },
      include: {
        statements: {
          orderBy: { endDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async disconnectBankAccount(userId: string, accountId: string): Promise<any> {
    const account = await this.prisma.bankAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new HttpException('Bank account not found', HttpStatus.NOT_FOUND);
    }

    // Delete associated statements first
    await this.prisma.bankStatement.deleteMany({
      where: { bankAccountId: accountId },
    });

    // Delete the account
    await this.prisma.bankAccount.delete({
      where: { id: accountId },
    });

    // Send notification
    await this.notificationService.sendNotification({
      userId,
      type: 'GENERAL',
      title: 'Bank Account Disconnected',
      message: `Your ${account.bankName} account has been disconnected.`,
      channels: ['email', 'push'],
      metadata: {
        bankName: account.bankName,
        accountNumber: account.accountNumber,
      },
    });

    return {
      success: true,
      message: 'Bank account disconnected successfully',
    };
  }
}
