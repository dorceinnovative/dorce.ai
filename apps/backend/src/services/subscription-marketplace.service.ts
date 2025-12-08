import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentIntegrationService } from './payment-integration.service';
import { NotificationService } from '../notification/notification.service';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  isActive: boolean;
  trialDays?: number;
  setupFee?: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  startDate: Date;
  endDate?: Date;
  nextBillingDate?: Date;
  paymentMethod?: string;
  autoRenew: boolean;
  metadata?: any;
}

@Injectable()
export class SubscriptionMarketplaceService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentIntegrationService,
    private notificationService: NotificationService,
  ) {}

  // Subscription Plans Management
  async createPlan(planData: Omit<SubscriptionPlan, 'id'>): Promise<SubscriptionPlan> {
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        ...planData,
        features: JSON.stringify(planData.features),
      },
    });

    return {
      ...plan,
      features: JSON.parse(plan.features as string),
    };
  }

  async getActivePlans(): Promise<SubscriptionPlan[]> {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    return plans.map(plan => ({
      ...plan,
      features: JSON.parse(plan.features as string),
    }));
  }

  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) return null;

    return {
      ...plan,
      features: JSON.parse(plan.features as string),
    };
  }

  // Subscription Management
  async subscribeToPlan(userId: string, planId: string, paymentMethod: string): Promise<Subscription> {
    const plan = await this.getPlanById(planId);
    if (!plan || !plan.isActive) {
      throw new Error('Invalid or inactive subscription plan');
    }

    // Check if user already has an active subscription
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trial'] },
      },
    });

    if (existingSubscription) {
      throw new Error('User already has an active subscription');
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, plan.billingCycle);
    const nextBillingDate = this.calculateNextBillingDate(startDate, plan.billingCycle);

    // Create subscription record
    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId,
        status: plan.trialDays && plan.trialDays > 0 ? 'trial' : 'active',
        startDate,
        endDate,
        nextBillingDate,
        paymentMethod,
        autoRenew: true,
      },
    });

    // Process initial payment (if not on trial)
    if (!plan.trialDays || plan.trialDays === 0) {
      await this.processSubscriptionPayment(subscription.id, plan.price, paymentMethod);
    }

    // Send confirmation notification
    await this.notificationService.sendNotification({
      userId,
      type: 'GENERAL',
      title: 'Subscription Created',
      message: `You have successfully subscribed to ${plan.name}.`,
      metadata: {
        subscriptionId: subscription.id,
        planId: plan.id,
        planName: plan.name,
      },
    });

    return subscription;
  }

  async cancelSubscription(subscriptionId: string, userId: string): Promise<Subscription> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status === 'cancelled') {
      throw new Error('Subscription is already cancelled');
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'cancelled',
        autoRenew: false,
      },
    });

    await this.notificationService.sendNotification({
      userId,
      type: 'GENERAL',
      title: 'Subscription Cancelled',
      message: 'Your subscription has been cancelled. You will continue to have access until the end of your current billing period.',
      metadata: {
        subscriptionId: subscription.id,
        endDate: subscription.endDate,
      },
    });

    return updatedSubscription;
  }

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trial'] },
      },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async processRecurringPayments(): Promise<void> {
    const dueSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'active',
        autoRenew: true,
        nextBillingDate: {
          lte: new Date(),
        },
      },
      include: {
        plan: true,
        user: true,
      },
    });

    for (const subscription of dueSubscriptions) {
      try {
        await this.processSubscriptionPayment(
          subscription.id,
          subscription.plan.price,
          subscription.paymentMethod || 'paystack'
        );

        // Update next billing date
        const nextBillingDate = this.calculateNextBillingDate(
          subscription.nextBillingDate!,
          subscription.plan.billingCycle
        );

        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            nextBillingDate,
          },
        });

        await this.notificationService.sendNotification({
          userId: subscription.userId,
          type: 'GENERAL',
          title: 'Subscription Renewed',
          message: `Your ${subscription.plan.name} subscription has been renewed.`,
          metadata: {
            subscriptionId: subscription.id,
            planName: subscription.plan.name,
            nextBillingDate: nextBillingDate.toISOString(),
          },
        });
      } catch (error) {
        console.error(`Failed to process payment for subscription ${subscription.id}:`, error);
        
        // Handle payment failure
        await this.handlePaymentFailure(subscription);
      }
    }
  }

  private async processSubscriptionPayment(
    subscriptionId: string,
    amount: number,
    paymentMethod: string,
  ): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({ where: { id: subscriptionId }, include: { user: true } })
    const email = subscription?.user?.email || 'customer@example.com'

    const amountInKobo = Math.round(amount * 100)
    const provider = (paymentMethod || 'paystack').toLowerCase() as 'paystack' | 'flutterwave' | 'remita'

    await this.paymentService.initializePayment({
      amount: amountInKobo,
      email,
      reference: `sub_${subscriptionId}_${Date.now()}`,
      callbackUrl: `${process.env.FRONTEND_URL || 'https://dorce.ai'}/subscriptions/callback`,
      metadata: { subscriptionId, userId: subscription?.userId, service: 'subscription', method: paymentMethod },
      provider
    })
  }

  private async handlePaymentFailure(subscription: Subscription): Promise<void> {
    // Update subscription status
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'suspended',
      },
    });

    await this.notificationService.sendNotification({
      userId: subscription.userId,
      type: 'GENERAL',
      title: 'Payment Failed',
      message: 'We were unable to process your subscription payment. Please update your payment method.',
      metadata: {
        subscriptionId: subscription.id,
        planName: (subscription as any)?.plan?.name || (subscription as any)?.metadata?.planName || 'Subscription',
      },
    });
  }

  private calculateEndDate(startDate: Date, billingCycle: string): Date {
    const endDate = new Date(startDate);
    
    switch (billingCycle) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }

    return endDate;
  }

  private calculateNextBillingDate(startDate: Date, billingCycle: string): Date {
    return this.calculateEndDate(startDate, billingCycle);
  }
}
