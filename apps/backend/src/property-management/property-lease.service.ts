import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface CreateLeaseDto {
  userId: string;
  propertyId: string;
  tenantId: string;
  leaseType: 'FIXED_TERM' | 'MONTH_TO_MONTH' | 'WEEK_TO_WEEK';
  startDate: Date;
  endDate?: Date;
  monthlyRent: number;
  securityDeposit: number;
  terms: {
    utilities: string[];
    petPolicy: string;
    maintenanceResponsibility: string;
    lateFeePolicy: string;
    renewalOptions: string;
  };
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
}

export interface LeaseDto {
  id: string;
  userId: string;
  propertyId: string;
  tenantId: string;
  leaseType: 'FIXED_TERM' | 'MONTH_TO_MONTH' | 'WEEK_TO_WEEK';
  startDate: Date;
  endDate?: Date;
  monthlyRent: number;
  securityDeposit: number;
  terms: {
    utilities: string[];
    petPolicy: string;
    maintenanceResponsibility: string;
    lateFeePolicy: string;
    renewalOptions: string;
  };
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PropertyLeaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async createLease(dto: CreateLeaseDto): Promise<LeaseDto> {
    try {
      const leaseData = {
        userId: dto.userId,
        propertyId: dto.propertyId,
        tenantId: dto.tenantId,
        leaseType: dto.leaseType,
        startDate: dto.startDate,
        endDate: dto.endDate,
        monthlyRent: dto.monthlyRent,
        securityDeposit: dto.securityDeposit,
        terms: dto.terms,
        status: dto.status,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const leaseDoc = await this.prisma.document.create({
        data: {
          userId: dto.userId,
          type: 'OTHER',
          fileName: 'PROPERTY_LEASE',
          fileSize: 0,
          mimeType: 'application/json',
          fileUrl: JSON.stringify(leaseData)
        }
      });

      await this.auditService.log({
        userId: dto.userId,
        action: 'LEASE_CREATED',
        resourceType: 'PROPERTY_LEASE',
        resourceId: leaseDoc.id,
        actionDetails: { 
          propertyId: dto.propertyId, 
          tenantId: dto.tenantId, 
          monthlyRent: dto.monthlyRent 
        }
      });

      return {
        id: leaseDoc.id,
        ...leaseData
      };
    } catch (error) {
      await this.auditService.log({
        userId: dto.userId,
        action: 'LEASE_CREATION_FAILED',
        resourceType: 'PROPERTY_LEASE',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getLease(id: string, userId: string): Promise<LeaseDto | null> {
    try {
      const leaseDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_LEASE'
        }
      });

      if (!leaseDoc) {
        return null;
      }

      const leaseData = JSON.parse(leaseDoc.fileUrl || '{}');
      return {
        id: leaseDoc.id,
        ...leaseData
      };
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'LEASE_RETRIEVAL_FAILED',
        resourceType: 'PROPERTY_LEASE',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getUserLeases(userId: string): Promise<LeaseDto[]> {
    try {
      const leaseDocs = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_LEASE'
        }
      });

      const leases = leaseDocs.map(doc => {
        const data = JSON.parse(doc.fileUrl || '{}');
        return {
          id: doc.id,
          ...data
        };
      });

      return leases;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'USER_LEASES_RETRIEVAL_FAILED',
        resourceType: 'PROPERTY_LEASE',
        resourceId: 'ALL',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getPropertyLeases(propertyId: string, userId: string): Promise<LeaseDto[]> {
    try {
      const leaseDocs = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_LEASE',
          fileUrl: {
            contains: `"propertyId":"${propertyId}"`
          }
        }
      });

      const leases = leaseDocs.map(doc => {
        const data = JSON.parse(doc.fileUrl || '{}');
        return {
          id: doc.id,
          ...data
        };
      });

      return leases;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'PROPERTY_LEASES_RETRIEVAL_FAILED',
        resourceType: 'PROPERTY_LEASE',
        resourceId: propertyId,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async updateLeaseStatus(id: string, userId: string, status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'): Promise<LeaseDto> {
    try {
      const leaseDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_LEASE'
        }
      });

      if (!leaseDoc) {
        throw new NotFoundException('Lease not found');
      }

      const leaseData = JSON.parse(leaseDoc.fileUrl || '{}');
      leaseData.status = status;
      leaseData.updatedAt = new Date();

      await this.prisma.document.update({
        where: { id },
        data: {
          fileUrl: JSON.stringify(leaseData)
        }
      });

      await this.auditService.log({
        userId,
        action: 'LEASE_STATUS_UPDATED',
        resourceType: 'PROPERTY_LEASE',
        resourceId: id,
        actionDetails: { status }
      });

      return {
        id: leaseDoc.id,
        ...leaseData
      };
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'LEASE_STATUS_UPDATE_FAILED',
        resourceType: 'PROPERTY_LEASE',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async deleteLease(id: string, userId: string): Promise<boolean> {
    try {
      const leaseDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_LEASE'
        }
      });

      if (!leaseDoc) {
        throw new NotFoundException('Lease not found');
      }

      await this.prisma.document.delete({
        where: { id }
      });

      await this.auditService.log({
        userId,
        action: 'LEASE_DELETED',
        resourceType: 'PROPERTY_LEASE',
        resourceId: id,
        actionDetails: { leaseId: id }
      });

      return true;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'LEASE_DELETION_FAILED',
        resourceType: 'PROPERTY_LEASE',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getExpiringLeases(userId: string): Promise<LeaseDto[]> {
    try {
      const leaseDocs = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_LEASE'
        }
      });

      const currentDate = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

      const expiringLeases = leaseDocs
        .map(doc => {
          const data = JSON.parse(doc.fileUrl || '{}');
          return {
            id: doc.id,
            ...data
          };
        })
        .filter(lease => {
          if (!lease.endDate) return false;
          const endDate = new Date(lease.endDate);
          return endDate <= thirtyDaysFromNow && endDate >= currentDate;
        });

      await this.auditService.log({
        userId,
        action: 'EXPIRING_LEASES_ACCESSED',
        resourceType: 'PROPERTY_LEASE',
        resourceId: 'EXPIRING',
        actionDetails: { expiringCount: expiringLeases.length }
      });

      return expiringLeases;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'EXPIRING_LEASES_RETRIEVAL_FAILED',
        resourceType: 'PROPERTY_LEASE',
        resourceId: 'EXPIRING',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }
}