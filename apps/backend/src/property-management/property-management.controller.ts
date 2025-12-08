import { Controller, Get, Post, Put, Delete, Body, Param, Req } from '@nestjs/common';
import { PropertyManagementService } from './property-management.service';
import { PropertyTenantService } from './property-tenant.service';
import { PropertyLeaseService } from './property-lease.service';
import { PropertyMaintenanceService } from './property-maintenance.service';
import { PropertyAnalyticsService } from './property-analytics.service';
import { PropertyFinancialService } from './property-financial.service';

@Controller('property-management')
export class PropertyManagementController {
  constructor(
    private readonly propertyService: PropertyManagementService,
    private readonly tenantService: PropertyTenantService,
    private readonly leaseService: PropertyLeaseService,
    private readonly maintenanceService: PropertyMaintenanceService,
    private readonly analyticsService: PropertyAnalyticsService,
    private readonly financialService: PropertyFinancialService,
  ) {}

  @Post('properties')
  async createProperty(@Body() propertyData: any, @Req() req: any) {
    return this.propertyService.createProperty({ ...propertyData, userId: req.user.id });
  }

  @Get('properties')
  async getProperties(@Req() req: any) {
    return this.propertyService.getUserProperties(req.user.id);
  }

  @Get('properties/:id')
  async getProperty(@Param('id') id: string, @Req() req: any) {
    return this.propertyService.getProperty(id, req.user.id);
  }

  @Put('properties/:id')
  async updateProperty(@Param('id') id: string, @Body() propertyData: any, @Req() req: any) {
    return this.propertyService.updateProperty(id, { ...propertyData, userId: req.user.id });
  }

  @Post('tenants')
  async createTenant(@Body() tenantData: any, @Req() req: any) {
    return this.tenantService.createTenant({ ...tenantData, userId: req.user.id });
  }

  @Get('tenants')
  async getTenants(@Req() req: any) {
    return this.tenantService.getUserTenants(req.user.id);
  }

  @Get('tenants/:id')
  async getTenant(@Param('id') id: string, @Req() req: any) {
    return this.tenantService.getTenant(id, req.user.id);
  }

  @Post('leases')
  async createLease(@Body() leaseData: any, @Req() req: any) {
    return this.leaseService.createLease({ ...leaseData, userId: req.user.id });
  }

  @Get('leases')
  async getLeases(@Req() req: any) {
    return this.leaseService.getUserLeases(req.user.id);
  }

  @Get('leases/:id')
  async getLease(@Param('id') id: string, @Req() req: any) {
    return this.leaseService.getLease(id, req.user.id);
  }

  @Post('maintenance/requests')
  async createMaintenanceRequest(@Body() requestData: any, @Req() req: any) {
    return this.maintenanceService.createMaintenanceRequest({ ...requestData, userId: req.user.id });
  }

  @Get('maintenance/requests')
  async getMaintenanceRequests(@Req() req: any) {
    return this.maintenanceService.getMaintenanceRequests(req.user.id);
  }

  @Get('analytics/dashboard')
  async getAnalyticsDashboard(@Req() req: any) {
    return this.analyticsService.getDashboard(req.user.id);
  }

  @Get('analytics/properties/:id')
  async getPropertyAnalytics(@Param('id') id: string, @Req() req: any) {
    return this.analyticsService.getPropertyPerformance(req.user.id, id);
  }

  @Get('financial/overview')
  async getFinancialOverview(@Req() req: any) {
    return this.financialService.getFinancialOverview(req.user.id);
  }

  @Get('financial/reports')
  async getFinancialReports(@Req() req: any) {
    return this.financialService.getFinancialReports(req.user.id);
  }

  @Post('financial/reports/generate')
  async generateFinancialReport(@Body() reportData: any, @Req() req: any) {
    return this.financialService.generateReport(req.user.id, reportData);
  }

  @Get('rentals/vacancies')
  async getVacancies(@Req() req: any) {
    return this.propertyService.getVacancies(req.user.id);
  }

  @Get('rentals/expiring')
  async getExpiringLeases(@Req() req: any) {
    return this.leaseService.getExpiringLeases(req.user.id);
  }

  @Get('insights')
  async getInsights(@Req() req: any) {
    return this.analyticsService.getInsights(req.user.id);
  }
}