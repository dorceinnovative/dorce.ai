import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

interface StoreConfiguration {
  name: string;
  slug: string;
  description: string;
  logo?: string;
  banner?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

@Injectable()
export class VendorOnboardingSimpleService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createStore(userId: string, configuration: StoreConfiguration): Promise<any> {
    // Check if user already has a store
    const existingStore = await this.prisma.store.findFirst({
      where: { userId },
    });

    if (existingStore) {
      throw new BadRequestException('You already have a store');
    }

    // Check if store name/slug is available
    const nameExists = await this.prisma.store.findFirst({
      where: { name: configuration.name },
    });

    const slugExists = await this.prisma.store.findFirst({
      where: { slug: configuration.slug },
    });

    if (nameExists || slugExists) {
      throw new BadRequestException('Store name or subdomain already exists');
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(configuration.slug)) {
      throw new BadRequestException('Store subdomain can only contain lowercase letters, numbers, and hyphens');
    }

    // Create store directly (no vendor model exists)
    const store = await this.prisma.store.create({
      data: {
        userId,
        name: configuration.name,
        slug: configuration.slug,
        description: configuration.description,
        logo: configuration.logo,
        banner: configuration.banner,
        settings: {
          primaryColor: configuration.primaryColor || '#3B82F6',
          secondaryColor: configuration.secondaryColor || '#10B981',
          theme: 'custom',
          currency: 'NGN',
          timezone: 'Africa/Lagos',
          language: 'en',
          taxRate: 5,
          commissionRate: 5, // 5% commission
          minimumOrderAmount: 1000, // ₦10 minimum
          maximumOrderAmount: 10000000, // ₦100,000 maximum
          autoAcceptOrders: false,
          requirePhoneVerification: true,
          requireEmailVerification: true,
        },
        isActive: true,
        subdomain: `${configuration.slug}.dorce.ai`,
      },
    });

    // Send notification
    await this.notificationService.sendNotification({
      userId,
      type: 'GENERAL',
      title: 'Store Created Successfully',
      message: `Your store "${configuration.name}" has been created successfully. You can now start adding products.`,
      channels: ['email', 'push'],
    });

    return {
      storeId: store.id,
      subdomain: store.subdomain,
      message: 'Store created successfully',
    };
  }

  async getStoreByVendor(userId: string): Promise<any> {
    const store = await this.prisma.store.findFirst({
      where: { userId },
      include: {
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  async updateStoreSettings(userId: string, storeId: string, settings: any): Promise<any> {
    const store = await this.prisma.store.findFirst({
      where: {
        id: storeId,
        userId,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found or unauthorized');
    }

    const updatedStore = await this.prisma.store.update({
      where: { id: storeId },
      data: { settings: settings },
    });

    return {
      success: true,
      message: 'Store settings updated successfully',
      data: updatedStore,
    };

    return {
      success: true,
      message: 'Store settings updated successfully',
      data: updatedStore,
    };
  }

  async getVendorDashboard(userId: string): Promise<any> {
    const store = await this.prisma.store.findFirst({
      where: { userId },
      include: {
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Vendor store not found');
    }

    // Get recent orders
    const recentOrders = await this.prisma.order.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          take: 1,
        },
      },
    });

    // Get analytics summary
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyRevenue = await this.prisma.order.aggregate({
      where: {
        storeId: store.id,
        createdAt: {
          gte: thirtyDaysAgo,
        },
        paymentStatus: 'SUCCESS',
      },
      _sum: {
        totalAmount: true,
      },
    });

    const monthlyOrders = await this.prisma.order.count({
      where: {
        storeId: store.id,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return {
      store: {
        id: store.id,
        name: store.name,
        subdomain: store.subdomain,
        logo: store.logo,
        isActive: store.isActive,
      },
      analytics: {
        totalProducts: (store as any)._count?.products || 0,
        totalOrders: (store as any)._count?.orders || 0,
        monthlyRevenue: monthlyRevenue._sum?.totalAmount?.toString() || '0',
        monthlyOrders,
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.totalAmount.toString(),
        status: order.status,
        createdAt: order.createdAt,
        customer: {
          name: `${order.user.firstName} ${order.user.lastName}`,
          email: order.user.email,
        },
      })),
    };
  }
}