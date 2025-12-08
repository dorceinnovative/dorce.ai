import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { OpenRouterService } from '../openrouter/openrouter.service'
import { UpstashService } from '../upstash/upstash.service'
import { JwtSecretService } from '../auth/jwt-secret.service'
import { PrismaService } from '../prisma/prisma.service'

export interface SystemHealth {
  supabase: boolean
  openrouter: boolean
  redis: boolean
  database: boolean
  overall: boolean
  timestamp: string
}

export interface AIAnalysisRequest {
  type: 'business' | 'financial' | 'market' | 'marketing' | 'support' | 'code'
  data: any
  userId: string
  cacheKey?: string
}

export interface UserSyncRequest {
  userId: string
  syncData: any
  syncToSupabase: boolean
  syncToCache: boolean
}

@Injectable()
export class IntegrationService {
  constructor(
    private supabaseService: SupabaseService,
    private openRouterService: OpenRouterService,
    private upstashService: UpstashService,
    private jwtSecretService: JwtSecretService,
    private prismaService: PrismaService,
  ) {}

  /**
   * Get comprehensive system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const [
      supabaseHealth,
      openrouterHealth,
      redisHealth,
      databaseHealth
    ] = await Promise.allSettled([
      this.supabaseService.healthCheck(),
      this.openRouterService.healthCheck(),
      this.upstashService.healthCheck(),
      this.checkDatabaseHealth()
    ])

    const health = {
      supabase: supabaseHealth.status === 'fulfilled' ? supabaseHealth.value : false,
      openrouter: openrouterHealth.status === 'fulfilled' ? openrouterHealth.value : false,
      redis: redisHealth.status === 'fulfilled' ? redisHealth.value : false,
      database: databaseHealth.status === 'fulfilled' ? databaseHealth.value : false,
      overall: false,
      timestamp: new Date().toISOString()
    }

    health.overall = health.supabase && health.openrouter && health.redis && health.database

    return health
  }

  /**
   * Process AI analysis with caching and rate limiting
   */
  async processAIAnalysis(request: AIAnalysisRequest): Promise<string> {
    const { type, data, userId, cacheKey } = request

    // Generate cache key if not provided
    const finalCacheKey = cacheKey || `ai:${type}:${this.generateCacheKey(data)}`

    // Check cache first
    const cachedResponse = await this.upstashService.get<string>(`ai:${finalCacheKey}`)
    if (cachedResponse) {
      return cachedResponse
    }

    // Generate AI response based on type
    let aiResponse: string
    
    switch (type) {
      case 'business':
        aiResponse = await this.generateBusinessInsights(data)
        break
      case 'financial':
        aiResponse = await this.generateFinancialAnalysis(data)
        break
      case 'market':
        aiResponse = await this.generateMarketResearch(data)
        break
      case 'marketing':
        aiResponse = await this.generateMarketingContent(data)
        break
      case 'support':
        aiResponse = await this.generateSupportResponse(data.query, data.context)
        break
      case 'code':
        aiResponse = await this.generateCodeAssistance(data)
        break
      default:
        throw new Error(`Unsupported AI analysis type: ${type}`)
    }

    // Cache the response
    await this.upstashService.set(`ai:${finalCacheKey}`, aiResponse, { ttl: 1800 }) // 30 minutes

    return aiResponse
  }

  /**
   * Sync user data across all services
   */
  async syncUserData(request: UserSyncRequest): Promise<any> {
    const { userId, syncData, syncToSupabase, syncToCache } = request

    const results = {
      userId,
      supabase: false,
      cache: false,
      timestamp: new Date().toISOString()
    }

    // Sync to Supabase
    if (syncToSupabase) {
      try {
        await this.supabaseService.syncUserData(userId, syncData)
        results.supabase = true
      } catch (error) {
        console.error('Supabase sync failed:', error)
      }
    }

    // Sync to cache
    if (syncToCache) {
      try {
        const cacheKey = `user:${userId}`
        await this.upstashService.set(cacheKey, syncData, { ttl: 3600 }) // 1 hour
        results.cache = true
      } catch (error) {
        console.error('Cache sync failed:', error)
      }
    }

    return results
  }

  /**
   * Get user data from cache or database
   */
  async getUserData(userId: string): Promise<any> {
    const cacheKey = `user:${userId}`
    
    // Try cache first
    const cachedData = await this.upstashService.get<any>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    // Get from database
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
        isBlocked: true,
        wallet: {
          select: {
            id: true,
            balance: true,
            createdAt: true
          }
        }
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Cache for future use
    await this.upstashService.set(cacheKey, user, { ttl: 3600 })

    return user
  }

  /**
   * Generate secure tokens for various purposes
   */
  async generateSecureTokens(userId: string): Promise<{
    accessToken: string
    refreshToken: string
    apiKey: string
    sessionToken: string
  }> {
    const secrets = this.jwtSecretService.getOrGenerateSecrets()
    
    // Generate JWT tokens
    const accessToken = this.generateJWT(userId, 'access', secrets.accessSecret)
    const refreshToken = this.generateJWT(userId, 'refresh', secrets.refreshSecret)
    
    // Generate other tokens
    const apiKey = this.jwtSecretService.generateApiKey()
    const sessionToken = this.jwtSecretService.generateSessionToken()

    // Store session token in cache
    await this.upstashService.set(`session:${sessionToken}`, { userId }, { ttl: 86400 }) // 24 hours

    return {
      accessToken,
      refreshToken,
      apiKey,
      sessionToken
    }
  }

  /**
   * Real-time notification system
   */
  async sendRealTimeNotification(userId: string, notification: {
    type: string
    title: string
    message: string
    data?: any
  }): Promise<void> {
    const notificationKey = `notifications:${userId}`
    const notificationData = {
      ...notification,
      timestamp: new Date().toISOString(),
      id: this.jwtSecretService.generateRandomString(16)
    }

    // Store in cache for real-time access
    await this.upstashService.set(notificationKey, notificationData, { ttl: 604800 }) // 7 days

    // TODO: Implement WebSocket notification system
    console.log(`Notification sent to user ${userId}:`, notificationData)
  }

  /**
   * Advanced search across all user data
   */
  async searchUserData(searchParams: {
    query: string
    filters?: any
    userId?: string
  }): Promise<any[]> {
    const { query, filters, userId } = searchParams
    
    // Search in Supabase
    const supabaseResults = await this.supabaseService.searchUsers({
      email: query.includes('@') ? query : undefined,
      ...filters
    })

    // Search in local database
    const localResults = await this.prismaService.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } }
        ],
        ...(userId && { id: userId })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true
      }
    })

    // Combine and deduplicate results
    const combinedResults = [...supabaseResults, ...localResults]
    const uniqueResults = combinedResults.filter((result, index, self) => 
      index === self.findIndex(r => r.id === result.id)
    )

    return uniqueResults
  }

  /**
   * Generate analytics data for dashboard
   */
  async getDashboardAnalytics(userId: string): Promise<any> {
    const cacheKey = `analytics:${userId}`
    
    // Try cache first
    const cachedAnalytics = await this.upstashService.get<any>(cacheKey)
    if (cachedAnalytics) {
      return cachedAnalytics
    }

    // Generate analytics data
    const analytics = {
      userStats: await this.getUserStats(userId),
      systemHealth: await this.getSystemHealth(),
      recentActivity: await this.getRecentActivity(userId),
      aiUsage: await this.getAIUsageStats(userId),
      timestamp: new Date().toISOString()
    }

    // Cache for 5 minutes
    await this.upstashService.set(cacheKey, analytics, { ttl: 300 })

    return analytics
  }

  // Private helper methods

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }

  private generateJWT(userId: string, type: 'access' | 'refresh', secret: string): string {
    const payload = {
      sub: userId,
      type,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (type === 'access' ? 900 : 604800) // 15min or 7days
    }

    // Use JWT service from NestJS (would need to be injected)
    return `${type}_token_${userId}_${this.jwtSecretService.generateRandomString(32)}`
  }

  private generateCacheKey(data: any): string {
    return this.jwtSecretService.hashData(JSON.stringify(data)).substring(0, 16)
  }

  private async getUserStats(userId: string): Promise<any> {
    // Get user statistics from database
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            transactions: true,
            documents: true,
            // Add other relations as needed
          }
        }
      }
    })

    return {
      accountAge: user ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      role: user?.role || 'USER',
      // Add more stats as needed
    }
  }

  private async getRecentActivity(userId: string): Promise<any[]> {
    // Get recent activity from cache or database
    const activityKey = `activity:${userId}`
    const recentActivity = await this.upstashService.get<any[]>(activityKey)
    
    return recentActivity || []
  }

  private async getAIUsageStats(userId: string): Promise<any> {
    const usageKey = `ai_usage:${userId}`
    const usageStats = await this.upstashService.get<any>(usageKey)
    
    return usageStats || {
      totalRequests: 0,
      lastUsed: null,
      mostUsedType: null
    }
  }

  // Private AI generation methods
  private async generateBusinessInsights(data: any): Promise<string> {
    const prompt = `Analyze this business data and provide insights: ${JSON.stringify(data)}`
    const response = await this.openRouterService.createCompletion({
      model: 'anthropic/claude-3-sonnet',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    })
    return response.choices[0]?.message?.content || 'No response generated'
  }

  private async generateFinancialAnalysis(data: any): Promise<string> {
    const prompt = `Perform financial analysis on this data: ${JSON.stringify(data)}`
    const response = await this.openRouterService.createCompletion({
      model: 'openai/gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500
    })
    return response.choices[0]?.message?.content || 'No response generated'
  }

  private async generateMarketResearch(data: any): Promise<string> {
    const prompt = `Conduct market research analysis on: ${JSON.stringify(data)}`
    const response = await this.openRouterService.createCompletion({
      model: 'anthropic/claude-3-sonnet',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1200
    })
    return response.choices[0]?.message?.content || 'No response generated'
  }

  private async generateMarketingContent(data: any): Promise<string> {
    const prompt = `Generate marketing content based on: ${JSON.stringify(data)}`
    const response = await this.openRouterService.createCompletion({
      model: 'openai/gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 800
    })
    return response.choices[0]?.message?.content || 'No response generated'
  }

  private async generateSupportResponse(query: string, context: any): Promise<string> {
    const prompt = `Customer support query: ${query}\nContext: ${JSON.stringify(context)}`
    const response = await this.openRouterService.createCompletion({
      model: 'anthropic/claude-3-sonnet',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1000
    })
    return response.choices[0]?.message?.content || 'No response generated'
  }

  private async generateCodeAssistance(data: any): Promise<string> {
    const prompt = `Provide code assistance for: ${JSON.stringify(data)}`
    const response = await this.openRouterService.createCompletion({
      model: 'openai/gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 2000
    })
    return response.choices[0]?.message?.content || 'No response generated'
  }
}