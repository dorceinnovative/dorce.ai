import { Injectable, BadRequestException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import * as crypto from "crypto"

export interface RateLimitConfig {
  windowMs: number
  maxAttempts: number
  blockDurationMs?: number
}

export interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  resetTime: Date
  blockedUntil?: Date
}

export interface RateLimitInfo {
  key: string
  attempts: number
  firstAttemptAt: Date
  lastAttemptAt: Date
  blockedUntil?: Date
  totalBlockedDuration: number
}

@Injectable()
export class RateLimitService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if action is rate limited
   */
  async checkRateLimit(
    identifier: string,
    action: string,
    config: RateLimitConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5,
      blockDurationMs: 30 * 60 * 1000 // 30 minutes block
    }
  ): Promise<RateLimitResult> {
    const key = this.generateRateLimitKey(identifier, action)
    const now = new Date()
    const windowStart = new Date(now.getTime() - config.windowMs)

    // Get existing rate limit record
    let rateLimit = await this.prisma.rateLimit.findUnique({
      where: { key }
    })

    // Check if currently blocked
    if (rateLimit?.blockedUntil && rateLimit.blockedUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: rateLimit.blockedUntil,
        blockedUntil: rateLimit.blockedUntil
      }
    }

    // Clean up old attempts outside the window
    if (rateLimit && rateLimit.firstAttemptAt < windowStart) {
      await this.prisma.rateLimit.update({
        where: { key },
        data: {
          attempts: 0,
          firstAttemptAt: now,
          lastAttemptAt: now,
          blockedUntil: null
        }
      })
      rateLimit = await this.prisma.rateLimit.findUnique({ where: { key } })
    }

    // Check if max attempts reached
    if (rateLimit && rateLimit.attempts >= config.maxAttempts) {
      const blockedUntil = new Date(now.getTime() + (config.blockDurationMs || 30 * 60 * 1000))
      
      // Block the identifier
      await this.prisma.rateLimit.update({
        where: { key },
        data: { 
          blockedUntil,
          totalBlockedDuration: rateLimit.totalBlockedDuration + (config.blockDurationMs || 30 * 60 * 1000)
        }
      })

      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: blockedUntil,
        blockedUntil
      }
    }

    // Calculate remaining attempts
    const remainingAttempts = config.maxAttempts - (rateLimit?.attempts || 0)
    const resetTime = rateLimit ? 
      new Date(rateLimit.firstAttemptAt.getTime() + config.windowMs) : 
      new Date(now.getTime() + config.windowMs)

    return {
      allowed: true,
      remainingAttempts,
      resetTime
    }
  }

  /**
   * Record a rate limit attempt
   */
  async recordAttempt(
    identifier: string,
    action: string,
    success: boolean = false
  ): Promise<void> {
    const key = this.generateRateLimitKey(identifier, action)
    const now = new Date()

    if (success) {
      // On success, reset attempts for this action
      await this.prisma.rateLimit.upsert({
        where: { key },
        update: {
          attempts: 0,
          firstAttemptAt: now,
          lastAttemptAt: now,
          blockedUntil: null,
          successfulAttempts: { increment: 1 }
        },
        create: {
          key,
          identifier,
          action,
          attempts: 0,
          firstAttemptAt: now,
          lastAttemptAt: now,
          successfulAttempts: 1,
          totalAttempts: 1
        }
      })
    } else {
      // On failure, increment attempts
      await this.prisma.rateLimit.upsert({
        where: { key },
        update: {
          attempts: { increment: 1 },
          lastAttemptAt: now,
          totalAttempts: { increment: 1 }
        },
        create: {
          key,
          identifier,
          action,
          attempts: 1,
          firstAttemptAt: now,
          lastAttemptAt: now,
          successfulAttempts: 0,
          totalAttempts: 1
        }
      })
    }
  }

  /**
   * Get rate limit information
   */
  async getRateLimitInfo(identifier: string, action: string): Promise<RateLimitInfo | null> {
    const key = this.generateRateLimitKey(identifier, action)
    
    const rateLimit = await this.prisma.rateLimit.findUnique({
      where: { key }
    })

    if (!rateLimit) {
      return null
    }

    return {
      key: rateLimit.key,
      attempts: rateLimit.attempts,
      firstAttemptAt: rateLimit.firstAttemptAt,
      lastAttemptAt: rateLimit.lastAttemptAt,
      blockedUntil: rateLimit.blockedUntil,
      totalBlockedDuration: rateLimit.totalBlockedDuration
    }
  }

  /**
   * Reset rate limit for an identifier and action
   */
  async resetRateLimit(identifier: string, action: string): Promise<boolean> {
    const key = this.generateRateLimitKey(identifier, action)
    
    const result = await this.prisma.rateLimit.update({
      where: { key },
      data: {
        attempts: 0,
        blockedUntil: null,
        firstAttemptAt: new Date(),
        lastAttemptAt: new Date()
      }
    })

    return !!result
  }

  /**
   * Reset all rate limits for an identifier
   */
  async resetAllRateLimits(identifier: string): Promise<number> {
    const result = await this.prisma.rateLimit.updateMany({
      where: { identifier },
      data: {
        attempts: 0,
        blockedUntil: null,
        firstAttemptAt: new Date(),
        lastAttemptAt: new Date()
      }
    })

    return result.count
  }

  /**
   * Get all rate limits for an identifier
   */
  async getRateLimitsByIdentifier(identifier: string): Promise<RateLimitInfo[]> {
    const rateLimits = await this.prisma.rateLimit.findMany({
      where: { identifier },
      orderBy: { lastAttemptAt: 'desc' }
    })

    return rateLimits.map(rateLimit => ({
      key: rateLimit.key,
      attempts: rateLimit.attempts,
      firstAttemptAt: rateLimit.firstAttemptAt,
      lastAttemptAt: rateLimit.lastAttemptAt,
      blockedUntil: rateLimit.blockedUntil,
      totalBlockedDuration: rateLimit.totalBlockedDuration
    }))
  }

  /**
   * Clean up old rate limit records
   */
  async cleanupOldRateLimits(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const result = await this.prisma.rateLimit.deleteMany({
      where: {
        lastAttemptAt: { lt: cutoffDate },
        attempts: 0,
        blockedUntil: null
      }
    })

    return result.count
  }

  /**
   * Check login rate limit (special handling for login attempts)
   */
  async checkLoginRateLimit(
    identifier: string, // email, phone, or IP address
    options: {
      byIP?: boolean
      byEmail?: boolean
      byPhone?: boolean
    } = {}
  ): Promise<{
    allowed: boolean
    restrictions: string[]
    details: Record<string, RateLimitResult>
  }> {
    const restrictions: string[] = []
    const details: Record<string, RateLimitResult> = {}

    // Check by IP address
    if (options.byIP) {
      const ipResult = await this.checkRateLimit(identifier, 'login_by_ip', {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxAttempts: 10,
        blockDurationMs: 60 * 60 * 1000 // 1 hour
      })
      
      details.ip = ipResult
      if (!ipResult.allowed) {
        restrictions.push('ip_address')
      }
    }

    // Check by email
    if (options.byEmail) {
      const emailResult = await this.checkRateLimit(identifier, 'login_by_email', {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxAttempts: 5,
        blockDurationMs: 30 * 60 * 1000 // 30 minutes
      })
      
      details.email = emailResult
      if (!emailResult.allowed) {
        restrictions.push('email')
      }
    }

    // Check by phone
    if (options.byPhone) {
      const phoneResult = await this.checkRateLimit(identifier, 'login_by_phone', {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxAttempts: 5,
        blockDurationMs: 30 * 60 * 1000 // 30 minutes
      })
      
      details.phone = phoneResult
      if (!phoneResult.allowed) {
        restrictions.push('phone')
      }
    }

    return {
      allowed: restrictions.length === 0,
      restrictions,
      details
    }
  }

  /**
   * Check registration rate limit
   */
  async checkRegistrationRateLimit(
    identifier: string, // IP address
    email?: string,
    phone?: string
  ): Promise<{
    allowed: boolean
    restrictions: string[]
    details: Record<string, RateLimitResult>
  }> {
    const restrictions: string[] = []
    const details: Record<string, RateLimitResult> = {}

    // Check by IP address
    const ipResult = await this.checkRateLimit(identifier, 'registration_by_ip', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 3,
      blockDurationMs: 24 * 60 * 60 * 1000 // 24 hours
    })
    
    details.ip = ipResult
    if (!ipResult.allowed) {
      restrictions.push('ip_address')
    }

    // Check by email if provided
    if (email) {
      const emailResult = await this.checkRateLimit(email, 'registration_by_email', {
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        maxAttempts: 1,
        blockDurationMs: 7 * 24 * 60 * 60 * 1000 // 7 days
      })
      
      details.email = emailResult
      if (!emailResult.allowed) {
        restrictions.push('email')
      }
    }

    // Check by phone if provided
    if (phone) {
      const phoneResult = await this.checkRateLimit(phone, 'registration_by_phone', {
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        maxAttempts: 1,
        blockDurationMs: 7 * 24 * 60 * 60 * 1000 // 7 days
      })
      
      details.phone = phoneResult
      if (!phoneResult.allowed) {
        restrictions.push('phone')
      }
    }

    return {
      allowed: restrictions.length === 0,
      restrictions,
      details
    }
  }

  /**
   * Check biometric verification rate limit
   */
  async checkBiometricRateLimit(
    userId: string,
    biometricType: string
  ): Promise<RateLimitResult> {
    return this.checkRateLimit(`${userId}_${biometricType}`, 'biometric_verification', {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxAttempts: 5,
      blockDurationMs: 30 * 60 * 1000 // 30 minutes
    })
  }

  /**
   * Check 2FA verification rate limit
   */
  async checkTwoFactorRateLimit(
    userId: string,
    method: string
  ): Promise<RateLimitResult> {
    return this.checkRateLimit(`${userId}_${method}`, 'two_factor_verification', {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxAttempts: 5,
      blockDurationMs: 30 * 60 * 1000 // 30 minutes
    })
  }

  /**
   * Check password reset rate limit
   */
  async checkPasswordResetRateLimit(
    identifier: string, // email or phone
    type: 'email' | 'phone'
  ): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, `password_reset_${type}`, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 3,
      blockDurationMs: 24 * 60 * 60 * 1000 // 24 hours
    })
  }

  /**
   * Check OTP sending rate limit
   */
  async checkOtpRateLimit(
    identifier: string, // email or phone
    type: 'email' | 'phone'
  ): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, `otp_send_${type}`, {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxAttempts: 3,
      blockDurationMs: 15 * 60 * 1000 // 15 minutes
    })
  }

  /**
   * Check API rate limit for authenticated users
   */
  async checkApiRateLimit(
    userId: string,
    endpoint: string,
    tier: 'free' | 'premium' | 'enterprise' = 'free'
  ): Promise<RateLimitResult> {
    const limits = {
      free: { windowMs: 60 * 1000, maxAttempts: 100 }, // 100 requests per minute
      premium: { windowMs: 60 * 1000, maxAttempts: 500 }, // 500 requests per minute
      enterprise: { windowMs: 60 * 1000, maxAttempts: 2000 } // 2000 requests per minute
    }

    const config = limits[tier] || limits.free

    return this.checkRateLimit(`${userId}_${endpoint}`, 'api_request', {
      ...config,
      blockDurationMs: 5 * 60 * 1000 // 5 minutes
    })
  }

  // Private helper methods

  private generateRateLimitKey(identifier: string, action: string): string {
    const hash = crypto.createHash('sha256')
      .update(`${identifier}:${action}`)
      .digest('hex')
      .substring(0, 32)
    
    return `rl:${action}:${hash}`
  }
}