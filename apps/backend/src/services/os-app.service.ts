import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OSAppService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultApps();
  }

  private async seedDefaultApps() {
    const defaultApps = [
      {
        id: 'chat',
        name: 'Chat',
        icon: '💬',
        description: 'AI-powered chat assistant',
        permissions: ['chat', 'ai', 'notifications'],
        memoryUsage: 64,
        cpuUsage: 5,
        isActive: true,
      },
      {
        id: 'marketplace',
        name: 'Marketplace',
        icon: '🛒',
        description: 'Buy and sell products',
        permissions: ['marketplace', 'payments', 'orders'],
        memoryUsage: 128,
        cpuUsage: 10,
        isActive: true,
      },
      {
        id: 'pay',
        name: 'Pay',
        icon: '💳',
        description: 'Send and receive payments',
        permissions: ['payments', 'wallet', 'transactions'],
        memoryUsage: 96,
        cpuUsage: 8,
        isActive: true,
      },
      {
        id: 'crypto',
        name: 'Crypto',
        icon: '₿',
        description: 'Cryptocurrency trading',
        permissions: ['crypto', 'trading', 'wallet'],
        memoryUsage: 256,
        cpuUsage: 15,
        isActive: true,
      },
      {
        id: 'tax',
        name: 'Tax',
        icon: '📊',
        description: 'Tax calculation and filing',
        permissions: ['tax', 'calculations', 'reports'],
        memoryUsage: 112,
        cpuUsage: 12,
        isActive: true,
      },
      {
        id: 'school',
        name: 'School',
        icon: '🎓',
        description: 'Educational resources',
        permissions: ['education', 'content', 'progress'],
        memoryUsage: 88,
        cpuUsage: 6,
        isActive: true,
      },
      {
        id: 'farms',
        name: 'Farms',
        icon: '🌾',
        description: 'Agricultural marketplace',
        permissions: ['agriculture', 'marketplace', 'orders'],
        memoryUsage: 104,
        cpuUsage: 9,
        isActive: true,
      },
      {
        id: 'news',
        name: 'News',
        icon: '📰',
        description: 'Latest news and updates',
        permissions: ['news', 'content', 'notifications'],
        memoryUsage: 72,
        cpuUsage: 4,
        isActive: true,
      },
      {
        id: 'community',
        name: 'Community',
        icon: '👥',
        description: 'Connect with others',
        permissions: ['social', 'community', 'messaging'],
        memoryUsage: 120,
        cpuUsage: 8,
        isActive: true,
      },
      {
        id: 'business',
        name: 'Business',
        icon: '💼',
        description: 'Business tools and analytics',
        permissions: ['business', 'analytics', 'reports'],
        memoryUsage: 144,
        cpuUsage: 11,
        isActive: true,
      },
      {
        id: 'subscriptions',
        name: 'Subscriptions',
        icon: '🔄',
        description: 'Digital subscription marketplace',
        permissions: ['subscriptions', 'marketplace', 'payments', 'billing'],
        memoryUsage: 160,
        cpuUsage: 12,
        isActive: true,
      },
    ];

    for (const app of defaultApps) {
      await this.prisma.oSApp.upsert({
        where: { id: app.id },
        update: {},
        create: app,
      });
    }
  }

  async getAvailableApps() {
    return this.prisma.oSApp.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getAppById(id: string) {
    return this.prisma.oSApp.findUnique({
      where: { id },
    });
  }

  async launchApp(id: string) {
    const app = await this.getAppById(id);
    if (!app || !app.isActive) {
      throw new Error('App not found or inactive');
    }

    return app;
  }
}