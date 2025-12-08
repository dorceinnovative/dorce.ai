import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InfrastructurePlanningService {
  constructor(private readonly prisma: PrismaService) {}

  async planInfrastructure(projectId: string, infrastructureData: any, userId: string) {
    const { infrastructureType, utilities, transportation, communication, costEstimate } = infrastructureData;

    const infrastructure = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `infrastructure-planning-${projectId}`,
        fileUrl: JSON.stringify({
          projectId,
          userId,
          type: 'INFRASTRUCTURE_PLANNING',
          infrastructureType,
          utilities,
          transportation,
          communication,
          costEstimate,
          status: 'PLANNED',
          planningDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }),
        userId,
        fileSize: 0,
        mimeType: 'application/json',
      },
    });

    return infrastructure;
  }

  async getInfrastructurePlan(projectId: string, userId: string) {
    const infrastructure = await this.prisma.document.findFirst({
      where: { 
        fileName: `infrastructure-planning-${projectId}`,
        userId,
        type: 'OTHER'
      },
    });

    if (!infrastructure) {
      throw new Error('Infrastructure plan not found');
    }

    return {
      ...infrastructure,
      fileUrl: JSON.parse(infrastructure.fileUrl as string),
    };
  }
}