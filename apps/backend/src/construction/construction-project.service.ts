import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallets/wallet.service';
import { LedgerService } from '../ledger/ledger.service';
import { SecurityService } from '../security/security.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ConstructionProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly ledgerService: LedgerService,
    private readonly securityService: SecurityService,
    private readonly auditService: AuditService,
  ) {}

  async createProject(projectData: any, userId: string) {
    const project = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `construction-project-${Date.now()}`,
        fileUrl: JSON.stringify({
          ...projectData,
          userId,
          type: 'CONSTRUCTION_PROJECT',
          status: 'PLANNING',
          progress: 0,
          budgetUsed: 0,
          totalSpent: 0,
          createdAt: new Date().toISOString(),
        }),
        fileSize: 1024,
        mimeType: 'application/json',
        userId,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CONSTRUCTION_PROJECT_CREATED',
      resourceType: 'CONSTRUCTION',
      actionDetails: {
        projectId: project.id,
        projectData,
      }
    });

    return project;
  }

  async getProjects(userId: string) {
    return this.prisma.document.findMany({
      where: {
        userId,
        fileUrl: {
          contains: '"type":"CONSTRUCTION_PROJECT"',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getProject(id: string, userId: string) {
    return this.prisma.document.findFirst({
      where: {
        id,
        userId,
        fileUrl: {
          contains: '"type":"CONSTRUCTION_PROJECT"',
        },
      },
    });
  }

  async updateProject(id: string, projectData: any, userId: string) {
    const project = await this.getProject(id, userId);
    if (!project) {
      throw new Error('Project not found');
    }

    const existingData = JSON.parse(project.fileUrl);
    const updatedProject = await this.prisma.document.update({
      where: { id },
      data: {
        fileUrl: JSON.stringify({
          ...existingData,
          ...projectData,
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    await this.auditService.log({
      userId,
      action: 'CONSTRUCTION_PROJECT_UPDATED',
      resourceType: 'CONSTRUCTION',
      actionDetails: {
        projectId: id,
        projectData,
      }
    });

    return updatedProject;
  }

  async startProject(id: string, userId: string) {
    const project = await this.getProject(id, userId);
    if (!project) {
      throw new Error('Project not found');
    }

    const projectData = JSON.parse(project.fileUrl);
    
    if (projectData.status !== 'PLANNING') {
      throw new Error('Project cannot be started from current status');
    }

    const updatedProject = await this.prisma.document.update({
      where: { id },
      data: {
        fileUrl: JSON.stringify({
          ...projectData,
          status: 'IN_PROGRESS',
          startDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    await this.auditService.log({
      userId,
      action: 'CONSTRUCTION_PROJECT_STARTED',
      resourceType: 'CONSTRUCTION',
      actionDetails: {
        projectId: id,
        startDate: new Date().toISOString(),
      }
    });

    await this.auditService.log({
      userId,
      action: 'PROJECT_STARTED',
      resourceType: 'CONSTRUCTION_PROJECT',
      resourceId: project.id,
      actionDetails: {
        projectName: projectData.name,
        description: `Construction project started: ${projectData.name}`,
      }
    });

    return updatedProject;
  }

  async completeProject(id: string, userId: string) {
    const project = await this.getProject(id, userId);
    if (!project) {
      throw new Error('Project not found');
    }

    const projectData = JSON.parse(project.fileUrl);
    
    if (projectData.status !== 'IN_PROGRESS') {
      throw new Error('Project must be in progress to complete');
    }

    const updatedProject = await this.prisma.document.update({
      where: { id },
      data: {
        fileUrl: JSON.stringify({
          ...projectData,
          status: 'COMPLETED',
          progress: 100,
          endDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    await this.auditService.log({
      userId,
      action: 'CONSTRUCTION_PROJECT_COMPLETED',
      resourceType: 'CONSTRUCTION',
      actionDetails: {
        projectId: id,
        endDate: new Date().toISOString(),
      }
    });

    await this.auditService.log({
      userId,
      action: 'PROJECT_COMPLETED',
      resourceType: 'CONSTRUCTION_PROJECT',
      resourceId: id,
      actionDetails: {
        projectName: projectData.name,
        description: `Construction project completed: ${projectData.name}`,
      }
    });

    return updatedProject;
  }

  async updateProjectProgress(id: string, progress: number, userId: string) {
    const project = await this.getProject(id, userId);
    if (!project) {
      throw new Error('Project not found');
    }

    const projectData = JSON.parse(project.fileUrl);
    const updatedProgress = Math.min(100, Math.max(0, progress));

    const updatedProject = await this.prisma.document.update({
      where: { id },
      data: {
        fileUrl: JSON.stringify({
          ...projectData,
          progress: updatedProgress,
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    await this.auditService.log({
      userId,
      action: 'CONSTRUCTION_PROJECT_PROGRESS_UPDATED',
      resourceType: 'CONSTRUCTION',
      actionDetails: {
        projectId: id,
        progress: updatedProgress,
      }
    });

    if (updatedProgress === 100) {
      await this.completeProject(id, userId);
    }

    return updatedProject;
  }

  async getProjectMilestones(projectId: string, userId: string) {
    return this.prisma.document.findMany({
      where: {
        userId,
        AND: [
          {
            fileUrl: {
              contains: `"projectId":"${projectId}"`,
            },
          },
          {
            fileUrl: {
              contains: '"type":"PROJECT_MILESTONE"',
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async createProjectMilestone(projectId: string, milestoneData: any, userId: string) {
    const project = await this.getProject(projectId, userId);
    if (!project) {
      throw new Error('Project not found');
    }

    const milestone = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `project-milestone-${Date.now()}`,
        fileUrl: JSON.stringify({
          ...milestoneData,
          projectId,
          userId,
          type: 'PROJECT_MILESTONE',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        }),
        fileSize: 512,
        mimeType: 'application/json',
        userId,
      },
    });

    await this.auditService.log({
      userId,
      action: 'PROJECT_MILESTONE_CREATED',
      resourceType: 'CONSTRUCTION_PROJECT',
      resourceId: milestone.id,
      actionDetails: {
        projectId,
        milestoneId: milestone.id,
        milestoneData,
      }
    });

    return milestone;
  }

  async completeProjectMilestone(milestoneId: string, userId: string) {
    const milestone = await this.prisma.document.findFirst({
      where: {
        id: milestoneId,
        userId,
        fileUrl: {
          contains: '"type":"PROJECT_MILESTONE"',
        },
      },
    });

    if (!milestone) {
      throw new Error('Milestone not found');
    }

    const milestoneData = JSON.parse(milestone.fileUrl);
    
    const updatedMilestone = await this.prisma.document.update({
      where: { id: milestoneId },
      data: {
        fileUrl: JSON.stringify({
          ...milestoneData,
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    await this.auditService.log({
      userId,
      action: 'PROJECT_MILESTONE_COMPLETED',
      resourceType: 'CONSTRUCTION_PROJECT',
      resourceId: milestoneId,
      actionDetails: {
        milestoneId,
        projectId: milestoneData.projectId,
      }
    });

    return updatedMilestone;
  }

  async getProjectTasks(projectId: string, userId: string) {
    return this.prisma.document.findMany({
      where: {
        userId,
        AND: [
          {
            fileUrl: {
              contains: `"projectId":"${projectId}"`,
            },
          },
          {
            fileUrl: {
              contains: '"type":"PROJECT_TASK"',
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async createProjectTask(projectId: string, taskData: any, userId: string) {
    const project = await this.getProject(projectId, userId);
    if (!project) {
      throw new Error('Project not found');
    }

    const task = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `project-task-${Date.now()}`,
        fileUrl: JSON.stringify({
          ...taskData,
          projectId,
          userId,
          type: 'PROJECT_TASK',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        }),
        fileSize: 0,
        mimeType: 'application/json',
        userId,
      },
    });

    await this.auditService.log({
      userId,
      action: 'PROJECT_TASK_CREATED',
      resourceType: 'CONSTRUCTION_PROJECT',
      resourceId: task.id,
      actionDetails: {
        projectId,
        taskId: task.id,
        taskData,
      }
    });

    return task;
  }

  async updateProjectTask(taskId: string, taskData: any, userId: string) {
    const task = await this.prisma.document.findFirst({
      where: {
        id: taskId,
        userId,
        fileUrl: {
          contains: '"type":"PROJECT_TASK"',
        },
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    const existingData = JSON.parse(task.fileUrl);
    const updatedTask = await this.prisma.document.update({
      where: { id: taskId },
      data: {
        fileUrl: JSON.stringify({
          ...existingData,
          ...taskData,
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    await this.auditService.log({
      userId,
      action: 'PROJECT_TASK_UPDATED',
      resourceType: 'CONSTRUCTION_PROJECT',
      resourceId: taskId,
      actionDetails: {
        taskId,
        taskData,
      }
    });

    return updatedTask;
  }

  async getProjectAnalytics(projectId: string, userId: string) {
    const project = await this.getProject(projectId, userId);
    if (!project) {
      throw new Error('Project not found');
    }

    const milestones = await this.getProjectMilestones(projectId, userId);
    const tasks = await this.getProjectTasks(projectId, userId);
    
    const completedMilestones = milestones.filter(m => {
      const data = JSON.parse(m.fileUrl);
      return data.status === 'COMPLETED';
    }).length;

    const completedTasks = tasks.filter(t => {
      const data = JSON.parse(t.fileUrl);
      return data.status === 'COMPLETED';
    }).length;

    const projectData = JSON.parse(project.fileUrl);

    return {
      projectId,
      name: projectData.name,
      status: projectData.status,
      progress: projectData.progress,
      milestones: {
        total: milestones.length,
        completed: completedMilestones,
        completionRate: milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0,
      },
      tasks: {
        total: tasks.length,
        completed: completedTasks,
        completionRate: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0,
      },
      timeline: this.calculateTimelineMetrics(projectData, milestones),
      budget: {
        allocated: projectData.budget || 0,
        used: projectData.totalSpent || 0,
        remaining: (projectData.budget || 0) - (projectData.totalSpent || 0),
        utilizationRate: (projectData.budget || 0) > 0 ? ((projectData.totalSpent || 0) / (projectData.budget || 0)) * 100 : 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  private calculateTimelineMetrics(projectData: any, milestones: any[]) {
    const startDate = projectData.startDate ? new Date(projectData.startDate) : null;
    const endDate = projectData.endDate ? new Date(projectData.endDate) : null;
    const now = new Date();

    let daysElapsed = 0;
    let totalDuration = 0;
    let isOnSchedule = true;

    if (startDate) {
      daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (startDate && endDate) {
      totalDuration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const overdueMilestones = milestones.filter(milestone => {
      const data = JSON.parse(milestone.fileUrl);
      const dueDate = data.dueDate ? new Date(data.dueDate) : null;
      return dueDate && dueDate < now && data.status !== 'COMPLETED';
    }).length;

    if (overdueMilestones > 0) {
      isOnSchedule = false;
    }

    return {
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      daysElapsed: Math.max(0, daysElapsed),
      totalDuration: totalDuration,
      progressRate: totalDuration > 0 ? (daysElapsed / totalDuration) * 100 : 0,
      overdueMilestones,
      isOnSchedule,
    };
  }
}