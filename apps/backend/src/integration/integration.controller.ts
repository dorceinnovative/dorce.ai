import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common'
import { IntegrationService, AIAnalysisRequest, UserSyncRequest } from './integration.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api/integration')
@UseGuards(JwtAuthGuard)
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  /**
   * Get system health status
   */
  @Get('health')
  async getSystemHealth() {
    return this.integrationService.getSystemHealth()
  }

  /**
   * Process AI analysis
   */
  @Post('ai/analyze')
  async processAIAnalysis(@Body() request: AIAnalysisRequest, @Req() req: any) {
    // Add user ID from authenticated request
    const enhancedRequest = {
      ...request,
      userId: req.user.id
    }
    
    return {
      success: true,
      data: await this.integrationService.processAIAnalysis(enhancedRequest),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Sync user data across services
   */
  @Post('user/sync')
  async syncUserData(@Body() request: UserSyncRequest, @Req() req: any) {
    // Ensure user can only sync their own data
    if (request.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new Error('Unauthorized: You can only sync your own data')
    }
    
    return {
      success: true,
      data: await this.integrationService.syncUserData(request),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Get user data with caching
   */
  @Get('user/data')
  async getUserData(@Req() req: any) {
    return {
      success: true,
      data: await this.integrationService.getUserData(req.user.id),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Generate secure tokens
   */
  @Post('tokens/generate')
  async generateSecureTokens(@Req() req: any) {
    return {
      success: true,
      data: await this.integrationService.generateSecureTokens(req.user.id),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Send real-time notification
   */
  @Post('notifications/send')
  async sendNotification(@Body() notification: {
    type: string
    title: string
    message: string
    data?: any
  }, @Req() req: any) {
    await this.integrationService.sendRealTimeNotification(req.user.id, notification)
    
    return {
      success: true,
      message: 'Notification sent successfully',
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Search user data
   */
  @Get('search/users')
  async searchUserData(@Req() req: any, @Query('query') query: string, @Query('filters') filters?: string) {
    const searchParams = {
      query: query || '',
      filters: filters ? JSON.parse(filters) : {},
      userId: req.user.role === 'ADMIN' ? undefined : req.user.id
    }
    
    return {
      success: true,
      data: await this.integrationService.searchUserData(searchParams),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Get dashboard analytics
   */
  @Get('dashboard/analytics')
  async getDashboardAnalytics(@Req() req: any) {
    return {
      success: true,
      data: await this.integrationService.getDashboardAnalytics(req.user.id),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Business insights AI analysis
   */
  @Post('ai/business-insights')
  async getBusinessInsights(@Body() businessData: any, @Req() req: any) {
    const request: AIAnalysisRequest = {
      type: 'business',
      data: businessData,
      userId: req.user.id
    }
    
    return {
      success: true,
      data: await this.integrationService.processAIAnalysis(request),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Financial analysis AI
   */
  @Post('ai/financial-analysis')
  async getFinancialAnalysis(@Body() financialData: any, @Req() req: any) {
    const request: AIAnalysisRequest = {
      type: 'financial',
      data: financialData,
      userId: req.user.id
    }
    
    return {
      success: true,
      data: await this.integrationService.processAIAnalysis(request),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Market research AI
   */
  @Post('ai/market-research')
  async getMarketResearch(@Body() marketData: any, @Req() req: any) {
    const request: AIAnalysisRequest = {
      type: 'market',
      data: marketData,
      userId: req.user.id
    }
    
    return {
      success: true,
      data: await this.integrationService.processAIAnalysis(request),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Marketing content AI
   */
  @Post('ai/marketing-content')
  async generateMarketingContent(@Body() productData: any, @Req() req: any) {
    const request: AIAnalysisRequest = {
      type: 'marketing',
      data: productData,
      userId: req.user.id
    }
    
    return {
      success: true,
      data: await this.integrationService.processAIAnalysis(request),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Customer support AI
   */
  @Post('ai/support')
  async generateSupportResponse(@Body() supportData: { query: string; context?: any }, @Req() req: any) {
    const request: AIAnalysisRequest = {
      type: 'support',
      data: supportData,
      userId: req.user.id
    }
    
    return {
      success: true,
      data: await this.integrationService.processAIAnalysis(request),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Code assistance AI
   */
  @Post('ai/code-assistance')
  async generateCodeAssistance(@Body() codeContext: any, @Req() req: any) {
    const request: AIAnalysisRequest = {
      type: 'code',
      data: codeContext,
      userId: req.user.id
    }
    
    return {
      success: true,
      data: await this.integrationService.processAIAnalysis(request),
      timestamp: new Date().toISOString()
    }
  }
}