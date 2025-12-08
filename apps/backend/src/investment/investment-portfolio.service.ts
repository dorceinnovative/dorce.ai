import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface PortfolioCreateDto {
  userId: string;
  name: string;
  description?: string;
  investmentIds: string[];
  targetAllocation?: Record<string, number>;
}

export interface PortfolioDto {
  id: string;
  userId: string;
  name: string;
  description?: string;
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  returnPercentage: number;
  investmentIds: string[];
  targetAllocation: Record<string, number>;
  currentAllocation: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class InvestmentPortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async createPortfolio(dto: PortfolioCreateDto): Promise<PortfolioDto> {
    try {
      const portfolioData = {
        userId: dto.userId,
        name: dto.name,
        description: dto.description,
        investmentIds: dto.investmentIds,
        targetAllocation: dto.targetAllocation || {},
        currentAllocation: {},
        totalValue: 0,
        totalCost: 0,
        totalReturn: 0,
        returnPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const portfolioDoc = await this.prisma.document.create({
        data: {
          userId: dto.userId,
          type: 'OTHER',
          fileName: 'INVESTMENT_PORTFOLIO',
          fileSize: 0,
          mimeType: 'application/json',
          fileUrl: JSON.stringify(portfolioData)
        }
      });

      await this.auditService.log({
        userId: dto.userId,
        action: 'PORTFOLIO_CREATED',
        resourceType: 'INVESTMENT_PORTFOLIO',
        resourceId: portfolioDoc.id,
        actionDetails: { name: dto.name, investmentCount: dto.investmentIds.length }
      });

      return {
        id: portfolioDoc.id,
        ...portfolioData
      };
    } catch (error) {
      await this.auditService.log({
        userId: dto.userId,
        action: 'PORTFOLIO_CREATION_FAILED',
        resourceType: 'INVESTMENT_PORTFOLIO',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getPortfolio(id: string, userId: string): Promise<PortfolioDto | null> {
    try {
      const portfolioDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId,
          type: 'OTHER',
          fileName: 'INVESTMENT_PORTFOLIO'
        }
      });

      if (!portfolioDoc) {
        return null;
      }

      const portfolioData = JSON.parse(portfolioDoc.fileUrl || '{}');
      return {
        id: portfolioDoc.id,
        ...portfolioData
      };
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'PORTFOLIO_RETRIEVAL_FAILED',
        resourceType: 'INVESTMENT_PORTFOLIO',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getUserPortfolios(userId: string): Promise<PortfolioDto[]> {
    try {
      const portfolioDocs = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'INVESTMENT_PORTFOLIO'
        }
      });

      const portfolios = portfolioDocs.map(doc => {
        const data = JSON.parse(doc.fileUrl || '{}');
        return {
          id: doc.id,
          ...data
        };
      });

      return portfolios;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'PORTFOLIOS_RETRIEVAL_FAILED',
        resourceType: 'INVESTMENT_PORTFOLIO',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async updatePortfolioAllocation(id: string, userId: string, allocation: Record<string, number>): Promise<PortfolioDto> {
    try {
      const portfolioDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId,
          type: 'OTHER',
          fileName: 'INVESTMENT_PORTFOLIO'
        }
      });

      if (!portfolioDoc) {
        throw new NotFoundException('Portfolio not found');
      }

      const portfolioData = JSON.parse(portfolioDoc.fileUrl || '{}');
      portfolioData.targetAllocation = allocation;
      portfolioData.updatedAt = new Date();

      await this.prisma.document.update({
        where: { id },
        data: {
          fileUrl: JSON.stringify(portfolioData)
        }
      });

      await this.auditService.log({
        userId,
        action: 'PORTFOLIO_ALLOCATION_UPDATED',
        resourceType: 'INVESTMENT_PORTFOLIO',
        resourceId: id,
        actionDetails: { allocation }
      });

      return {
        id: portfolioDoc.id,
        ...portfolioData
      };
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'PORTFOLIO_ALLOCATION_UPDATE_FAILED',
        resourceType: 'INVESTMENT_PORTFOLIO',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async updatePortfolioPerformance(id: string, userId: string, performance: {
    totalValue: number;
    totalCost: number;
    totalReturn: number;
    returnPercentage: number;
    currentAllocation: Record<string, number>;
  }): Promise<PortfolioDto> {
    try {
      const portfolioDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId,
          type: 'OTHER',
          fileName: 'INVESTMENT_PORTFOLIO'
        }
      });

      if (!portfolioDoc) {
        throw new NotFoundException('Portfolio not found');
      }

      const portfolioData = JSON.parse(portfolioDoc.fileUrl || '{}');
      portfolioData.totalValue = performance.totalValue;
      portfolioData.totalCost = performance.totalCost;
      portfolioData.totalReturn = performance.totalReturn;
      portfolioData.returnPercentage = performance.returnPercentage;
      portfolioData.currentAllocation = performance.currentAllocation;
      portfolioData.updatedAt = new Date();

      await this.prisma.document.update({
        where: { id },
        data: {
          fileUrl: JSON.stringify(portfolioData)
        }
      });

      await this.auditService.log({
        userId,
        action: 'PORTFOLIO_PERFORMANCE_UPDATED',
        resourceType: 'INVESTMENT_PORTFOLIO',
        resourceId: id,
        actionDetails: performance
      });

      return {
        id: portfolioDoc.id,
        ...portfolioData
      };
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'PORTFOLIO_PERFORMANCE_UPDATE_FAILED',
        resourceType: 'INVESTMENT_PORTFOLIO',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async deletePortfolio(id: string, userId: string): Promise<void> {
    try {
      const portfolioDoc = await this.prisma.document.findFirst({
        where: {
          id,
          userId,
          type: 'OTHER',
          fileName: 'INVESTMENT_PORTFOLIO'
        }
      });

      if (!portfolioDoc) {
        throw new NotFoundException('Portfolio not found');
      }

      await this.prisma.document.delete({
        where: { id }
      });

      await this.auditService.log({
        userId,
        action: 'PORTFOLIO_DELETED',
        resourceType: 'INVESTMENT_PORTFOLIO',
        resourceId: id,
        actionDetails: { portfolioId: id }
      });
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'PORTFOLIO_DELETION_FAILED',
        resourceType: 'INVESTMENT_PORTFOLIO',
        resourceId: id,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }
}