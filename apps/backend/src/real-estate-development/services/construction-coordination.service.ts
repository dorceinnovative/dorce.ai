import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatService } from '../../chat/chat.service';

@Injectable()
export class ConstructionCoordinationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async coordinateConstruction(projectId: string, coordinationData: any, userId: string) {
    const { contractors, timeline, milestones, budget } = coordinationData;

    const coordination = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `construction-coordination-${projectId}`,
        fileUrl: JSON.stringify({
          projectId,
          userId,
          type: 'CONSTRUCTION_COORDINATION',
          contractors,
          timeline,
          milestones,
          budget,
          status: 'COORDINATED',
          progress: 0,
          startDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }),
        userId,
        fileSize: 0,
        mimeType: 'application/json',
      },
    });

    await this.chatService.sendSystemMessage(userId, {
      type: 'CONSTRUCTION_PROJECT',
      title: `Construction Coordination: ${projectId}`,
      content: `Construction coordination initiated for project ${projectId}`,
      metadata: { projectId, coordinationId: coordination.id },
    });

    return coordination;
  }

  async getConstructionProgress(projectId: string, userId: string) {
    const coordination = await this.prisma.document.findFirst({
      where: { 
        fileName: `construction-coordination-${projectId}`,
        userId,
        type: 'OTHER'
      },
    });

    if (!coordination) {
      throw new Error('Construction coordination not found');
    }

    const data = JSON.parse(coordination.fileUrl as string);
    
    return {
      progress: data.progress || 0,
      milestones: data.milestones || [],
      timeline: data.timeline || {},
      contractors: data.contractors || [],
      status: data.status || 'COORDINATED',
    };
  }
}