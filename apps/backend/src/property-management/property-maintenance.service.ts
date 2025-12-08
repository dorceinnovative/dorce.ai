import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PropertyMaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async createMaintenanceRequest(data: any) {
    try {
      const maintenanceDoc = await this.prisma.document.create({
        data: {
          userId: data.userId,
          type: 'OTHER',
          fileName: 'PROPERTY_MAINTENANCE',
          fileSize: 0,
          mimeType: 'application/json',
          fileUrl: JSON.stringify(data)
        }
      });

      await this.auditService.log({
        userId: data.userId,
        action: 'MAINTENANCE_REQUEST_CREATED',
        resourceType: 'PROPERTY_MAINTENANCE',
        resourceId: maintenanceDoc.id,
        actionDetails: { propertyId: data.propertyId, issue: data.issue }
      });

      return { id: maintenanceDoc.id, ...data };
    } catch (error) {
      await this.auditService.log({
        userId: data.userId,
        action: 'MAINTENANCE_REQUEST_FAILED',
        resourceType: 'PROPERTY_MAINTENANCE',
        resourceId: 'N/A',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getMaintenanceRequests(userId: string) {
    const docs = await this.prisma.document.findMany({
      where: {
        userId,
        type: 'OTHER',
        fileName: 'PROPERTY_MAINTENANCE'
      }
    });

    return docs.map(doc => ({
      id: doc.id,
      ...JSON.parse(doc.fileUrl)
    }));
  }

  async updateMaintenanceRequest(id: string, userId: string, updates: any) {
    const existing = await this.prisma.document.findFirst({
      where: { id, userId, type: 'OTHER', fileName: 'PROPERTY_MAINTENANCE' }
    });

    if (!existing) {
      throw new Error('Maintenance request not found');
    }

    const updatedData = { ...JSON.parse(existing.fileUrl), ...updates };

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        fileUrl: JSON.stringify(updatedData)
      }
    });

    await this.auditService.log({
      userId,
      action: 'MAINTENANCE_REQUEST_UPDATED',
      resourceType: 'PROPERTY_MAINTENANCE',
      resourceId: id,
      actionDetails: updates
    });

    return { id: updated.id, ...updatedData };
  }
}