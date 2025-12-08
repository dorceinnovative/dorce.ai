import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { DICService, DICRequest, DICResponse, DICAgent, DICContext } from './dic.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('api/dic')
@UseGuards(JwtAuthGuard)
export class DICController {
  constructor(private readonly dicService: DICService) {}

  @Get('agents')
  async getActiveAgents(@CurrentUser() user: User): Promise<DICAgent[]> {
    return this.dicService.getActiveAgents();
  }

  @Get('agents/:agentId')
  async getAgent(
    @Param('agentId') agentId: string,
    @CurrentUser() user: User,
  ): Promise<DICAgent> {
    const agent = this.dicService.getAgentById(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    return agent;
  }

  @Post('agents/:agentId/toggle')
  async toggleAgent(
    @Param('agentId') agentId: string,
    @Body('isActive') isActive: boolean,
    @CurrentUser() user: User,
  ): Promise<DICAgent> {
    // Only admin can toggle agents
    if (user.role !== 'ADMIN') {
      throw new Error('Insufficient permissions to toggle agents');
    }
    return this.dicService.toggleAgent(agentId, isActive);
  }

  @Post('process')
  async processRequest(
    @Body() request: Omit<DICRequest, 'id' | 'context'> & { appId: string; query: string; type?: string },
    @CurrentUser() user: User,
  ): Promise<DICResponse> {
    const context: DICContext = {
      userId: user.id,
      appId: request.appId,
      sessionId: `session-${user.id}-${Date.now()}`,
      userData: {
        id: user.id,
        email: user.email,
        roles: [user.role],
        isVerified: user.emailVerified,
      },
      appData: { appId: request.appId },
      systemState: {}, // This would be populated with actual system state
    };

    const dicRequest: Omit<DICRequest, 'id'> = {
      agentId: request.agentId || this.getRecommendedAgent(request.appId),
      context,
      query: request.query,
      type: (request.type as any) || 'query',
      priority: 'medium',
      metadata: request.metadata,
    };

    return this.dicService.processRequest(dicRequest);
  }

  @Get('recommendations')
  async getAgentRecommendations(
    @Query('appId') appId: string,
    @CurrentUser() user: User,
  ): Promise<DICAgent[]> {
    const context: DICContext = {
      userId: user.id,
      appId,
      sessionId: `session-${user.id}-${Date.now()}`,
      userData: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      appData: { appId },
      systemState: {},
    };

    return this.dicService.getAgentRecommendations(context);
  }

  @Get('insights')
  async getSystemInsights(@CurrentUser() user: User) {
    return this.dicService.getSystemInsights();
  }

  private getRecommendedAgent(appId: string): string {
    const agentMap = {
      'dorce-marketplace': 'marketplace-agent',
      'dorce-wallet': 'finance-agent',
      'dorce-crypto': 'crypto-agent',
      'dorce-tax': 'tax-agent',
      'dorce-education': 'education-agent',
      'dorce-farms': 'farming-agent',
      'dorce-community': 'support-agent',
      'dorce-business': 'operations-agent',
    };

    return agentMap[appId] || 'support-agent';
  }
}