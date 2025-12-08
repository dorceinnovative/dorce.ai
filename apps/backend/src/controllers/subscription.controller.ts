import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SubscriptionMarketplaceService } from '../services/subscription-marketplace.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionMarketplaceService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all active subscription plans' })
  @ApiResponse({ status: 200, description: 'List of subscription plans' })
  async getPlans() {
    return this.subscriptionService.getActivePlans();
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  @ApiResponse({ status: 200, description: 'Subscription plan details' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlan(@Param('id') id: string) {
    const plan = await this.subscriptionService.getPlanById(id);
    if (!plan) {
      throw new Error('Plan not found');
    }
    return plan;
  }

  @Post('subscribe/:planId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a plan' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async subscribe(
    @Request() req,
    @Param('planId') planId: string,
    @Body() subscribeDto: { paymentMethod: string },
  ) {
    return this.subscriptionService.subscribeToPlan(
      req.user.id,
      planId,
      subscribeDto.paymentMethod,
    );
  }

  @Get('my-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription' })
  @ApiResponse({ status: 200, description: 'User subscription details' })
  @ApiResponse({ status: 404, description: 'No active subscription' })
  async getMySubscription(@Request() req) {
    const subscription = await this.subscriptionService.getUserSubscription(req.user.id);
    if (!subscription) {
      throw new Error('No active subscription found');
    }
    return subscription;
  }

  @Post('cancel/:subscriptionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancelSubscription(
    @Request() req,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    return this.subscriptionService.cancelSubscription(subscriptionId, req.user.id);
  }

  @Get('marketplace')
  @ApiOperation({ summary: 'Get subscription marketplace data' })
  @ApiResponse({ status: 200, description: 'Marketplace data' })
  async getMarketplace() {
    const plans = await this.subscriptionService.getActivePlans();
    
    return {
      featured: plans.slice(0, 3),
      categories: [
        {
          name: 'Software & Tools',
          description: 'Business software and productivity tools',
          plans: plans.filter(p => p.name.toLowerCase().includes('pro') || p.name.toLowerCase().includes('business')),
        },
        {
          name: 'Content & Media',
          description: 'Streaming, news, and content subscriptions',
          plans: plans.filter(p => p.name.toLowerCase().includes('premium') || p.name.toLowerCase().includes('plus')),
        },
        {
          name: 'Services',
          description: 'Professional and consulting services',
          plans: plans.filter(p => p.name.toLowerCase().includes('enterprise') || p.name.toLowerCase().includes('consulting')),
        },
      ],
      stats: {
        totalPlans: plans.length,
        averagePrice: plans.reduce((sum, p) => sum + p.price, 0) / plans.length,
        currency: plans[0]?.currency || 'NGN',
      },
    };
  }
}