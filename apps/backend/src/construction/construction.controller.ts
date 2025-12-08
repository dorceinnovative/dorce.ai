import { Controller, Get, Post, Put, Delete, Body, Param, Req } from '@nestjs/common';
import { ConstructionProjectService } from './construction-project.service';
import { ConstructionResourceService } from './construction-resource.service';

@Controller('construction')
export class ConstructionController {
  constructor(
    private readonly projectService: ConstructionProjectService,
    private readonly resourceService: ConstructionResourceService,
  ) {}

  @Post('projects')
  async createProject(@Body() projectData: any, @Req() req: any) {
    return this.projectService.createProject(projectData, req.user.id);
  }

  @Get('projects')
  async getProjects(@Req() req: any) {
    return this.projectService.getProjects(req.user.id);
  }

  @Get('projects/:id')
  async getProject(@Param('id') id: string, @Req() req: any) {
    return this.projectService.getProject(id, req.user.id);
  }

  @Put('projects/:id')
  async updateProject(@Param('id') id: string, @Body() projectData: any, @Req() req: any) {
    return this.projectService.updateProject(id, projectData, req.user.id);
  }

  @Post('projects/:id/start')
  async startProject(@Param('id') id: string, @Req() req: any) {
    return this.projectService.startProject(id, req.user.id);
  }

  @Post('projects/:id/complete')
  async completeProject(@Param('id') id: string, @Req() req: any) {
    return this.projectService.completeProject(id, req.user.id);
  }

  @Post('resources')
  async createResource(@Body() resourceData: any, @Req() req: any) {
    return this.resourceService.createResource(resourceData, req.user.id);
  }

  @Get('resources')
  async getResources(@Req() req: any) {
    return this.resourceService.getResources(req.user.id);
  }

  @Get('resources/:id')
  async getResource(@Param('id') id: string, @Req() req: any) {
    return this.resourceService.getResource(id, req.user.id);
  }
}