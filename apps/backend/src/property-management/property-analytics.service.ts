import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PropertyAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async getPropertyAnalytics(userId: string) {
    try {
      const properties = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_RECORD'
        }
      });

      const leases = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_LEASE'
        }
      });

      const maintenance = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_MAINTENANCE'
        }
      });

      const analytics = {
        totalProperties: properties.length,
        totalLeases: leases.length,
        totalMaintenanceRequests: maintenance.length,
        occupancyRate: leases.length / Math.max(properties.length, 1),
        averagePropertyValue: this.calculateAverageValue(properties),
        monthlyRevenue: this.calculateMonthlyRevenue(leases),
        maintenanceRequests: maintenance.length
      };

      await this.auditService.log({
        userId,
        action: 'PROPERTY_ANALYTICS_ACCESSED',
        resourceType: 'PROPERTY_ANALYTICS',
        resourceId: 'ANALYTICS',
        actionDetails: { properties: properties.length, leases: leases.length }
      });

      return analytics;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'PROPERTY_ANALYTICS_FAILED',
        resourceType: 'PROPERTY_ANALYTICS',
        resourceId: 'ERROR',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  private calculateAverageValue(properties: any[]): number {
    if (properties.length === 0) return 0;
    
    const total = properties.reduce((sum, prop) => {
      const data = JSON.parse(prop.fileUrl);
      return sum + (data.value || 0);
    }, 0);
    
    return total / properties.length;
  }

  private calculateMonthlyRevenue(leases: any[]): number {
    return leases.reduce((sum, lease) => {
      const data = JSON.parse(lease.fileUrl);
      return sum + (data.monthlyRent || 0);
    }, 0);
  }

  async getPropertyPerformance(userId: string, propertyId: string) {
    const property = await this.prisma.document.findFirst({
      where: { id: propertyId, userId, type: 'OTHER', fileName: 'PROPERTY_RECORD' }
    });

    if (!property) {
      throw new Error('Property not found');
    }

    const leases = await this.prisma.document.findMany({
      where: {
        userId,
        type: 'OTHER',
        fileName: 'PROPERTY_LEASE',
        fileUrl: { contains: propertyId }
      }
    });

    const maintenance = await this.prisma.document.findMany({
      where: {
        userId,
        type: 'OTHER',
        fileName: 'PROPERTY_MAINTENANCE',
        fileUrl: { contains: propertyId }
      }
    });

    return {
      propertyId,
      totalLeases: leases.length,
      totalMaintenance: maintenance.length,
      currentRent: this.getCurrentRent(leases),
      occupancyHistory: this.getOccupancyHistory(leases)
    };
  }

  private getCurrentRent(leases: any[]): number {
    const activeLease = leases.find(lease => {
      const data = JSON.parse(lease.fileUrl);
      return data.status === 'ACTIVE';
    });
    
    return activeLease ? JSON.parse(activeLease.fileUrl).monthlyRent || 0 : 0;
  }

  private getOccupancyHistory(leases: any[]): any[] {
    return leases.map(lease => {
      const data = JSON.parse(lease.fileUrl);
      return {
        startDate: data.startDate,
        endDate: data.endDate,
        tenant: data.tenantName,
        rent: data.monthlyRent
      };
    });
  }

  async getDashboard(userId: string): Promise<any> {
    return this.getPropertyAnalytics(userId);
  }

  async getInsights(userId: string): Promise<any> {
    const analytics = await this.getPropertyAnalytics(userId);
    return {
      insights: [
        `You have ${analytics.totalProperties} properties with ${analytics.totalLeases} active leases`,
        `Occupancy rate is ${(analytics.occupancyRate * 100).toFixed(1)}%`,
        `Monthly revenue: $${analytics.monthlyRevenue.toLocaleString()}`,
        `${analytics.totalMaintenanceRequests} maintenance requests pending`
      ]
    };
  }
}