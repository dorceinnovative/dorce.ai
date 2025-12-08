import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EnvironmentalAssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  async conductEnvironmentalAssessment(projectId: string, assessmentData: any, userId: string) {
    const { assessmentType, environmentalImpact, mitigationMeasures, complianceStatus } = assessmentData;

    const assessment = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `environmental-assessment-${projectId}`,
        fileUrl: JSON.stringify({
          projectId,
          userId,
          type: 'ENVIRONMENTAL_ASSESSMENT',
          assessmentType,
          environmentalImpact,
          mitigationMeasures,
          complianceStatus,
          status: 'CONDUCTED',
          assessmentDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }),
        userId,
        fileSize: 0,
        mimeType: 'application/json',
      },
    });

    return assessment;
  }

  async getEnvironmentalAssessment(projectId: string, userId: string) {
    const assessment = await this.prisma.document.findFirst({
      where: { 
        fileName: `environmental-assessment-${projectId}`,
        userId,
        type: 'OTHER'
      },
    });

    if (!assessment) {
      throw new Error('Environmental assessment not found');
    }

    return {
      ...assessment,
      fileUrl: JSON.parse(assessment.fileUrl as string),
    };
  }
}