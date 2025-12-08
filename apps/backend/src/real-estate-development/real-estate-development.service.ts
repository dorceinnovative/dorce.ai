import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallets/wallet.service';
import { LedgerService } from '../ledger/ledger.service';
import { SecurityService } from '../security/security.service';
import { AuditService } from '../audit/audit.service';
import { DICService } from '../dic/dic.service';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class RealEstateDevelopmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly ledgerService: LedgerService,
    private readonly securityService: SecurityService,
    private readonly auditService: AuditService,
    private readonly dicService: DICService,
    private readonly chatService: ChatService,
  ) {}

  async createDevelopmentProject(projectData: any, userId: string) {
    const project = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `development-project-${Date.now()}`,
        fileSize: 0,
        mimeType: 'application/json',
        fileUrl: JSON.stringify({
          ...projectData,
          userId,
          type: 'REAL_ESTATE_DEVELOPMENT',
          status: 'PLANNING',
          phase: 'PRE_ACQUISITION',
          progress: 0,
          totalBudget: projectData.totalBudget || 0,
          spentBudget: 0,
          expectedROI: projectData.expectedROI || 0,
          createdAt: new Date().toISOString(),
        }),
        userId,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CREATE_DEVELOPMENT_PROJECT',
      resourceType: 'REAL_ESTATE_DEVELOPMENT',
      resourceId: project.id,
      actionDetails: { projectData },
    });

    return project;
  }

  async getDevelopmentProjects(userId: string, query: any) {
    const projects = await this.prisma.document.findMany({
      where: { userId, type: 'OTHER' },
      take: 50,
      skip: 0,
      orderBy: { createdAt: 'desc' },
    });

    return projects.map(project => ({
      ...project,
      fileUrl: JSON.parse(project.fileUrl as string),
    }));
  }

  async getDevelopmentProject(id: string, userId: string) {
    const project = await this.prisma.document.findFirst({
      where: { id, userId, type: 'OTHER' },
    });

    if (!project) {
      throw new Error('Development project not found');
    }

    return {
      ...project,
      fileUrl: JSON.parse(project.fileUrl as string),
    };
  }

  async updateDevelopmentProject(id: string, updateData: any, userId: string) {
    const project = await this.getDevelopmentProject(id, userId);
    const currentData = project.fileUrl;

    const updatedProject = await this.prisma.document.update({
      where: { id },
      data: {
        fileUrl: JSON.stringify({
          ...currentData,
          ...updateData,
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    return updatedProject;
  }

  async deleteDevelopmentProject(id: string, userId: string) {
    await this.getDevelopmentProject(id, userId);
    
    await this.prisma.document.delete({
      where: { id },
    });

    return { message: 'Development project deleted successfully' };
  }

  async getDevelopmentAnalytics(projectId: string, userId: string) {
    const project = await this.getDevelopmentProject(projectId, userId);
    const projectData = project.fileUrl;

    return {
      projectOverview: {
        totalBudget: projectData.totalBudget || 0,
        spentBudget: projectData.spentBudget || 0,
        budgetUtilization: ((projectData.spentBudget || 0) / (projectData.totalBudget || 1)) * 100,
        currentPhase: projectData.phase || 'PLANNING',
        overallProgress: projectData.progress || 0,
      },
    };
  }

  async calculateROIProjection(projectId: string, userId: string) {
    const project = await this.getDevelopmentProject(projectId, userId);
    const projectData = project.fileUrl;

    const totalInvestment = projectData.totalBudget || 0;
    const expectedRevenue = projectData.expectedRevenue || 0;

    return {
      totalInvestment,
      expectedRevenue,
      projectedProfit: expectedRevenue - totalInvestment,
      roiPercentage: totalInvestment > 0 ? ((expectedRevenue - totalInvestment) / totalInvestment) * 100 : 0,
    };
  }

  async getMarketAnalysis(query: any, userId: string) {
    return {
      location: query.location || 'General',
      propertyType: query.propertyType || 'Mixed Use',
      marketTrends: {
        demand: 'High',
        supply: 'Moderate',
        priceTrend: 'Increasing',
        competition: 'Moderate',
      },
    };
  }

  async getDevelopmentOpportunities(query: any, userId: string) {
    return [
      {
        id: 'opp-1',
        name: 'Urban Residential Complex',
        location: query.location || 'Downtown',
        type: 'Residential',
        expectedROI: '15-20%',
        riskLevel: query.riskTolerance || 'Moderate',
      },
    ];
  }
}