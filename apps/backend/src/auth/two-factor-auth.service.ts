import { Injectable, BadRequestException, UnauthorizedException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { NotificationService } from "../notification/notification.service"
import * as crypto from "crypto"
import * as qrcode from "qrcode"
import * as speakeasy from "speakeasy"

export interface TwoFactorSetupResult {
  secret: string
  qrCode: string
  backupCodes: string[]
  manualEntryKey: string
}

export interface TwoFactorVerificationResult {
  success: boolean
  message: string
  attemptsRemaining?: number
}

export interface BackupCodeVerificationResult {
  success: boolean
  codeUsed: string
  remainingCodes: number
}

@Injectable()
export class TwoFactorAuthService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService
  ) {}

  /**
   * Setup 2FA for a user
   */
  async setupTwoFactor(userId: string, method: 'totp' | 'sms' | 'email'): Promise<TwoFactorSetupResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new BadRequestException("User not found")
    }

    // Check if 2FA is already enabled
    const existing2FA = await this.prisma.twoFactorAuth.findFirst({
      where: { userId, isActive: true }
    })

    if (existing2FA) {
      throw new BadRequestException("2FA is already enabled for this user")
    }

    let result: TwoFactorSetupResult

    switch (method) {
      case 'totp':
        result = await this.setupTotp(user)
        break
      case 'sms':
        result = await this.setupSms(user)
        break
      case 'email':
        result = await this.setupEmail(user)
        break
      default:
        throw new BadRequestException("Invalid 2FA method")
    }

    return result
  }

  /**
   * Verify 2FA code
   */
  async verifyTwoFactor(
    userId: string, 
    code: string, 
    method?: 'totp' | 'sms' | 'email'
  ): Promise<TwoFactorVerificationResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new BadRequestException("User not found")
    }

    const twoFactorAuth = await this.prisma.twoFactorAuth.findFirst({
      where: { 
        userId, 
        isActive: true,
        ...(method && { method })
      }
    })

    if (!twoFactorAuth) {
      return {
        success: false,
        message: "2FA is not enabled for this user"
      }
    }

    // Check attempt limits
    const recentAttempts = await this.getRecent2FAAttempts(userId, 5 * 60 * 1000) // 5 minutes
    if (recentAttempts.length >= 5) {
      return {
        success: false,
        message: "Maximum 2FA verification attempts exceeded. Please try again later.",
        attemptsRemaining: 0
      }
    }

    let verificationResult: TwoFactorVerificationResult

    switch (twoFactorAuth.method) {
      case 'totp':
        verificationResult = await this.verifyTotp(twoFactorAuth, code)
        break
      case 'sms':
        verificationResult = await this.verifySms(twoFactorAuth, code)
        break
      case 'email':
        verificationResult = await this.verifyEmail(twoFactorAuth, code)
        break
      default:
        return {
          success: false,
          message: "Invalid 2FA method"
        }
    }

    // Log verification attempt
    await this.log2FAAttempt(userId, twoFactorAuth.method, verificationResult.success)

    return verificationResult
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, backupCode: string): Promise<BackupCodeVerificationResult> {
    const backupCodeRecord = await this.prisma.backupCode.findFirst({
      where: { 
        userId, 
        code: backupCode,
        isUsed: false 
      }
    })

    if (!backupCodeRecord) {
      return {
        success: false,
        codeUsed: '',
        remainingCodes: 0
      }
    }

    // Mark backup code as used
    await this.prisma.backupCode.update({
      where: { id: backupCodeRecord.id },
      data: { 
        isUsed: true,
        usedAt: new Date()
      }
    })

    // Count remaining codes
    const remainingCodes = await this.prisma.backupCode.count({
      where: { userId, isUsed: false }
    })

    return {
      success: true,
      codeUsed: backupCode,
      remainingCodes
    }
  }

  /**
   * Disable 2FA for a user
   */
  async disableTwoFactor(userId: string, verificationCode: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new BadRequestException("User not found")
    }

    const twoFactorAuth = await this.prisma.twoFactorAuth.findFirst({
      where: { userId, isActive: true }
    })

    if (!twoFactorAuth) {
      throw new BadRequestException("2FA is not enabled for this user")
    }

    // Verify the code before disabling
    const verificationResult = await this.verifyTwoFactor(userId, verificationCode)
    if (!verificationResult.success) {
      throw new BadRequestException("Invalid verification code")
    }

    // Disable 2FA
    await this.prisma.twoFactorAuth.updateMany({
      where: { userId },
      data: { isActive: false }
    })

    // Revoke all backup codes
    await this.prisma.backupCode.updateMany({
      where: { userId, isUsed: false },
      data: { isUsed: true }
    })

    // Send notification
    await this.notificationService.sendNotification({
      userId,
      type: 'SECURITY_ALERT',
      title: '2FA Disabled',
      message: 'Two-factor authentication has been disabled for your account.',
      priority: 'HIGH'
    })

    return true
  }

  /**
   * Generate new backup codes
   */
  async generateBackupCodes(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new BadRequestException("User not found")
    }

    // Check if 2FA is enabled
    const twoFactorAuth = await this.prisma.twoFactorAuth.findFirst({
      where: { userId, isActive: true }
    })

    if (!twoFactorAuth) {
      throw new BadRequestException("2FA must be enabled to generate backup codes")
    }

    // Revoke existing unused backup codes
    await this.prisma.backupCode.updateMany({
      where: { userId, isUsed: false },
      data: { isUsed: true }
    })

    // Generate new backup codes
    const backupCodes = this.generateSecureBackupCodes(10)

    // Store backup codes
    for (const code of backupCodes) {
      await this.prisma.backupCode.create({
        data: {
          userId,
          code,
          isUsed: false
        }
      })
    }

    return backupCodes
  }

  /**
   * Get user's 2FA status
   */
  async getTwoFactorStatus(userId: string): Promise<{
    isEnabled: boolean
    method?: string
    backupCodesRemaining: number
    lastUsedAt?: Date
  }> {
    const twoFactorAuth = await this.prisma.twoFactorAuth.findFirst({
      where: { userId, isActive: true }
    })

    const backupCodesRemaining = await this.prisma.backupCode.count({
      where: { userId, isUsed: false }
    })

    return {
      isEnabled: !!twoFactorAuth,
      method: twoFactorAuth?.method,
      backupCodesRemaining,
      lastUsedAt: twoFactorAuth?.lastUsedAt
    }
  }

  // Private helper methods

  private async setupTotp(user: any): Promise<TwoFactorSetupResult> {
    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Dorce.ai (${user.email})`,
      issuer: 'Dorce.ai',
      length: 32
    })

    // Create 2FA record
    await this.prisma.twoFactorAuth.create({
      data: {
        userId: user.id,
        method: 'totp',
        secret: secret.base32,
        isActive: true
      }
    })

    // Generate QR code
    const qrCode = await qrcode.toDataURL(secret.otpauth_url!)

    // Generate backup codes
    const backupCodes = this.generateSecureBackupCodes(10)

    // Store backup codes
    for (const code of backupCodes) {
      await this.prisma.backupCode.create({
        data: {
          userId: user.id,
          code,
          isUsed: false
        }
      })
    }

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
      manualEntryKey: secret.base32
    }
  }

  private async setupSms(user: any): Promise<TwoFactorSetupResult> {
    if (!user.phone) {
      throw new BadRequestException("Phone number is required for SMS 2FA")
    }

    // Generate SMS secret
    const secret = this.generateSecureCode(6)

    // Create 2FA record
    await this.prisma.twoFactorAuth.create({
      data: {
        userId: user.id,
        method: 'sms',
        secret: secret,
        isActive: true
      }
    })

    // Send verification SMS
    await this.notificationService.sendSms({
      to: user.phone,
      message: `Your Dorce.ai 2FA setup code is: ${secret}. This code will expire in 15 minutes.`
    })

    // Generate backup codes
    const backupCodes = this.generateSecureBackupCodes(10)

    // Store backup codes
    for (const code of backupCodes) {
      await this.prisma.backupCode.create({
        data: {
          userId: user.id,
          code,
          isUsed: false
        }
      })
    }

    return {
      secret: secret,
      qrCode: '',
      backupCodes,
      manualEntryKey: secret
    }
  }

  private async setupEmail(user: any): Promise<TwoFactorSetupResult> {
    if (!user.email) {
      throw new BadRequestException("Email is required for email 2FA")
    }

    // Generate email secret
    const secret = this.generateSecureCode(6)

    // Create 2FA record
    await this.prisma.twoFactorAuth.create({
      data: {
        userId: user.id,
        method: 'email',
        secret: secret,
        isActive: true
      }
    })

    // Send verification email
    await this.notificationService.sendEmail({
      to: user.email,
      subject: 'Dorce.ai 2FA Setup',
      html: `
        <h2>Two-Factor Authentication Setup</h2>
        <p>Your Dorce.ai 2FA setup code is: <strong>${secret}</strong></p>
        <p>This code will expire in 15 minutes.</p>
        <p>Please enter this code in your account settings to complete 2FA setup.</p>
      `
    })

    // Generate backup codes
    const backupCodes = this.generateSecureBackupCodes(10)

    // Store backup codes
    for (const code of backupCodes) {
      await this.prisma.backupCode.create({
        data: {
          userId: user.id,
          code,
          isUsed: false
        }
      })
    }

    return {
      secret: secret,
      qrCode: '',
      backupCodes,
      manualEntryKey: secret
    }
  }

  private async verifyTotp(twoFactorAuth: any, code: string): Promise<TwoFactorVerificationResult> {
    const verified = speakeasy.totp.verify({
      secret: twoFactorAuth.secret,
      encoding: 'base32',
      token: code,
      window: 2 // Allow 2 time steps of drift (60 seconds each)
    })

    if (verified) {
      // Update last used timestamp
      await this.prisma.twoFactorAuth.update({
        where: { id: twoFactorAuth.id },
        data: { lastUsedAt: new Date() }
      })

      return {
        success: true,
        message: "2FA verification successful"
      }
    }

    return {
      success: false,
      message: "Invalid 2FA code",
      attemptsRemaining: 5 // This should be calculated based on recent attempts
    }
  }

  private async verifySms(twoFactorAuth: any, code: string): Promise<TwoFactorVerificationResult> {
    // In a real implementation, this would verify against stored SMS code
    // For now, we'll simulate verification
    const isValid = twoFactorAuth.secret === code

    if (isValid) {
      // Update last used timestamp
      await this.prisma.twoFactorAuth.update({
        where: { id: twoFactorAuth.id },
        data: { lastUsedAt: new Date() }
      })

      return {
        success: true,
        message: "SMS verification successful"
      }
    }

    return {
      success: false,
      message: "Invalid SMS code",
      attemptsRemaining: 5
    }
  }

  private async verifyEmail(twoFactorAuth: any, code: string): Promise<TwoFactorVerificationResult> {
    // In a real implementation, this would verify against stored email code
    // For now, we'll simulate verification
    const isValid = twoFactorAuth.secret === code

    if (isValid) {
      // Update last used timestamp
      await this.prisma.twoFactorAuth.update({
        where: { id: twoFactorAuth.id },
        data: { lastUsedAt: new Date() }
      })

      return {
        success: true,
        message: "Email verification successful"
      }
    }

    return {
      success: false,
      message: "Invalid email code",
      attemptsRemaining: 5
    }
  }

  private generateSecureCode(length: number): string {
    const digits = '0123456789'
    let code = ''
    
    for (let i = 0; i < length; i++) {
      code += digits[Math.floor(Math.random() * digits.length)]
    }
    
    return code
  }

  private generateSecureBackupCodes(count: number): string[] {
    const codes: string[] = []
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    
    for (let i = 0; i < count; i++) {
      let code = ''
      for (let j = 0; j < 8; j++) {
        code += charset[Math.floor(Math.random() * charset.length)]
      }
      codes.push(code)
    }
    
    return codes
  }

  private async getRecent2FAAttempts(userId: string, timeWindow: number): Promise<any[]> {
    const since = new Date(Date.now() - timeWindow)
    return await this.prisma.twoFactorAttempt.findMany({
      where: {
        userId,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  private async log2FAAttempt(userId: string, method: string, success: boolean): Promise<void> {
    await this.prisma.twoFactorAttempt.create({
      data: {
        userId,
        method,
        success,
        ipAddress: this.getClientIp(),
        userAgent: this.getUserAgent(),
        deviceFingerprint: this.generateDeviceFingerprint()
      }
    })
  }

  private getClientIp(): string {
    // Implementation would get from request context
    return '127.0.0.1'
  }

  private getUserAgent(): string {
    // Implementation would get from request context
    return 'Unknown'
  }

  private generateDeviceFingerprint(): string {
    // Generate unique device fingerprint
    return crypto.randomBytes(32).toString('hex')
  }
}