import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ConstructionResourceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createResource(resourceData: any, userId: string) {
    const resource = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `construction-resource-${Date.now()}`,
        fileUrl: JSON.stringify({
          ...resourceData,
          userId,
          type: 'CONSTRUCTION_RESOURCE',
          status: 'AVAILABLE',
          utilization: 0,
          createdAt: new Date().toISOString(),
        }),
        fileSize: 0,
        mimeType: 'application/json',
        userId,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CONSTRUCTION_RESOURCE_CREATED',
      resourceType: 'CONSTRUCTION_RESOURCE',
      resourceId: resource.id,
      actionDetails: {
        resourceId: resource.id,
        resourceData,
      }
    });

    return resource;
  }

  async getResources(userId: string) {
    return this.prisma.document.findMany({
      where: {
        userId,
        fileUrl: {
          contains: '"type":"CONSTRUCTION_RESOURCE"',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getResource(id: string, userId: string) {
    return this.prisma.document.findFirst({
      where: {
        id,
        userId,
        fileUrl: {
          contains: '"type":"CONSTRUCTION_RESOURCE"',
        },
      },
    });
  }

  async allocateResource(resourceId: string, allocationData: any, userId: string) {
    const resource = await this.getResource(resourceId, userId);
    if (!resource) {
      throw new Error('Resource not found');
    }

    const resourceData = JSON.parse(resource.fileUrl);
    
    if (resourceData.status !== 'AVAILABLE') {
      throw new Error('Resource not available for allocation');
    }

    const updatedResource = await this.prisma.document.update({
      where: { id: resourceId },
      data: {
        fileUrl: JSON.stringify({
          ...resourceData,
          status: 'ALLOCATED',
          allocationData,
          allocatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    await this.auditService.log({
      userId,
      action: 'CONSTRUCTION_RESOURCE_ALLOCATED',
      resourceType: 'CONSTRUCTION_RESOURCE',
      resourceId: resourceId,
      actionDetails: {
        resourceId,
        allocationData,
      }
    });

    return updatedResource;
  }

  async deallocateResource(resourceId: string, userId: string) {
    const resource = await this.getResource(resourceId, userId);
    if (!resource) {
      throw new Error('Resource not found');
    }

    const resourceData = JSON.parse(resource.fileUrl);
    
    if (resourceData.status !== 'ALLOCATED') {
      throw new Error('Resource not allocated');
    }

    const updatedResource = await this.prisma.document.update({
      where: { id: resourceId },
      data: {
        fileUrl: JSON.stringify({
          ...resourceData,
          status: 'AVAILABLE',
          allocationData: null,
          deallocatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    await this.auditService.log({
      userId,
      action: 'CONSTRUCTION_RESOURCE_DEALLOCATED',
      resourceType: 'CONSTRUCTION_RESOURCE',
      resourceId: resourceId,
      actionDetails: {
        resourceId,
      }
    });

    return updatedResource;
  }

  async updateResourceUtilization(resourceId: string, utilization: number, userId: string) {
    const resource = await this.getResource(resourceId, userId);
    if (!resource) {
      throw new Error('Resource not found');
    }

    const resourceData = JSON.parse(resource.fileUrl);
    
    const updatedResource = await this.prisma.document.update({
      where: { id: resourceId },
      data: {
        fileUrl: JSON.stringify({
          ...resourceData,
          utilization: Math.min(100, Math.max(0, utilization)),
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    await this.auditService.log({
      userId,
      action: 'CONSTRUCTION_RESOURCE_UTILIZATION_UPDATED',
      resourceType: 'CONSTRUCTION_RESOURCE',
      resourceId: resourceId,
      actionDetails: {
        resourceId,
        utilization,
      }
    });

    return updatedResource;
  }

  async getResourceAnalytics(userId: string) {
    const resources = await this.getResources(userId);
    
    const totalResources = resources.length;
    const allocatedResources = resources.filter(r => {
      const data = JSON.parse(r.fileUrl);
      return data.status === 'ALLOCATED';
    }).length;
    
    const availableResources = totalResources - allocatedResources;
    const utilizationRate = totalResources > 0 ? (allocatedResources / totalResources) * 100 : 0;

    const resourceTypes = resources.reduce((acc, r) => {
      const data = JSON.parse(r.fileUrl);
      const type = data.resourceType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalResources,
      allocatedResources,
      availableResources,
      utilizationRate,
      resourceTypes,
      averageUtilization: this.calculateAverageUtilization(resources),
      resourceEfficiency: this.calculateResourceEfficiency(resources),
      timestamp: new Date().toISOString(),
    };
  }

  private calculateAverageUtilization(resources: any[]): number {
    if (resources.length === 0) return 0;
    
    const totalUtilization = resources.reduce((sum, r) => {
      const data = JSON.parse(r.fileUrl);
      return sum + (data.utilization || 0);
    }, 0);
    
    return totalUtilization / resources.length;
  }

  private calculateResourceEfficiency(resources: any[]): number {
    const allocatedResources = resources.filter(r => {
      const data = JSON.parse(r.fileUrl);
      return data.status === 'ALLOCATED';
    });

    if (allocatedResources.length === 0) return 0;
    
    const efficientlyUsed = allocatedResources.filter(r => {
      const data = JSON.parse(r.fileUrl);
      return data.utilization >= 80;
    }).length;
    
    return (efficientlyUsed / allocatedResources.length) * 100;
  }
}