import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

interface VendorApplicationData {
  businessName: string;
  businessType: 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'LIMITED_LIABILITY' | 'CORPORATION';
  businessRegistrationNumber?: string;
  taxIdNumber?: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
  };
  contactInfo: {
    email: string;
    phoneNumber: string;
    website?: string;
  };
  bankAccount: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode: string;
  };
  documents: {
    businessRegistration?: string;
    taxCertificate?: string;
    utilityBill?: string;
    bankStatement?: string;
    idDocument: string;
  };
  categories: string[];
  description: string;
}

interface StoreConfiguration {
  name: string;
  slug: string;
  description: string;
  logo?: string;
  banner?: string;
  primaryColor?: string;
  secondaryColor?: string;
  businessHours: Array<{
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
  }>;
  shippingPolicies: {
    domesticShipping: boolean;
    internationalShipping: boolean;
    freeShippingThreshold?: number;
    processingTime: string;
  };
  returnPolicy: {
    accepted: boolean;
    returnWindow: number; // days
    condition: string;
  };
}

@Injectable()
export class VendorOnboardingService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async submitVendorApplication(userId: string, applicationData: VendorApplicationData): Promise<any> {
    // Check if user already has a vendor store
    const existingStore = await this.prisma.store.findFirst({
      where: { 
        userId,
        isActive: true
      },
    });

    if (existingStore) {
      throw new BadRequestException('You already have a vendor store');
    }

    // Validate business registration if provided
    if (applicationData.businessRegistrationNumber) {
      const isValid = await this.validateBusinessRegistration(
        applicationData.businessRegistrationNumber,
        applicationData.businessType,
      );
      
      if (!isValid) {
        throw new BadRequestException('Invalid business registration number');
      }
    }

    // Create vendor application verification record
    const application = await this.prisma.verification.create({
      data: {
        userId,
        type: 'ADDRESS', // Using ADDRESS as a generic verification type for vendor data
        status: 'PENDING',
        result: {
          businessName: applicationData.businessName,
          businessType: applicationData.businessType,
          businessRegistrationNumber: applicationData.businessRegistrationNumber,
          taxIdNumber: applicationData.taxIdNumber,
          businessAddress: applicationData.businessAddress,
          contactInfo: applicationData.contactInfo,
          bankAccount: applicationData.bankAccount,
          documents: applicationData.documents,
          categories: applicationData.categories,
          description: applicationData.description,
          submittedAt: new Date()
        }
      },
    });

    // Send notification to admin for review
    await this.notificationService.sendNotification({
      userId: 'admin', // Admin user ID
      type: 'GENERAL',
      title: 'New Vendor Application',
      message: `New vendor application from ${applicationData.businessName} requires review.`,
      channels: ['email', 'push'],
    });

    // Send confirmation to applicant
    await this.notificationService.sendNotification({
      userId,
      type: 'GENERAL',
      title: 'Vendor Application Submitted',
      message: 'Your vendor application has been submitted successfully. We will review it within 2-3 business days.',
      channels: ['email', 'push'],
    });

    return {
      applicationId: application.id,
      status: application.status,
      message: 'Application submitted successfully',
    };
  }

  async createStore(userId: string, configuration: StoreConfiguration): Promise<any> {
    // Check if user has approved vendor application
    const vendorApplication = await this.prisma.verification.findFirst({
      where: { 
        userId,
        type: 'EMPLOYMENT', // Using EMPLOYMENT as vendor application verification
        status: 'VERIFIED'
      },
    });

    if (!vendorApplication) {
      throw new BadRequestException('You must have an approved vendor application to create a store');
    }

    // Check if store name/slug is available
    const existingStore = await this.prisma.store.findFirst({
      where: {
        OR: [
          { name: configuration.name },
          { slug: configuration.slug }
        ]
      },
    });

    if (existingStore) {
      throw new BadRequestException('Store name or subdomain already exists');
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(configuration.slug)) {
      throw new BadRequestException('Store subdomain can only contain lowercase letters, numbers, and hyphens');
    }

    // Create store
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
          businessHours: configuration.businessHours,
          shippingPolicies: configuration.shippingPolicies,
          returnPolicy: configuration.returnPolicy,
        },
        isActive: true,
        subdomain: `${configuration.slug}.dorce.ai`,
      },
    });

    // Store settings are handled in store creation

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

  async getVendorApplicationStatus(userId: string): Promise<any> {
    const verification = await this.prisma.verification.findFirst({
      where: { 
        userId,
        type: 'EMPLOYMENT'
      },
      orderBy: { createdAt: 'desc' },
    });

    const store = await this.prisma.store.findFirst({
      where: { userId },
    });

    if (store) {
      return {
        hasApplication: true,
        hasStore: true,
        status: 'APPROVED',
        storeId: store.id,
        canApply: false,
      };
    }

    if (!verification) {
      return {
        hasApplication: false,
        canApply: true,
      };
    }

    return {
      hasApplication: true,
      applicationId: verification.id,
      status: verification.status,
      submittedAt: verification.createdAt,
      reviewedAt: verification.updatedAt,
      rejectionReason: (verification.result as any)?.rejectionReason,
      canReapply: verification.status === 'FAILED',
    };
  }

  async getStoreByVendor(userId: string): Promise<any> {
    const store = await this.prisma.store.findFirst({
      where: { 
        userId,
        isVerified: true
      },
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
      where: { 
        userId,
        isVerified: true
      },
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
        totalProducts: store._count.products,
        totalOrders: store._count.orders,
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

  private async validateBusinessRegistration(registrationNumber: string, businessType: string): Promise<boolean> {
    // In a real implementation, this would integrate with CAC API
    // For now, we'll do basic validation
    if (businessType === 'LIMITED_LIABILITY' || businessType === 'CORPORATION') {
      return /^RC\d{6,}$/.test(registrationNumber);
    }
    return /^BN\d{6,}$/.test(registrationNumber);
  }
}