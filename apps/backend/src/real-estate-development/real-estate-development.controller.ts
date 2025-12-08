import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { RealEstateDevelopmentService } from './real-estate-development.service';

@Controller('real-estate-development')
export class RealEstateDevelopmentController {
  constructor(private readonly realEstateDevelopmentService: RealEstateDevelopmentService) {}

  @Post('projects')
  async createDevelopmentProject(@Body() projectData: any, @Req() req: any) {
    const userId = req.user?.id;
    return this.realEstateDevelopmentService.createDevelopmentProject(projectData, userId);
  }

  @Get('projects')
  async getDevelopmentProjects(@Req() req: any, @Query() query: any) {
    const userId = req.user?.id;
    return this.realEstateDevelopmentService.getDevelopmentProjects(userId, query);
  }

  @Get('projects/:id')
  async getDevelopmentProject(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.realEstateDevelopmentService.getDevelopmentProject(id, userId);
  }

  @Put('projects/:id')
  async updateDevelopmentProject(@Param('id') id: string, @Body() updateData: any, @Req() req: any) {
    const userId = req.user?.id;
    return this.realEstateDevelopmentService.updateDevelopmentProject(id, updateData, userId);
  }

  @Delete('projects/:id')
  async deleteDevelopmentProject(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.realEstateDevelopmentService.deleteDevelopmentProject(id, userId);
  }

  @Get('projects/:id/analytics')
  async getDevelopmentAnalytics(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.realEstateDevelopmentService.getDevelopmentAnalytics(id, userId);
  }

  @Get('projects/:id/roi-projection')
  async calculateROIProjection(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.realEstateDevelopmentService.calculateROIProjection(id, userId);
  }

  @Get('market-analysis')
  async getMarketAnalysis(@Query() query: any, @Req() req: any) {
    const userId = req.user?.id;
    return this.realEstateDevelopmentService.getMarketAnalysis(query, userId);
  }

  @Get('development-opportunities')
  async getDevelopmentOpportunities(@Query() query: any, @Req() req: any) {
    const userId = req.user?.id;
    return this.realEstateDevelopmentService.getDevelopmentOpportunities(query, userId);
  }
}