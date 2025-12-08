import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommunityDevelopmentService {
  constructor(private readonly prisma: PrismaService) {}

  async planCommunityDevelopment(projectId: string, communityData: any, userId: string) {
    const { communityFacilities, greenSpaces, accessibility, sustainability } = communityData;

    const community = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `community-development-${projectId}`,
        fileUrl: JSON.stringify({
          projectId,
          userId,
          type: 'COMMUNITY_DEVELOPMENT',
          communityFacilities,
          greenSpaces,
          accessibility,
          sustainability,
          status: 'PLANNED',
          planningDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }),
        userId,
        fileSize: 0,
        mimeType: 'application/json',
      },
    });

    return community;
  }

  async getCommunityDevelopmentPlan(projectId: string, userId: string) {
    const community = await this.prisma.document.findFirst({
      where: { 
        fileName: `community-development-${projectId}`,
        userId,
        type: 'OTHER'
      },
    });

    if (!community) {
      throw new Error('Community development plan not found');
    }

    return {
      ...community,
      fileUrl: JSON.parse(community.fileUrl as string),
    };
  }
}