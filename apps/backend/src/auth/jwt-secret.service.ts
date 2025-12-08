import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomBytes } from 'crypto'
import * as crypto from 'crypto'
import * as jwt from 'jsonwebtoken'

export interface JwtSecretPair {
  accessSecret: string
  refreshSecret: string
}

export interface JwtKey {
  kid: string
  accessSecret: string
  refreshSecret: string
  createdAt?: string
  isActive?: boolean
}

@Injectable()
export class JwtSecretService {
  constructor(private configService: ConfigService) {}

  /**
   * Generate cryptographically secure JWT secrets
   */
  generateSecrets(): JwtSecretPair {
    const accessSecret = randomBytes(64).toString('hex')
    const refreshSecret = randomBytes(64).toString('hex')
    
    return {
      accessSecret,
      refreshSecret,
    }
  }

  /**
   * Get existing secrets or generate new ones
   */
  getOrGenerateSecrets(): JwtSecretPair {
    const activeKey = this.getActiveKey()
    if (activeKey) {
      return { accessSecret: activeKey.accessSecret, refreshSecret: activeKey.refreshSecret }
    }

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET') || 
                          this.configService.get<string>('JWT_SECRET') || 
                          this.generateSecrets().accessSecret
    
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 
                         this.generateSecrets().refreshSecret
    
    return {
      accessSecret,
      refreshSecret,
    }
  }

  /**
   * Return all configured JWT keys from env `JWT_KEYS` (JSON array)
   */
  getKeySet(): JwtKey[] {
    const raw = this.configService.get<string>('JWT_KEYS')
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.filter(k => k && typeof k.kid === 'string' && typeof k.accessSecret === 'string' && typeof k.refreshSecret === 'string')
      }
      return []
    } catch {
      return []
    }
  }

  /**
   * Get active key by `JWT_ACTIVE_KID`, otherwise the last key in set with isActive=true
   */
  getActiveKey(): JwtKey | null {
    const keys = this.getKeySet()
    if (!keys.length) return null
    const activeKid = this.configService.get<string>('JWT_ACTIVE_KID')
    if (activeKid) {
      const byKid = keys.find(k => k.kid === activeKid)
      if (byKid) return byKid
    }
    const flagged = keys.filter(k => k.isActive)
    if (flagged.length) return flagged[flagged.length - 1]
    return keys[keys.length - 1]
  }

  /**
   * Find secret for a given kid and token type
   */
  findSecret(kid: string | undefined, type: 'access' | 'refresh'): string | null {
    const keys = this.getKeySet()
    const fallback = type === 'access' 
      ? (this.configService.get<string>('JWT_ACCESS_SECRET') || this.configService.get<string>('JWT_SECRET') || null)
      : (this.configService.get<string>('JWT_REFRESH_SECRET') || null)
    if (!kid) return fallback
    const key = keys.find(k => k.kid === kid)
    if (!key) return fallback
    return type === 'access' ? key.accessSecret : key.refreshSecret
  }

  /**
   * Decode token header to extract `kid`
   */
  getKidFromToken(token: string): string | undefined {
    try {
      const decoded = jwt.decode(token, { complete: true }) as any
      return decoded?.header?.kid
    } catch {
      return undefined
    }
  }

  /**
   * Get appropriate access secret for a token (by `kid`, fallback to env)
   */
  getAccessSecretForToken(token: string): string | null {
    const kid = this.getKidFromToken(token)
    return this.findSecret(kid, 'access')
  }

  /**
   * Get appropriate refresh secret for a token (by `kid`, fallback to env)
   */
  getRefreshSecretForToken(token: string): string | null {
    const kid = this.getKidFromToken(token)
    return this.findSecret(kid, 'refresh')
  }

  /**
   * Validate JWT secrets configuration
   */
  validateSecrets(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    const keyset = this.getKeySet()
    if (keyset.length) {
      for (const k of keyset) {
        if (!k.accessSecret || k.accessSecret.length < 32) {
          errors.push(`JWT_KEYS[${k.kid}].accessSecret must be at least 32 characters`)
        }
        if (!k.refreshSecret || k.refreshSecret.length < 32) {
          errors.push(`JWT_KEYS[${k.kid}].refreshSecret must be at least 32 characters`)
        }
      }
    }
    
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET') || 
                        this.configService.get<string>('JWT_SECRET')
    
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')
    
    if (!accessSecret) {
      errors.push('JWT_ACCESS_SECRET or JWT_SECRET is required')
    }
    
    if (!refreshSecret) {
      errors.push('JWT_REFRESH_SECRET is required')
    }
    
    if (accessSecret && accessSecret.length < 32) {
      errors.push('JWT_ACCESS_SECRET must be at least 32 characters long')
    }
    
    if (refreshSecret && refreshSecret.length < 32) {
      errors.push('JWT_REFRESH_SECRET must be at least 32 characters long')
    }
    
    if (accessSecret && refreshSecret && accessSecret === refreshSecret) {
      errors.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different')
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Generate secure API key
   */
  generateApiKey(): string {
    const prefix = 'dor_' // Dorce.ai prefix
    const randomPart = randomBytes(32).toString('hex')
    return `${prefix}${randomPart}`
  }

  /**
   * Generate secure session token
   */
  generateSessionToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Generate secure OTP
   */
  generateOtp(length: number = 6): string {
    const digits = '0123456789'
    let otp = ''
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length)
      otp += digits[randomIndex]
    }
    
    return otp
  }

  /**
   * Generate secure password reset token
   */
  generatePasswordResetToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Generate secure email verification token
   */
  generateEmailVerificationToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Generate secure WebSocket connection token
   */
  generateWebSocketToken(): string {
    return randomBytes(16).toString('hex')
  }

  /**
   * Generate secure file upload token
   */
  generateFileUploadToken(): string {
    return randomBytes(24).toString('hex')
  }

  /**
   * Generate secure admin token
   */
  generateAdminToken(): string {
    return randomBytes(48).toString('hex')
  }

  /**
   * Generate secure refresh token with metadata
   */
  generateRefreshToken(userId: string, deviceId?: string): {
    token: string
    expiresAt: Date
    userId: string
    deviceId?: string
  } {
    const token = randomBytes(32).toString('hex')
    const expiresInDays = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d').replace('d', '')
    )
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    
    return {
      token,
      expiresAt,
      userId,
      deviceId,
    }
  }

  /**
   * Hash sensitive data
   */
  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  /**
   * Generate secure random string
   */
  generateRandomString(length: number = 32): string {
    return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length)
  }
}
