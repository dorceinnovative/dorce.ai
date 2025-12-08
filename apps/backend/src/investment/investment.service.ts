import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WalletService } from '../wallets/wallet.service';
import { LedgerService, TransactionCategory } from '../ledger/ledger.service';

export interface CreateInvestmentDto {
  userId: string;
  name: string;
  description?: string;
  type: 'STOCKS' | 'BONDS' | 'REAL_ESTATE' | 'COMMODITIES' | 'CRYPTO' | 'MUTUAL_FUNDS' | 'ETF';
  amount: number;
  currency?: string;
  expectedReturn?: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  duration?: string;
  metadata?: any;
}

export interface InvestmentDto {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: string;
  amount: number;
  currency: string;
  currentValue: number;
  expectedReturn: number;
  riskLevel: string;
  duration?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CLOSED';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class InvestmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly walletService: WalletService,
    private readonly ledgerService: LedgerService
  ) {}

  async createInvestment(dto: CreateInvestmentDto): Promise<InvestmentDto> {
    try {
      // Validate user wallet
      const wallet = await this.walletService.getWallet(dto.userId);
      if (!wallet) {
        throw new BadRequestException('User wallet not found');
      }

      // Check sufficient balance
      if (wallet.balance < dto.amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      // Create investment record using document storage
      const investmentData = {
        userId: dto.userId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        amount: dto.amount,
        currency: dto.currency || 'NGN',
        currentValue: dto.amount,
        expectedReturn: dto.expectedReturn || 0,
        riskLevel: dto.riskLevel,
        duration: dto.duration,
        status: 'ACTIVE',
        metadata: dto.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const investmentDoc = await this.prisma.document.create({
        data: {
          userId: dto.userId,
          type: 'OTHER',
          fileName: 'INVESTMENT_RECORD',
          fileSize: 0,
          mimeType: 'application/json',
          fileUrl: JSON.stringify(investmentData)
        }
      });

      // Deduct amount from wallet
      await this.walletService.withdrawFromWallet(dto.userId, { amount: dto.amount });

      // Create ledger entry
      await this.ledgerService.createEntry({
        debitAccountId: wallet.id,
        creditAccountId: 'INVESTMENT_HOLDING',
        amount: BigInt(Math.round(dto.amount * 100)), // Convert to cents
        category: TransactionCategory.PURCHASE,
        description: `Investment: ${dto.name} - ${dto.type}`,
        externalReference: investmentDoc.id,
        createdBy: dto.userId
      });

      // Audit log
      await this.auditService.log({
        userId: dto.userId,
        action: 'INVESTMENT_CREATED',
        resourceType: 'INVESTMENT',
        resourceId: investmentDoc.id,
        actionDetails: { name: dto.name, type: dto.type, amount: dto.amount }
      });

      return {
        id: investmentDoc.id,
        ...investmentData,
        status: investmentData.status as 'ACTIVE' | 'INACTIVE' | 'CLOSED'
      };
    } catch (error) {
      await this.auditService.log({
        userId: dto.userId,
        action: 'INVESTMENT_CREATION_FAILED',
        resourceType: 'INVESTMENT',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getInvestment(id: string, userId: string): Promise<InvestmentDto | null> {
    try {
      const investmentDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId,
          type: 'OTHER',
        fileName: 'INVESTMENT_RECORD'
        }
      });

      if (!investmentDoc) {
        return null;
      }

      const investmentData = JSON.parse(investmentDoc.fileUrl || '{}');
      return {
        id: investmentDoc.id,
        ...investmentData
      };
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'INVESTMENT_RETRIEVAL_FAILED',
        resourceType: 'INVESTMENT',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getUserInvestments(userId: string): Promise<InvestmentDto[]> {
    try {
      const investmentDocs = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
        fileName: 'INVESTMENT_RECORD'
        }
      });

      const investments = investmentDocs.map(doc => {
        const data = JSON.parse(doc.fileUrl || '{}');
        return {
          id: doc.id,
          ...data
        };
      });

      return investments;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'INVESTMENTS_RETRIEVAL_FAILED',
        resourceType: 'INVESTMENT',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async updateInvestmentValue(id: string, userId: string, currentValue: number): Promise<InvestmentDto> {
    try {
      const investmentDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId,
          type: 'OTHER',
        fileName: 'INVESTMENT_RECORD'
        }
      });

      if (!investmentDoc) {
        throw new NotFoundException('Investment not found');
      }

      const investmentData = JSON.parse(investmentDoc.fileUrl || '{}');
      investmentData.currentValue = currentValue;
      investmentData.updatedAt = new Date();

      await this.prisma.document.update({
        where: { id },
        data: {
          fileUrl: JSON.stringify(investmentData)
        }
      });

      await this.auditService.log({
        userId,
        action: 'INVESTMENT_VALUE_UPDATED',
        resourceType: 'INVESTMENT',
        resourceId: id,
        actionDetails: { currentValue }
      });

      return {
        id: investmentDoc.id,
        ...investmentData
      };
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'INVESTMENT_VALUE_UPDATE_FAILED',
        resourceType: 'INVESTMENT',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async closeInvestment(id: string, userId: string): Promise<void> {
    try {
      const investmentDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId,
          type: 'OTHER',
        fileName: 'INVESTMENT_RECORD'
        }
      });

      if (!investmentDoc) {
        throw new NotFoundException('Investment not found');
      }

      const investmentData = JSON.parse(investmentDoc.fileUrl || '{}');
      investmentData.status = 'CLOSED';
      investmentData.updatedAt = new Date();

      await this.prisma.document.update({
        where: { id },
        data: {
          fileUrl: JSON.stringify(investmentData)
        }
      });

      // Return investment value to wallet
      await this.walletService.topupWallet(userId, investmentData.currentValue);

      // Create ledger entry for closure
      await this.ledgerService.createEntry({
        debitAccountId: 'INVESTMENT_HOLDING',
        creditAccountId: (await this.walletService.getWallet(userId))!.id,
        amount: BigInt(Math.round(investmentData.currentValue * 100)),
        category: TransactionCategory.PURCHASE,
        description: `Investment Closed: ${investmentData.name}`,
        externalReference: id,
        createdBy: userId
      });

      await this.auditService.log({
        userId,
        action: 'INVESTMENT_CLOSED',
        resourceType: 'INVESTMENT',
        resourceId: id,
        actionDetails: { finalValue: investmentData.currentValue }
      });
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'INVESTMENT_CLOSURE_FAILED',
        resourceType: 'INVESTMENT',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }
}