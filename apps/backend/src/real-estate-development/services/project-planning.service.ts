import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectPlanningService {
  constructor(private readonly prisma: PrismaService) {}

  async createProjectPlan(projectId: string, planData: any, userId: string) {
    const plan = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `project-plan-${projectId}`,
        fileUrl: JSON.stringify({
          ...planData,
          projectId,
          userId,
          type: 'PROJECT_PLAN',
          status: 'DRAFT',
          phases: planData.phases || [],
          milestones: planData.milestones || [],
          resources: planData.resources || [],
          timeline: planData.timeline || {},
          createdAt: new Date().toISOString(),
        }),
        userId,
        fileSize: 0,
        mimeType: 'application/json',
      },
    });

    return plan;
  }

  async getProjectPlan(projectId: string, userId: string) {
    const plan = await this.prisma.document.findFirst({
      where: { 
        fileName: `project-plan-${projectId}`,
        userId,
        type: 'OTHER'
      },
    });

    if (!plan) {
      throw new Error('Project plan not found');
    }

    return {
      ...plan,
      fileUrl: JSON.parse(plan.fileUrl as string),
    };
  }
}