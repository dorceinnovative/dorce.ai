import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WalletService } from '../wallets/wallet.service';
import { LedgerService, TransactionCategory } from '../ledger/ledger.service';

export interface CreatePropertyDto {
  userId: string;
  title: string;
  description?: string;
  type: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'MIXED_USE';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  details: {
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    yearBuilt?: number;
    amenities?: string[];
  };
  purchasePrice: number;
  currentValue: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SOLD';
  images?: string[];
}

export interface PropertyDto {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: string;
  address: any;
  details: any;
  purchasePrice: number;
  currentValue: number;
  status: string;
  images?: string[];
  occupancyRate: number;
  monthlyRent: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PropertyManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly walletService: WalletService,
    private readonly ledgerService: LedgerService
  ) {}

  async createProperty(dto: CreatePropertyDto): Promise<PropertyDto> {
    try {
      const propertyData = {
        userId: dto.userId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        address: dto.address,
        details: dto.details,
        purchasePrice: dto.purchasePrice,
        currentValue: dto.currentValue,
        status: dto.status,
        images: dto.images || [],
        occupancyRate: 0,
        monthlyRent: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const propertyDoc = await this.prisma.document.create({
        data: {
          userId: dto.userId,
          type: 'OTHER',
          fileName: 'PROPERTY_RECORD',
          fileSize: 0,
          mimeType: 'application/json',
          fileUrl: JSON.stringify(propertyData)
        }
      });

      await this.auditService.log({
        userId: dto.userId,
        action: 'PROPERTY_CREATED',
        resourceType: 'PROPERTY',
        resourceId: propertyDoc.id,
        actionDetails: { 
          title: dto.title, 
          type: dto.type, 
          purchasePrice: dto.purchasePrice 
        }
      });

      return {
        id: propertyDoc.id,
        ...propertyData
      };
    } catch (error) {
      await this.auditService.log({
        userId: dto.userId,
        action: 'PROPERTY_CREATION_FAILED',
        resourceType: 'PROPERTY',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getProperty(id: string, userId: string): Promise<PropertyDto | null> {
    try {
      const propertyDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_RECORD'
        }
      });

      if (!propertyDoc) {
        return null;
      }

      const propertyData = JSON.parse(propertyDoc.fileUrl || '{}');
      return {
        id: propertyDoc.id,
        ...propertyData
      };
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'PROPERTY_RETRIEVAL_FAILED',
        resourceType: 'PROPERTY',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getUserProperties(userId: string): Promise<PropertyDto[]> {
    try {
      const propertyDocs = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_RECORD'
        }
      });

      const properties = propertyDocs.map(doc => {
        const data = JSON.parse(doc.fileUrl || '{}');
        return {
          id: doc.id,
          ...data
        };
      });

      return properties;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'PROPERTIES_RETRIEVAL_FAILED',
        resourceType: 'PROPERTY',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async updateProperty(id: string, dto: Partial<CreatePropertyDto>): Promise<PropertyDto> {
    try {
      const propertyDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId: dto.userId,
          type: 'OTHER',
          fileName: 'PROPERTY_RECORD'
        }
      });

      if (!propertyDoc) {
        throw new NotFoundException('Property not found');
      }

      const existingData = JSON.parse(propertyDoc.fileUrl || '{}');
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
        userId: dto.userId!,
        action: 'PROPERTY_UPDATED',
        resourceType: 'PROPERTY',
        resourceId: id,
        actionDetails: { updatedFields: Object.keys(dto) }
      });

      return {
        id,
        ...updatedData
      };
    } catch (error) {
      await this.auditService.log({
        userId: dto.userId!,
        action: 'PROPERTY_UPDATE_FAILED',
        resourceType: 'PROPERTY',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async updatePropertyValue(id: string, userId: string, currentValue: number): Promise<PropertyDto> {
    try {
      const propertyDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_RECORD'
        }
      });

      if (!propertyDoc) {
        throw new NotFoundException('Property not found');
      }

      const propertyData = JSON.parse(propertyDoc.fileUrl || '{}');
      propertyData.currentValue = currentValue;
      propertyData.updatedAt = new Date();

      await this.prisma.document.update({
        where: { id },
        data: {
          fileUrl: JSON.stringify(propertyData)
        }
      });

      await this.auditService.log({
        userId,
        action: 'PROPERTY_VALUE_UPDATED',
        resourceType: 'PROPERTY',
        resourceId: id,
        actionDetails: { currentValue }
      });

      return {
        id: propertyDoc.id,
        ...propertyData
      };
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'PROPERTY_VALUE_UPDATE_FAILED',
        resourceType: 'PROPERTY',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async updatePropertyStatus(id: string, userId: string, status: 'ACTIVE' | 'INACTIVE' | 'SOLD'): Promise<PropertyDto> {
    try {
      const propertyDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_RECORD'
        }
      });

      if (!propertyDoc) {
        throw new NotFoundException('Property not found');
      }

      const propertyData = JSON.parse(propertyDoc.fileUrl || '{}');
      propertyData.status = status;
      propertyData.updatedAt = new Date();

      await this.prisma.document.update({
        where: { id },
        data: {
          fileUrl: JSON.stringify(propertyData)
        }
      });

      await this.auditService.log({
        userId,
        action: 'PROPERTY_STATUS_UPDATED',
        resourceType: 'PROPERTY',
        resourceId: id,
        actionDetails: { status }
      });

      return {
        id: propertyDoc.id,
        ...propertyData
      };
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'PROPERTY_STATUS_UPDATE_FAILED',
        resourceType: 'PROPERTY',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getVacancies(userId: string): Promise<any[]> {
    try {
      const propertyDocs = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_RECORD'
        }
      });

      const vacancies = propertyDocs
        .map(doc => JSON.parse(doc.fileUrl || '{}'))
        .filter(property => property.status === 'ACTIVE' && property.occupancyRate === 0)
        .map(property => ({
          propertyId: property.id,
          title: property.title,
          address: property.address,
          monthlyRent: property.monthlyRent || 0
        }));

      await this.auditService.log({
        userId,
        action: 'VACANCIES_ACCESSED',
        resourceType: 'PROPERTY',
        resourceId: 'VACANCIES',
        actionDetails: { vacancyCount: vacancies.length }
      });

      return vacancies;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'VACANCIES_RETRIEVAL_FAILED',
        resourceType: 'PROPERTY',
        resourceId: 'VACANCIES',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }
}