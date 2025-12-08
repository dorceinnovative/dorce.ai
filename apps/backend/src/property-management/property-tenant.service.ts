import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface CreateTenantDto {
  userId: string;
  propertyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  employmentDetails?: {
    employer: string;
    position: string;
    monthlyIncome: number;
  };
  references?: {
    name: string;
    phone: string;
    relationship: string;
  }[];
  leaseStartDate: Date;
  leaseEndDate: Date;
  monthlyRent: number;
  securityDeposit: number;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'EVICTED';
  notes?: string;
}

export interface TenantDto {
  id: string;
  userId: string;
  propertyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  employmentDetails?: {
    employer: string;
    position: string;
    monthlyIncome: number;
  };
  references?: {
    name: string;
    phone: string;
    relationship: string;
  }[];
  leaseStartDate: Date;
  leaseEndDate: Date;
  monthlyRent: number;
  securityDeposit: number;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'EVICTED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PropertyTenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async createTenant(dto: CreateTenantDto): Promise<TenantDto> {
    try {
      const tenantData = {
        userId: dto.userId,
        propertyId: dto.propertyId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth,
        emergencyContact: dto.emergencyContact,
        employmentDetails: dto.employmentDetails,
        references: dto.references,
        leaseStartDate: dto.leaseStartDate,
        leaseEndDate: dto.leaseEndDate,
        monthlyRent: dto.monthlyRent,
        securityDeposit: dto.securityDeposit,
        status: dto.status,
        notes: dto.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const tenantDoc = await this.prisma.document.create({
        data: {
          userId: dto.userId,
          type: 'OTHER',
          fileName: 'PROPERTY_TENANT',
          fileSize: 0,
          mimeType: 'application/json',
          fileUrl: JSON.stringify(tenantData)
        }
      });

      await this.auditService.log({
        userId: dto.userId,
        action: 'TENANT_CREATED',
        resourceType: 'PROPERTY_TENANT',
        resourceId: tenantDoc.id,
        actionDetails: { 
          firstName: dto.firstName, 
          lastName: dto.lastName, 
          propertyId: dto.propertyId 
        }
      });

      return {
        id: tenantDoc.id,
        ...tenantData
      };
    } catch (error) {
      await this.auditService.log({
        userId: dto.userId,
        action: 'TENANT_CREATION_FAILED',
        resourceType: 'PROPERTY_TENANT',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getTenant(id: string, userId: string): Promise<TenantDto | null> {
    try {
      const tenantDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_TENANT'
        }
      });

      if (!tenantDoc) {
        return null;
      }

      const tenantData = JSON.parse(tenantDoc.fileUrl || '{}');
      return {
        id: tenantDoc.id,
        ...tenantData
      };
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'TENANT_RETRIEVAL_FAILED',
        resourceType: 'PROPERTY_TENANT',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getUserTenants(userId: string): Promise<TenantDto[]> {
    try {
      const tenantDocs = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_TENANT'
        }
      });

      const tenants = tenantDocs.map(doc => {
        const data = JSON.parse(doc.fileUrl || '{}');
        return {
          id: doc.id,
          ...data
        };
      });

      return tenants;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'TENANTS_RETRIEVAL_FAILED',
        resourceType: 'PROPERTY_TENANT',
        resourceId: 'ALL',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getPropertyTenants(propertyId: string, userId: string): Promise<TenantDto[]> {
    try {
      const tenantDocs = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_TENANT',
          fileUrl: {
            contains: `"propertyId":"${propertyId}"`
          }
        }
      });

      const tenants = tenantDocs.map(doc => {
        const data = JSON.parse(doc.fileUrl || '{}');
        return {
          id: doc.id,
          ...data
        };
      });

      return tenants;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'PROPERTY_TENANTS_RETRIEVAL_FAILED',
        resourceType: 'PROPERTY_TENANT',
        resourceId: propertyId,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async updateTenant(id: string, userId: string, dto: Partial<CreateTenantDto>): Promise<TenantDto> {
    try {
      const tenantDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_TENANT'
        }
      });

      if (!tenantDoc) {
        throw new NotFoundException('Tenant not found');
      }

      const existingData = JSON.parse(tenantDoc.fileUrl || '{}');
      const updatedData = {
        ...existingData,
        ...dto,
        updatedAt: new Date()
      };

      await this.prisma.document.update({
        where: { id },
        data: {
          fileUrl: JSON.stringify(updatedData)
        }
      });

      await this.auditService.log({
        userId,
        action: 'TENANT_UPDATED',
        resourceType: 'PROPERTY_TENANT',
        resourceId: id,
        actionDetails: { updatedFields: Object.keys(dto) }
      });

      return {
        id,
        ...updatedData
      };
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'TENANT_UPDATE_FAILED',
        resourceType: 'PROPERTY_TENANT',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async deleteTenant(id: string, userId: string): Promise<boolean> {
    try {
      const tenantDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_TENANT'
        }
      });

      if (!tenantDoc) {
        throw new NotFoundException('Tenant not found');
      }

      await this.prisma.document.delete({
        where: { id }
      });

      await this.auditService.log({
        userId,
        action: 'TENANT_DELETED',
        resourceType: 'PROPERTY_TENANT',
        resourceId: id,
        actionDetails: { tenantId: id }
      });

      return true;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'TENANT_DELETION_FAILED',
        resourceType: 'PROPERTY_TENANT',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }
}