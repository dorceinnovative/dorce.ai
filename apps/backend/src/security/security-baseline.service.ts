import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerEntryType, LedgerStatus, TransactionType, TransactionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as crypto from 'crypto';

export interface LedgerEntryData {
  walletId: string;
  entryType: LedgerEntryType;
  debitAmount?: Decimal;
  creditAmount?: Decimal;
  transactionId?: string;
  reference: string;
  externalReference?: string;
  accountCode: string;
  description: string;
  metadata?: Record<string, any>;
  status?: LedgerStatus;
}

export interface AuditLogData {
  action: string;
  resourceType: string;
  resourceId?: string;
  userId?: string;
  walletId?: string;
  systemId?: string;
  details: Record<string, any>;
  metadata?: Record<string, any>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  complianceFlags?: string[];
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  city?: string;
}

@Injectable()
export class SecurityBaselineService {
  private readonly logger = new Logger(SecurityBaselineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create immutable ledger entry with cryptographic integrity
   */
  async createLedgerEntry(data: LedgerEntryData): Promise<any> {
    const client = await this.prisma.$connect();
    
    try {
      // Start transaction for atomic ledger operations
      return await this.prisma.$transaction(async (tx) => {
        // Get previous ledger entry for hash chain
        const previousEntry = await tx.ledgerEntry.findFirst({
          where: { walletId: data.walletId },
          orderBy: { createdAt: 'desc' },
          select: { currentHash: true, balance: true }
        });

        // Calculate new balance
        const previousBalance = previousEntry?.balance || new Decimal(0);
        let newBalance = previousBalance;
        
        if (data.entryType === 'DEBIT') {
          newBalance = previousBalance.minus(data.debitAmount || 0);
        } else {
          newBalance = previousBalance.plus(data.creditAmount || 0);
        }

        // Generate cryptographic hash for integrity
        const hashData = {
          walletId: data.walletId,
          entryType: data.entryType,
          debitAmount: data.debitAmount?.toString(),
          creditAmount: data.creditAmount?.toString(),
          balance: newBalance.toString(),
          reference: data.reference,
          previousHash: previousEntry?.currentHash || 'GENESIS',
          timestamp: new Date().toISOString()
        };

        const currentHash = crypto
          .createHash('sha256')
          .update(JSON.stringify(hashData))
          .digest('hex');

        // Create ledger entry with immutable hash
        const ledgerEntry = await tx.ledgerEntry.create({
          data: {
            walletId: data.walletId,
            entryType: data.entryType,
            debitAmount: data.debitAmount || new Decimal(0),
            creditAmount: data.creditAmount || new Decimal(0),
            balance: newBalance,
            transactionId: data.transactionId,
            reference: data.reference,
            externalReference: data.externalReference,
            accountCode: data.accountCode,
            description: data.description,
            metadata: data.metadata || {},
            status: data.status || LedgerStatus.PENDING,
            previousHash: previousEntry?.currentHash || 'GENESIS',
            currentHash,
            entryDate: new Date()
          }
        });

        // Audit log for ledger entry creation
        await this.createAuditLog({
          action: 'LEDGER_ENTRY_CREATED',
          resourceType: 'LedgerEntry',
          resourceId: ledgerEntry.id,
          walletId: data.walletId,
          details: {
            entryType: data.entryType,
            amount: data.entryType === 'DEBIT' ? data.debitAmount : data.creditAmount,
            balance: newBalance,
            reference: data.reference,
            accountCode: data.accountCode
          },
          riskLevel: this.calculateRiskLevel(data),
          complianceFlags: ['FINANCIAL_TRANSACTION', 'LEDGER_ENTRY']
        });

        return ledgerEntry;
      });
    } catch (error) {
      this.logger.error(`Failed to create ledger entry: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Create immutable audit log with cryptographic integrity
   */
  async createAuditLog(data: AuditLogData): Promise<any> {
    try {
      // Get previous audit log for hash chain
      const previousLog = await this.prisma.auditLog.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { currentHash: true }
      });

      // Generate cryptographic hash for audit integrity
      const hashData = {
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        userId: data.userId,
        walletId: data.walletId,
        details: data.details,
        previousHash: previousLog?.currentHash || 'GENESIS',
        timestamp: new Date().toISOString()
      };

      const currentHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(hashData))
        .digest('hex');

      // Create immutable audit log
      const auditLog = await this.prisma.auditLog.create({
        data: {
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          userId: data.userId,
          walletId: data.walletId,
          systemId: data.systemId,
          details: data.details,
          metadata: data.metadata || {},
          riskLevel: data.riskLevel,
          complianceFlags: data.complianceFlags || [],
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          country: data.country,
          city: data.city,
          previousHash: previousLog?.currentHash || 'GENESIS',
          currentHash
        }
      });

      // Log high-risk activities
      if (data.rLevel === 'HIGH' || data.riskLevel === 'CRITICAL') {
        this.logger.warn(`High-risk activity detected: ${data.action}`, {
          auditLogId: auditLog.id,
          userId: data.userId,
          resourceType: data.resourceType,
          riskLevel: data.riskLevel
        });
      }

      return auditLog;
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Process double-entry transaction with complete audit trail
   */
  async processDoubleEntryTransaction(params: {
    sourceWalletId: string;
    destinationWalletId?: string;
    amount: Decimal;
    transactionType: TransactionType;
    description: string;
    reference: string;
    externalReference?: string;
    metadata?: Record<string, any>;
    userId?: string;
  }): Promise<any> {
    return await this.prisma.$transaction(async (tx) => {
      // Create main transaction record
      const transaction = await tx.transaction.create({
        data: {
          walletId: params.sourceWalletId,
          type: params.transactionType,
          amount: params.amount,
          description: params.description,
          status: TransactionStatus.PROCESSING,
          direction: params.destinationWalletId ? 'OUTGOING' : 'INCOMING',
          reference: params.reference,
          externalReference: params.externalReference,
          metadata: params.metadata || {}
        }
      });

      // Create source wallet ledger entry (debit)
      const sourceEntry = await this.createLedgerEntry({
        walletId: params.sourceWalletId,
        entryType: LedgerEntryType.DEBIT,
        debitAmount: params.amount,
        transactionId: transaction.id,
        reference: `${params.reference}-DEBIT`,
        externalReference: params.externalReference,
        accountCode: this.getAccountCode(params.transactionType, 'SOURCE'),
        description: `${params.description} - Source Account`,
        metadata: { transactionType: params.transactionType, side: 'SOURCE' }
      });

      // Create destination wallet ledger entry if applicable (credit)
      if (params.destinationWalletId) {
        const destinationEntry = await this.createLedgerEntry({
          walletId: params.destinationWalletId,
          entryType: LedgerEntryType.CREDIT,
          creditAmount: params.amount,
          transactionId: transaction.id,
          reference: `${params.reference}-CREDIT`,
          externalReference: params.externalReference,
          accountCode: this.getAccountCode(params.transactionType, 'DESTINATION'),
          description: `${params.description} - Destination Account`,
          metadata: { transactionType: params.transactionType, side: 'DESTINATION' }
        });
      }

      // Update transaction status
      const updatedTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED, completedAt: new Date() }
      });

      // Create comprehensive audit log
      await this.createAuditLog({
        action: 'TRANSACTION_PROCESSED',
        resourceType: 'Transaction',
        resourceId: transaction.id,
        userId: params.userId,
        walletId: params.sourceWalletId,
        details: {
          transactionType: params.transactionType,
          amount: params.amount,
          sourceWalletId: params.sourceWalletId,
          destinationWalletId: params.destinationWalletId,
          reference: params.reference,
          ledgerEntries: [sourceEntry.id, destinationEntry?.id].filter(Boolean)
        },
        riskLevel: this.calculateTransactionRisk(params.amount, params.transactionType),
        complianceFlags: ['FINANCIAL_TRANSACTION', 'DOUBLE_ENTRY', 'AUDIT_TRAIL']
      });

      return updatedTransaction;
    });
  }

  /**
   * Verify ledger integrity using cryptographic hash chain
   */
  async verifyLedgerIntegrity(walletId: string): Promise<boolean> {
    try {
      const ledgerEntries = await this.prisma.ledgerEntry.findMany({
        where: { walletId },
        orderBy: { createdAt: 'asc' },
        select: {
          id,
          previousHash: true,
          currentHash: true,
          entryType: true,
          debitAmount: true,
          creditAmount: true,
          balance: true,
          reference: true,
          createdAt: true
        }
      });

      for (let i = 0; i < ledgerEntries.length; i++) {
        const entry = ledgerEntries[i];
        const previousEntry = i > 0 ? ledgerEntries[i - 1] : null;

        // Verify hash chain
        const expectedPreviousHash = previousEntry ? previousEntry.currentHash : 'GENESIS';
        if (entry.previousHash !== expectedPreviousHash) {
          this.logger.error(`Ledger integrity compromised: Previous hash mismatch for entry ${entry.id}`);
          return false;
        }

        // Recalculate and verify current hash
        const hashData = {
          walletId,
          entryType: entry.entryType,
          debitAmount: entry.debitAmount?.toString(),
          creditAmount: entry.creditAmount?.toString(),
          balance: entry.balance.toString(),
          reference: entry.reference,
          previousHash: entry.previousHash,
          timestamp: entry.createdAt.toISOString()
        };

        const calculatedHash = crypto
          .createHash('sha256')
          .update(JSON.stringify(hashData))
          .digest('hex');

        if (entry.currentHash !== calculatedHash) {
          this.logger.error(`Ledger integrity compromised: Current hash mismatch for entry ${entry.id}`);
          return false;
        }
      }

      this.logger.log(`Ledger integrity verified for wallet ${walletId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to verify ledger integrity: ${error.message}`, error);
      return false;
    }
  }

  /**
   * Get audit trail for specific resource
   */
  async getAuditTrail(resourceType: string, resourceId: string): Promise<any[]> {
    return await this.prisma.auditLog.findMany({
      where: {
        resourceType,
        resourceId
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  /**
   * Calculate risk level for ledger entry
   */
  private calculateRiskLevel(data: LedgerEntryData): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const amount = data.entryType === 'DEBIT' ? data.debitAmount : data.creditAmount;
    if (!amount) return 'LOW';

    const amountNum = amount.toNumber();
    
    if (amountNum > 10000000) return 'CRITICAL'; // > 10M NGN
    if (amountNum > 1000000) return 'HIGH'; // > 1M NGN
    if (amountNum > 100000) return 'MEDIUM'; // > 100K NGN
    return 'LOW';
  }

  /**
   * Calculate risk level for transaction
   */
  private calculateTransactionRisk(amount: Decimal, type: TransactionType): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const amountNum = amount.toNumber();
    
    // Higher risk for certain transaction types
    const typeMultiplier = ['WITHDRAWAL', 'TRANSFER'].includes(type) ? 1.5 : 1;
    const adjustedAmount = amountNum * typeMultiplier;
    
    if (adjustedAmount > 10000000) return 'CRITICAL';
    if (adjustedAmount > 1000000) return 'HIGH';
    if (adjustedAmount > 100000) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Get account code for transaction type
   */
  private getAccountCode(transactionType: TransactionType, side: 'SOURCE' | 'DESTINATION'): string {
    const accountCodes = {
      DEPOSIT: { SOURCE: '1001', DESTINATION: '2001' },
      WITHDRAWAL: { SOURCE: '5001', DESTINATION: '1001' },
      TRANSFER: { SOURCE: '6001', DESTINATION: '2001' },
      PAYMENT: { SOURCE: '4001', DESTINATION: '2001' },
      REFUND: { SOURCE: '7001', DESTINATION: '1001' },
      FEE: { SOURCE: '8001', DESTINATION: '2001' },
      TAX: { SOURCE: '9001', DESTINATION: '2001' },
      ESCROW: { SOURCE: '3001', DESTINATION: '3002' },
      SETTLEMENT: { SOURCE: '1001', DESTINATION: '2001' }
    };

    return accountCodes[transactionType]?.[side] || '9999';
  }

  /**
   * Get compliance report for specific time period
   */
  async getComplianceReport(startDate: Date, endDate: Date): Promise<any> {
    const [
      totalTransactions,
      highRiskTransactions,
      failedTransactions,
      auditLogs,
      complianceFlags
    ] = await Promise.all([
      this.prisma.transaction.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      this.prisma.transaction.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          riskScore: {
            gte: 700 // High risk threshold
          }
        }
      }),
      this.prisma.transaction.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'FAILED'
        }
      }),
      this.prisma.auditLog.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      this.prisma.auditLog.groupBy({
        by: ['complianceFlags'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: {
          complianceFlags: true
        }
      })
    ]);

    return {
      period: { startDate, endDate },
      transactions: {
        total: totalTransactions,
        highRisk: highRiskTransactions,
        failed: failedTransactions,
        complianceRate: ((totalTransactions - failedTransactions) / totalTransactions * 100).toFixed(2)
      },
      auditLogs: {
        total: auditLogs
      },
      complianceFlags: complianceFlags
    };
  }
}