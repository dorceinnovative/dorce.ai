import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalesMarketingService {
  constructor(private readonly prisma: PrismaService) {}

  async developSalesStrategy(projectId: string, strategyData: any, userId: string) {
    const { targetMarket, pricingStrategy, marketingChannels, salesTimeline } = strategyData;

    const strategy = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `sales-strategy-${projectId}`,
        fileUrl: JSON.stringify({
          projectId,
          userId,
          type: 'SALES_STRATEGY',
          targetMarket,
          pricingStrategy,
          marketingChannels,
          salesTimeline,
          status: 'DEVELOPED',
          createdAt: new Date().toISOString(),
        }),
        userId,
        fileSize: 0,
        mimeType: 'application/json',
      },
    });

    return strategy;
  }

  async getSalesStrategy(projectId: string, userId: string) {
    const strategy = await this.prisma.document.findFirst({
      where: { 
        fileName: `sales-strategy-${projectId}`,
        userId,
        type: 'OTHER'
      },
    });

    if (!strategy) {
      throw new Error('Sales strategy not found');
    }

    return {
      ...strategy,
      fileUrl: JSON.parse(strategy.fileUrl as string),
    };
  }
}