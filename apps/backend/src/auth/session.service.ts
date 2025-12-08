import { Injectable, BadRequestException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import * as crypto from "crypto"
import * as jwt from "jsonwebtoken"
import { JwtSecretService } from "./jwt-secret.service"

export interface SessionInfo {
  id: string
  userId: string
  deviceInfo: {
    userAgent: string
    ipAddress: string
    deviceType: string
    os: string
    browser: string
  }
  location?: {
    country: string
    city: string
    latitude: number
    longitude: number
  }
  createdAt: Date
  lastActiveAt: Date
  expiresAt: Date
  isActive: boolean
}

export interface CreateSessionResult {
  sessionId: string
  refreshToken: string
  expiresAt: Date
}

export interface DeviceInfo {
  userAgent: string
  ipAddress: string
  deviceType?: string
  os?: string
  browser?: string
  deviceFingerprint?: string
}

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService, private jwtSecretService: JwtSecretService) {}

  /**
   * Create a new session for a user
   */
  async createSession(
    userId: string, 
    deviceInfo: DeviceInfo,
    location?: {
      country: string
      city: string
      latitude: number
      longitude: number
    }
  ): Promise<CreateSessionResult> {
    // Check existing sessions limit
    const activeSessions = await this.getActiveSessions(userId)
    if (activeSessions.length >= 5) {
      // Revoke oldest session
      const oldestSession = activeSessions.sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      )[0]
      
      await this.revokeSession(oldestSession.id)
    }

    // Generate session ID and refresh token
    const sessionId = crypto.randomBytes(32).toString('hex')
    const refreshToken = this.generateRefreshToken(userId, sessionId)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create session record
    const session = await this.prisma.session.create({
      data: {
        id: sessionId,
        user: { connect: { id: userId } },
        deviceInfo: JSON.stringify({
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress,
          deviceType: deviceInfo.deviceType || 'unknown',
          os: deviceInfo.os || 'unknown',
          browser: deviceInfo.browser || 'unknown',
          deviceFingerprint: deviceInfo.deviceFingerprint || crypto.randomBytes(16).toString('hex')
        }),
        location: location ? JSON.stringify(location) : null,
        expiresAt,
        isActive: true,
        token: refreshToken
      }
    })

    return {
      sessionId: session.id,
      refreshToken,
      expiresAt
    }
  }

  /**
   * Validate and refresh a session
   */
  async refreshSession(refreshToken: string): Promise<{
    valid: boolean
    session?: SessionInfo
    newRefreshToken?: string
  }> {
    try {
      // Verify refresh token
      const secret = this.jwtSecretService.getRefreshSecretForToken(refreshToken) || (process.env.JWT_REFRESH_SECRET || 'refresh-secret')
      const payload = jwt.verify(refreshToken, secret) as any
      
      if (!payload.sessionId) {
        return { valid: false }
      }

      // Get session from database
      const session = await this.prisma.session.findUnique({
        where: { id: payload.sessionId }
      })

      if (!session || !session.isActive || new Date() > session.expiresAt) {
        return { valid: false }
      }

      // Update last active timestamp
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() }
      })

      // Generate new refresh token
      const newRefreshToken = this.generateRefreshToken(session.userId, session.id)

      return {
        valid: true,
        session: this.mapToSessionInfo(session),
        newRefreshToken
      }
    } catch (error) {
      return { valid: false }
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await this.prisma.session.findMany({
      where: { 
        userId, 
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      orderBy: { lastActiveAt: 'desc' }
    })

    return sessions.map(session => this.mapToSessionInfo(session))
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      throw new BadRequestException("Session not found")
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false }
    })

    return true
  }

  /**
   * Revoke all sessions for a user except current one
   */
  async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: { 
        userId, 
        id: { not: currentSessionId },
        isActive: true 
      },
      data: { isActive: false }
    })

    return result.count
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllSessions(userId: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false }
    })

    return result.count
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionInfo | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      return null
    }

    return this.mapToSessionInfo(session)
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId }
    })

    if (!session || !session.isActive) {
      return false
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActiveAt: new Date() }
    })

    return true
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isActive: false }
        ]
      }
    })

    return result.count
  }

  /**
   * Get suspicious sessions (unusual locations, devices, etc.)
   */
  async getSuspiciousSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId }
    })

    // Simple suspicious activity detection
    const suspiciousSessions = sessions.filter(session => {
      const deviceInfo = JSON.parse(session.deviceInfo)
      
      // Check for suspicious patterns
      const isSuspicious = 
        session.location && this.isSuspiciousLocation(session.location) ||
        this.isSuspiciousDevice(deviceInfo) ||
        this.isSuspiciousTiming(session)

      return isSuspicious
    })

    return suspiciousSessions.map(session => this.mapToSessionInfo(session))
  }

  /**
   * Generate device fingerprint
   */
  generateDeviceFingerprint(deviceInfo: DeviceInfo): string {
    const fingerprintData = `${deviceInfo.userAgent}:${deviceInfo.ipAddress}:${deviceInfo.deviceType}:${deviceInfo.os}:${deviceInfo.browser}`
    return crypto.createHash('sha256').update(fingerprintData).digest('hex')
  }

  /**
   * Check if device is recognized
   */
  async isDeviceRecognized(userId: string, deviceFingerprint: string): Promise<boolean> {
    const sessions = await this.prisma.session.findMany({
      where: { 
        userId, 
        isActive: true,
        deviceInfo: { contains: deviceFingerprint }
      }
    })

    return sessions.length > 0
  }

  // Private helper methods

  private generateRefreshToken(userId: string, sessionId: string): string {
    const payload = {
      sub: userId,
      sessionId: sessionId,
      type: 'refresh'
    }

    const activeKey = this.jwtSecretService.getActiveKey()
    const secret = this.jwtSecretService.getOrGenerateSecrets().refreshSecret
    return jwt.sign(payload, secret, {
      expiresIn: '7d',
      issuer: 'dorce.ai',
      audience: 'dorce.ai-users',
      keyid: activeKey?.kid
    } as jwt.SignOptions)
  }

  private mapToSessionInfo(session: any): SessionInfo {
    const deviceInfo = JSON.parse(session.deviceInfo)
    const location = session.location ? JSON.parse(session.location) : undefined

    return {
      id: session.id,
      userId: session.userId,
      deviceInfo,
      location,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive
    }
  }

  private isSuspiciousLocation(locationJson: string): boolean {
    try {
      const location = JSON.parse(locationJson)
      // Simple check - in production, this would check against user's usual locations
      const highRiskCountries = ['CN', 'RU', 'KP', 'IR']
      return highRiskCountries.includes(location.country)
    } catch {
      return false
    }
  }

  private isSuspiciousDevice(deviceInfo: any): boolean {
    // Check for suspicious device patterns
    const suspiciousPatterns = [
      'bot',
      'crawler',
      'spider',
      'headless',
      'selenium',
      'puppeteer'
    ]

    const userAgent = deviceInfo.userAgent?.toLowerCase() || ''
    return suspiciousPatterns.some(pattern => userAgent.includes(pattern))
  }

  private isSuspiciousTiming(session: any): boolean {
    // Check for suspicious timing patterns (e.g., sessions created at unusual hours)
    const createdHour = session.createdAt.getHours()
    
    // Consider sessions created between 2 AM and 5 AM as potentially suspicious
    return createdHour >= 2 && createdHour <= 5
  }
}
