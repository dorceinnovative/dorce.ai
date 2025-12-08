import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// import { BigInt } from '@prisma/client/runtime/library';
import { CommissionScope, CommissionRule, ProductCategoryEcommerce } from '@prisma/client';

interface CalculateCommissionDto {
  storeId?: string;
  category?: ProductCategoryEcommerce;
  amount: bigint;
}

interface ApplyCommissionDto {
  orderId: string;
  storeId: string;
  category: ProductCategoryEcommerce;
  amount: bigint;
}

interface CommissionResult {
  commissionAmount: bigint;
  netAmount: bigint;
  ruleApplied: CommissionRule | null;
}

@Injectable()
export class CommissionService {
  constructor(private prisma: PrismaService) {}

  async calculateCommission(data: CalculateCommissionDto): Promise<CommissionResult> {
    const { storeId, category, amount } = data;

    // Find applicable commission rules in order of priority
    let applicableRule: CommissionRule | null = null;

    // 1. Check store-specific rule
    if (storeId) {
      applicableRule = await this.prisma.commissionRule.findFirst({
        where: {
          scope: CommissionScope.STORE,
          storeId,
          isActive: true,
          OR: [
            { startsAt: { lte: new Date() } },
            { startsAt: null }
          ],
          AND: [
            { OR: [{ endsAt: { gte: new Date() } }, { endsAt: null }] }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // 2. Check category-specific rule
    if (!applicableRule && category) {
      applicableRule = await this.prisma.commissionRule.findFirst({
        where: {
          scope: CommissionScope.CATEGORY,
          category,
          isActive: true,
          OR: [
            { startsAt: { lte: new Date() } },
            { startsAt: null }
          ],
          AND: [
            { OR: [{ endsAt: { gte: new Date() } }, { endsAt: null }] }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // 3. Check global rule
    if (!applicableRule) {
      applicableRule = await this.prisma.commissionRule.findFirst({
        where: {
          scope: CommissionScope.GLOBAL,
          isActive: true,
          OR: [
            { startsAt: { lte: new Date() } },
            { startsAt: null }
          ],
          AND: [
            { OR: [{ endsAt: { gte: new Date() } }, { endsAt: null }] }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Calculate commission
    let commissionAmount: bigint = BigInt(0);
    
    if (applicableRule) {
      if (applicableRule.percentage > 0) {
        commissionAmount = (amount * BigInt(Math.round(applicableRule.percentage * 100))) / BigInt(10000);
      }
      
      if (applicableRule.fixedAmount > 0) {
        commissionAmount = commissionAmount + BigInt(applicableRule.fixedAmount);
      }
    }

    // Ensure commission doesn't exceed transaction amount
    if (commissionAmount > amount) {
      commissionAmount = amount;
    }

    const netAmount = amount - commissionAmount;

    return {
      commissionAmount,
      netAmount,
      ruleApplied: applicableRule
    };
  }

  async applyCommission(data: ApplyCommissionDto): Promise<CommissionResult> {
    const { orderId, storeId, category, amount } = data;

    const commissionResult = await this.calculateCommission({
      storeId,
      category,
      amount
    });

    // Create commission record
    await this.prisma.commissionRecord.create({
      data: {
        orderId,
        storeId,
        amount: commissionResult.commissionAmount,
        ruleId: commissionResult.ruleApplied?.id,
        status: 'PENDING',
        calculatedAt: new Date()
      }
    });

    return commissionResult;
  }

  async getCommissionRules(storeId?: string): Promise<CommissionRule[]> {
    const where: any = { isActive: true };
    
    if (storeId) {
      where.storeId = storeId;
    }

    return this.prisma.commissionRule.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  async createCommissionRule(data: {
    scope: CommissionScope;
    storeId?: string;
    category?: string;
    percentage: number;
    fixedAmount?: bigint;
    startsAt?: Date;
    endsAt?: Date;
  }): Promise<CommissionRule> {
    return this.prisma.commissionRule.create({
      data: {
        scope: data.scope,
        storeId: data.storeId,
        category: data.category as any,
        percentage: data.percentage,
        fixedAmount: data.fixedAmount || BigInt(0),
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        isActive: true
      }
    });
  }
}