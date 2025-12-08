import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// import { BigInt } from '@prisma/client/runtime/library';
import { Coupon, DiscountType } from '@prisma/client';

interface ApplyCouponDto {
  userId: string;
  code: string;
  orderAmount: bigint;
}

interface CouponResult {
  discountAmount: bigint;
  coupon: Coupon;
  message: string;
}

interface ValidateCouponDto {
  code: string;
  orderAmount: bigint;
  storeId?: string;
}

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  async applyCoupon(data: ApplyCouponDto): Promise<CouponResult> {
    const { userId, code, orderAmount } = data;

    // Find and validate coupon
    const coupon = await this.validateCoupon({ code, orderAmount });

    // Check if user has already used this coupon
    const existingUsage = await this.prisma.couponUsage.findFirst({
      where: { couponId: coupon.id, userId }
    });

    if (existingUsage) {
      throw new BadRequestException('Coupon already used by this user');
    }

    // Calculate discount
    const discountAmount = this.calculateDiscount(coupon, orderAmount);

    // Create usage record
    await this.prisma.couponUsage.create({
      data: {
        couponId: coupon.id,
        userId,
        orderAmount: orderAmount.toString(),
        discountAmount: discountAmount.toString(),
        usedAt: new Date()
      }
    });

    // Update coupon usage count
    await this.prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } }
    });

    return {
      discountAmount,
      coupon,
      message: `Coupon applied successfully. You saved ₦${this.formatAmount(discountAmount)}`
    };
  }

  async validateCoupon(data: ValidateCouponDto): Promise<Coupon> {
    const { code, orderAmount, storeId } = data;

    const coupon = await this.prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        OR: [
          { storeId: storeId || null },
          { storeId: null }
        ],
        AND: [
          { OR: [{ startsAt: { lte: new Date() } }, { startsAt: null }] },
          { OR: [{ endsAt: { gte: new Date() } }, { endsAt: null }] }
        ]
      }
    });

    if (!coupon) {
      throw new NotFoundException('Invalid or expired coupon code');
    }

    // Check usage limit
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      throw new BadRequestException(
        `Minimum order amount of ₦${this.formatAmount(coupon.minOrderAmount)} required`
      );
    }

    return coupon;
  }

  async createCoupon(data: {
    code: string;
    description?: string;
    discountType: DiscountType;
    value: number;
    maxDiscount?: bigint;
    minOrderAmount?: bigint;
    storeId?: string;
    usageLimit?: number;
    startsAt?: Date;
    endsAt?: Date;
  }): Promise<Coupon> {
    // Check if code already exists
    const existing = await this.prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() }
    });

    if (existing) {
      throw new BadRequestException('Coupon code already exists');
    }

    return this.prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        discountType: data.discountType,
        value: data.value,
        maxDiscount: data.maxDiscount,
        minOrderAmount: data.minOrderAmount,
        storeId: data.storeId,
        usageLimit: data.usageLimit || 0,
        usedCount: 0,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        isActive: true
      }
    });
  }

  async getCoupons(storeId?: string): Promise<Coupon[]> {
    const where: any = { isActive: true };
    
    if (storeId) {
      where.OR = [
        { storeId },
        { storeId: null }
      ];
    }

    return this.prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  private calculateDiscount(coupon: Coupon, orderAmount: bigint): bigint {
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      const discountAmount = (orderAmount * BigInt(Math.round(coupon.value * 100))) / BigInt(10000);
      
      // Apply max discount limit if set
      if (coupon.maxDiscount) {
        const max = typeof coupon.maxDiscount === 'number' ? BigInt(Math.round(coupon.maxDiscount)) : coupon.maxDiscount as bigint;
        if (discountAmount > max) {
          return max;
        }
      }
      
      return discountAmount;
    } else {
      // Fixed amount discount
      const fixed = BigInt(Math.round(coupon.value * 100));
      return fixed > orderAmount ? orderAmount : fixed;
    }
  }

  private formatAmount(amount: bigint): string {
    return (Number(amount) / 100).toFixed(2);
  }
}