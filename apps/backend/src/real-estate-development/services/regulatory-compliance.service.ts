import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RegulatoryComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async submitRegulatoryApproval(projectId: string, approvalData: any, userId: string) {
    const { approvalType, documents, regulatoryBody, submissionDate } = approvalData;

    const approval = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `regulatory-approval-${projectId}`,
        fileUrl: JSON.stringify({
          projectId,
          userId,
          type: 'REGULATORY_APPROVAL',
          approvalType,
          documents,
          regulatoryBody,
          submissionDate,
          status: 'SUBMITTED',
          createdAt: new Date().toISOString(),
        }),
        userId,
        fileSize: 0,
        mimeType: 'application/json',
      },
    });

    return approval;
  }

  async getRegulatoryStatus(projectId: string, userId: string) {
    const approvals = await this.prisma.document.findMany({
      where: { 
        fileName: { startsWith: `regulatory-approval-${projectId}` },
        userId,
        type: 'OTHER'
      },
    });

    const statusSummary = {
      totalApprovals: approvals.length,
      approved: approvals.filter(a => JSON.parse(a.fileUrl as string).status === 'APPROVED').length,
      pending: approvals.filter(a => JSON.parse(a.fileUrl as string).status === 'SUBMITTED').length,
      rejected: approvals.filter(a => JSON.parse(a.fileUrl as string).status === 'REJECTED').length,
      approvals: approvals.map(approval => ({
        ...approval,
        fileUrl: JSON.parse(approval.fileUrl as string),
      })),
    };

    return statusSummary;
  }
}