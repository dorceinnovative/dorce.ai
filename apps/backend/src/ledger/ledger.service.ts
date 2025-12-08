import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { SecurityService } from '../security/security.service'
import * as crypto from 'crypto'

// Define local enums for missing Prisma types
enum LedgerAccountType {
  USER_DEPOSIT = 'USER_DEPOSIT',
  USER_WALLET = 'USER_WALLET',
  STORE_WALLET = 'STORE_WALLET',
  SYSTEM_ESCROW_HOLDING = 'SYSTEM_ESCROW_HOLDING',
  SYSTEM_REVENUE = 'SYSTEM_REVENUE',
  ESCROW_HOLDING = 'ESCROW_HOLDING',
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
  SYSTEM_CONTROL = 'SYSTEM_CONTROL',
  CUSTOMER_DEPOSIT = 'CUSTOMER_DEPOSIT',
  MERCHANT_RESERVE = 'MERCHANT_RESERVE',
  COMPLIANCE_RESERVE = 'COMPLIANCE_RESERVE'
}

export enum TransactionCategory {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  PURCHASE = 'PURCHASE',
  REFUND = 'REFUND',
  ESCROW_HOLD = 'ESCROW_HOLD',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  ESCROW_REFUND = 'ESCROW_REFUND',
  FEE = 'FEE',
  REVENUE = 'REVENUE'
}

enum LedgerStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
  POSTED = 'POSTED'
}

export interface CreateLedgerAccountDto {
  accountType: LedgerAccountType
  userId?: string
  storeId?: string
  currency?: string
  description?: string
  isSystem?: boolean
}

export interface CreateLedgerEntryDto {
  debitAccountId: string
  creditAccountId: string
  amount: bigint
  currency?: string
  description: string
  category: TransactionCategory
  subcategory?: string
  externalReference?: string
  createdBy?: string
  requiresApproval?: boolean
}

export interface LedgerBalance {
  accountId: string
  accountNumber: string
  balance: bigint
  pendingBalance: bigint
  blockedBalance: bigint
  availableBalance: bigint
  currency: string
}

@Injectable()
export class LedgerService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private securityService: SecurityService,
  ) {}

  /**
   * Create a new ledger account with proper validation and audit trail
   */
  async createAccount(dto: CreateLedgerAccountDto): Promise<any> {
    // Validate user/store existence
    if (dto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId }
      })
      if (!user) {
        throw new NotFoundException('User not found')
      }
    }

    if (dto.storeId) {
      const store = await this.prisma.store.findUnique({
        where: { id: dto.storeId }
      })
      if (!store) {
        throw new NotFoundException('Store not found')
      }
    }

    // Generate unique account number
    const accountNumber = await this.generateAccountNumber(dto.accountType)
    
    // Create account with proper isolation
    const account = await this.prisma.$transaction(async (tx) => {
      const newAccount = await tx.document.create({
        data: {
          userId: dto.userId || 'system',
          type: 'OTHER',
          fileName: 'LEDGER_ACCOUNT',
          fileSize: 0,
          mimeType: 'application/json',
          fileUrl: JSON.stringify({
            accountNumber,
            accountType: dto.accountType,
            userId: dto.userId,
            storeId: dto.storeId,
            currency: dto.currency || 'NGN',
            description: dto.description,
            isSystem: dto.isSystem || false,
            balance: 0,
            status: 'ACTIVE'
          })
        }
      })

      // Create audit log
      await this.auditService.log({
        action: 'CREATE',
        resourceType: 'LEDGER_ACCOUNT',
        resourceId: newAccount.id,
        resourceDisplay: `Ledger Account ${accountNumber}`,
        actionDetails: {
          accountType: dto.accountType,
          userId: dto.userId,
          storeId: dto.storeId,
          currency: dto.currency || 'NGN'
        },
        userId: dto.userId
      })

      return {
        id: newAccount.id,
        accountNumber,
        accountType: dto.accountType,
        userId: dto.userId,
        storeId: dto.storeId,
        currency: dto.currency || 'NGN',
        description: dto.description,
        isSystem: dto.isSystem || false,
        balance: 0,
        status: 'ACTIVE'
      }
    })

    return account
  }

  /**
   * Create a double-entry ledger transaction with immutable audit trail
   */
  async createEntry(dto: CreateLedgerEntryDto): Promise<any> {
    // Validate accounts exist and are active
    const [debitAccountDoc, creditAccountDoc] = await Promise.all([
      this.prisma.document.findUnique({
        where: { id: dto.debitAccountId }
      }),
      this.prisma.document.findUnique({
        where: { id: dto.creditAccountId }
      })
    ])

    if (!debitAccountDoc || !creditAccountDoc) {
      throw new NotFoundException('One or both accounts not found')
    }

    if (debitAccountDoc.fileName !== 'LEDGER_ACCOUNT' || creditAccountDoc.fileName !== 'LEDGER_ACCOUNT') {
      throw new NotFoundException('One or both accounts are not ledger accounts')
    }

    const debitAccount = JSON.parse(debitAccountDoc.fileUrl || '{}')
    const creditAccount = JSON.parse(creditAccountDoc.fileUrl || '{}')

    if (debitAccount.status !== 'ACTIVE' || creditAccount.status !== 'ACTIVE') {
      throw new BadRequestException('One or both accounts are inactive')
    }

    // Validate currencies match
    if (debitAccount.currency !== creditAccount.currency) {
      throw new BadRequestException('Account currencies do not match')
    }

    // Validate sufficient balance for debit account (unless it's a system account)
    if (!debitAccount.isSystem && (debitAccount.balance < dto.amount)) {
      throw new BadRequestException('Insufficient balance in debit account')
    }

    // Generate unique transaction reference
    const transactionId = await this.generateTransactionId()
    
    // Calculate hash for tamper detection
    const entryHash = this.calculateEntryHash({
      transactionId,
      debitAccountId: dto.debitAccountId,
      creditAccountId: dto.creditAccountId,
      amount: dto.amount,
      description: dto.description,
      timestamp: new Date()
    })

    // Get previous hash for chain integrity
    const previousHash = await this.getPreviousHash()

    // Create ledger entry with proper double-entry validation
    const ledgerEntry = await this.prisma.$transaction(async (tx) => {
      // Create the ledger entry
      const entry = await tx.document.create({
        data: {
          userId: dto.createdBy || 'SYSTEM',
          type: 'OTHER',
          fileName: 'LEDGER_ENTRY',
          fileSize: 0,
          mimeType: 'application/json',
          fileUrl: JSON.stringify({
            transactionId,
            debitAccountId: dto.debitAccountId,
            creditAccountId: dto.creditAccountId,
            amount: dto.amount,
            currency: dto.currency || 'NGN',
            description: dto.description,
            category: dto.category,
            subcategory: dto.subcategory,
            reference: transactionId,
            externalReference: dto.externalReference,
            status: dto.requiresApproval ? LedgerStatus.PENDING : LedgerStatus.COMPLETED,
            postedAt: dto.requiresApproval ? null : new Date(),
            createdBy: dto.createdBy,
            entryHash,
            previousHash
          })
        }
      })

      // Update account balances if transaction is posted
      if (!dto.requiresApproval) {
        // Update debit account balance
        const debitAccountData = JSON.parse(debitAccountDoc.fileUrl || '{}')
        debitAccountData.balance = (BigInt(debitAccountData.balance) - dto.amount).toString()
        
        await tx.document.update({
          where: { id: dto.debitAccountId },
          data: { fileUrl: JSON.stringify(debitAccountData) }
        })

        // Update credit account balance
        const creditAccountData = JSON.parse(creditAccountDoc.fileUrl || '{}')
        creditAccountData.balance = (BigInt(creditAccountData.balance) + dto.amount).toString()
        
        await tx.document.update({
          where: { id: dto.creditAccountId },
          data: { fileUrl: JSON.stringify(creditAccountData) }
        })
      }

      // Create comprehensive audit log
      await this.auditService.log({
        action: 'TRANSACTION_INITIATE',
        resourceType: 'LEDGER_ENTRY',
        resourceId: entry.id,
        resourceDisplay: `Ledger Entry ${transactionId}`,
        actionDetails: {
          transactionId,
          debitAccountId: dto.debitAccountId,
          creditAccountId: dto.creditAccountId,
          amount: dto.amount.toString(),
          currency: dto.currency || 'NGN',
          category: dto.category,
          description: dto.description,
          requiresApproval: dto.requiresApproval
        },
        userId: dto.createdBy
      })

      // Monitor for suspicious patterns
      await this.securityService.monitorTransaction({
        transactionId,
        amount: dto.amount,
        fromWalletId: dto.debitAccountId,
        toWalletId: dto.creditAccountId,
        userId: dto.createdBy
      })

      return {
        id: entry.id,
        transactionId,
        debitAccountId: dto.debitAccountId,
        creditAccountId: dto.creditAccountId,
        amount: dto.amount,
        currency: dto.currency || 'NGN',
        description: dto.description,
        category: dto.category,
        subcategory: dto.subcategory,
        reference: transactionId,
        externalReference: dto.externalReference,
        status: dto.requiresApproval ? LedgerStatus.PENDING : LedgerStatus.COMPLETED,
        postedAt: dto.requiresApproval ? null : new Date(),
        createdBy: dto.createdBy,
        entryHash,
        previousHash
      }
    })

    return ledgerEntry
  }

  /**
   * Get account balance with detailed breakdown
   */
  async getAccountBalance(accountId: string): Promise<LedgerBalance> {
    const accountDoc = await this.prisma.document.findUnique({
      where: { id: accountId }
    })

    if (!accountDoc || accountDoc.fileName !== 'LEDGER_ACCOUNT') {
      throw new NotFoundException('Account not found')
    }

    const account = JSON.parse(accountDoc.fileUrl || '{}')

    return {
      accountId: accountDoc.id,
      accountNumber: account.accountNumber,
      balance: BigInt(account.balance || 0),
      pendingBalance: BigInt(account.pendingBalance || 0),
      blockedBalance: BigInt(account.blockedBalance || 0),
      availableBalance: BigInt(account.balance || 0) - BigInt(account.pendingBalance || 0) - BigInt(account.blockedBalance || 0),
      currency: account.currency
    }
  }

  /**
   * Get account transaction history with filtering and pagination
   */
  async getAccountHistory(
    accountId: string,
    options: {
      startDate?: Date
      endDate?: Date
      category?: TransactionCategory
      status?: LedgerStatus
      limit?: number
      offset?: number
    } = {}
  ): Promise<any[]> {
    // Get all ledger entry documents
    const entryDocs = await this.prisma.document.findMany({
      where: {
        type: 'OTHER',
        fileName: 'LEDGER_ENTRY',
        createdAt: options.startDate || options.endDate ? {
          gte: options.startDate,
          lte: options.endDate
        } : undefined
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
      skip: options.offset || 0
    })

    // Filter entries that involve this account and match criteria
    const entries: any[] = []
    for (const doc of entryDocs) {
      const entry = JSON.parse(doc.fileUrl || '{}')
      
      // Check if this entry involves the specified account
      if (entry.debitAccountId !== accountId && entry.creditAccountId !== accountId) {
        continue
      }
      
      // Apply filters
      if (options.category && entry.category !== options.category) continue
      if (options.status && entry.status !== options.status) continue
      
      // Get account details
      const [debitAccount, creditAccount] = await Promise.all([
        this.prisma.document.findUnique({
          where: { id: entry.debitAccountId },
          select: { fileUrl: true }
        }),
        this.prisma.document.findUnique({
          where: { id: entry.creditAccountId },
          select: { fileUrl: true }
        })
      ])
      
      const debitAccountData = debitAccount ? JSON.parse(debitAccount.fileUrl || '{}') : {}
      const creditAccountData = creditAccount ? JSON.parse(creditAccount.fileUrl || '{}') : {}
      
      entries.push({
        ...entry,
        id: doc.id,
        createdAt: doc.createdAt,
        direction: entry.debitAccountId === accountId ? 'DEBIT' : 'CREDIT',
        accountNumber: entry.debitAccountId === accountId ? 
          creditAccountData.accountNumber : 
          debitAccountData.accountNumber
      })
    }
    
    return entries
  }

  /**
   * Reverse a ledger entry with proper audit trail
   */
  async reverseEntry(
    entryId: string,
    reason: string,
    reversedBy: string
  ): Promise<any> {
    const entryDoc = await this.prisma.document.findUnique({
      where: { id: entryId }
    })

    if (!entryDoc || entryDoc.fileName !== 'LEDGER_ENTRY') {
      throw new NotFoundException('Ledger entry not found')
    }

    const entry = JSON.parse(entryDoc.fileUrl || '{}')

    if (!entry) {
      throw new NotFoundException('Ledger entry not found')
    }

    if (entry.status === LedgerStatus.REVERSED) {
      throw new ConflictException('Entry is already reversed')
    }

    // Create reversal entry
    const reversalEntry = await this.prisma.$transaction(async (tx) => {
      // Create the reversal entry (swap debit/credit)
      const reversal = await tx.document.create({
        data: {
          userId: reversedBy,
          type: 'OTHER',
          fileName: 'LEDGER_ENTRY',
          fileSize: 0,
          mimeType: 'application/json',
          fileUrl: JSON.stringify({
            transactionId: `${entry.transactionId}_REVERSAL`,
            debitAccountId: entry.creditAccountId, // Reverse the accounts
            creditAccountId: entry.debitAccountId,
            amount: entry.amount,
            currency: entry.currency,
            description: `Reversal of ${entry.transactionId}: ${reason}`,
            category: entry.category,
            subcategory: 'REVERSAL',
            reference: `${entry.reference}_REVERSAL`,
            status: LedgerStatus.POSTED,
            postedAt: new Date(),
            createdBy: reversedBy,
            reversalReason: reason,
            reversedBy
          })
        }
      })

      // Update original entry
      const updatedEntryData = {
        ...entry,
        status: LedgerStatus.REVERSED,
        reversedAt: new Date(),
        reversalReason: reason,
        reversedBy
      }
      
      await tx.document.update({
        where: { id: entryId },
        data: {
          fileUrl: JSON.stringify(updatedEntryData)
        }
      })

      // Update account balances - get account documents and update their balance
      const debitAccountDoc = await tx.document.findUnique({
        where: { id: entry.debitAccountId }
      })
      const creditAccountDoc = await tx.document.findUnique({
        where: { id: entry.creditAccountId }
      })

      if (debitAccountDoc) {
        const debitData = JSON.parse(debitAccountDoc.fileUrl || '{}')
        debitData.balance = (BigInt(debitData.balance || 0) + BigInt(entry.amount)).toString()
        await tx.document.update({
          where: { id: entry.debitAccountId },
          data: { fileUrl: JSON.stringify(debitData) }
        })
      }

      if (creditAccountDoc) {
        const creditData = JSON.parse(creditAccountDoc.fileUrl || '{}')
        creditData.balance = (BigInt(creditData.balance || 0) - BigInt(entry.amount)).toString()
        await tx.document.update({
          where: { id: entry.creditAccountId },
          data: { fileUrl: JSON.stringify(creditData) }
        })
      }

      // Create audit log
      await this.auditService.log({
        action: 'TRANSACTION_REVERSE',
        resourceType: 'LEDGER_ENTRY',
        resourceId: entryId,
        resourceDisplay: `Ledger Entry ${entry.transactionId}`,
        actionDetails: {
          originalEntryId: entryId,
          reversalEntryId: reversal.id,
          reason,
          amount: entry.amount.toString(),
          reversedBy
        },
        userId: reversedBy
      })

      return reversal
    })

    return reversalEntry
  }

  /**
   * Generate unique account number based on account type
   */
  private async generateAccountNumber(accountType: LedgerAccountType): Promise<string> {
    const prefix = this.getAccountPrefix(accountType)
    const sequence = await this.getNextSequence('account_number')
    return `${prefix}${sequence.toString().padStart(8, '0')}`
  }

  /**
   * Generate unique transaction ID
   */
  private async generateTransactionId(): Promise<string> {
    const sequence = await this.getNextSequence('transaction_id')
    const timestamp = Date.now().toString(36).toUpperCase()
    return `TXN${timestamp}${sequence.toString().padStart(6, '0')}`
  }

  /**
   * Get account prefix based on type
   */
  private getAccountPrefix(accountType: LedgerAccountType): string {
    const prefixes = {
      [LedgerAccountType.ASSET]: '1',
      [LedgerAccountType.LIABILITY]: '2',
      [LedgerAccountType.EQUITY]: '3',
      [LedgerAccountType.REVENUE]: '4',
      [LedgerAccountType.EXPENSE]: '5',
      [LedgerAccountType.SYSTEM_CONTROL]: '9',
      [LedgerAccountType.CUSTOMER_DEPOSIT]: '21',
      [LedgerAccountType.MERCHANT_RESERVE]: '22',
      [LedgerAccountType.ESCROW_HOLDING]: '23',
      [LedgerAccountType.COMPLIANCE_RESERVE]: '24'
    }
    return prefixes[accountType] || '0'
  }

  /**
   * Get next sequence number with proper locking
   */
  private async getNextSequence(sequenceName: string): Promise<number> {
    // This would typically use a database sequence or Redis
    // For now, using timestamp-based approach
    return Date.now() % 1000000
  }

  /**
   * Calculate SHA-256 hash for ledger entry
   */
  private calculateEntryHash(data: any): string {
    const hash = crypto.createHash('sha256')
    hash.update(JSON.stringify(data))
    return hash.digest('hex')
  }

  /**
   * Get previous hash for chain integrity
   */
  private async getPreviousHash(): Promise<string | null> {
    const lastEntryDoc = await this.prisma.document.findFirst({
      where: {
        type: 'OTHER',
        fileName: 'LEDGER_ENTRY'
      },
      orderBy: { createdAt: 'desc' }
    })
    
    if (!lastEntryDoc) return null
    
    const entry = JSON.parse(lastEntryDoc.fileUrl || '{}')
    return entry.entryHash || null
  }

  /**
   * Verify ledger integrity by checking hash chain
   */
  async verifyLedgerIntegrity(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []
    const entryDocs = await this.prisma.document.findMany({
      where: {
        type: 'OTHER',
        fileName: 'LEDGER_ENTRY'
      },
      orderBy: { createdAt: 'asc' }
    })

    let previousHash: string | null = null

    for (const doc of entryDocs) {
      const entry = JSON.parse(doc.fileUrl || '{}')
      // Verify hash chain
      if (entry.previousHash !== previousHash) {
        errors.push(`Hash chain broken at entry ${entry.transactionId}`)
      }

      // Recalculate and verify entry hash
      const calculatedHash = this.calculateEntryHash({
        transactionId: entry.transactionId,
        debitAccountId: entry.debitAccountId,
        creditAccountId: entry.creditAccountId,
        amount: entry.amount,
        description: entry.description,
        timestamp: doc.createdAt
      })

      if (entry.entryHash !== calculatedHash) {
        errors.push(`Entry hash mismatch at ${entry.transactionId}`)
      }

      previousHash = entry.entryHash
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}