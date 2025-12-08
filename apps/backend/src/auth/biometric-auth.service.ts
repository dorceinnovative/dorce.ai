import { Injectable, BadRequestException, UnauthorizedException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import * as crypto from "crypto"
import * as bcrypt from "bcryptjs"

export interface BiometricTemplate {
  type: 'fingerprint' | 'face' | 'voice' | 'iris'
  template: string // Base64 encoded biometric template
  quality: number // Quality score (0-100)
  metadata?: {
    deviceId?: string
    sensorType?: string
    captureTime?: Date
    location?: {
      latitude: number
      longitude: number
    }
  }
}

export interface BiometricVerificationResult {
  success: boolean
  confidence: number // 0-100
  matchScore?: number
  templateId?: string
  attemptsRemaining?: number
  requiresFallback?: boolean
  message?: string
}

export interface BiometricEnrollmentResult {
  success: boolean
  templateId: string
  qualityScore: number
  attempts: number
  message: string
}

@Injectable()
export class BiometricAuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Enroll biometric template for a user
   */
  async enrollBiometric(
    userId: string, 
    biometricData: BiometricTemplate
  ): Promise<BiometricEnrollmentResult> {
    // Validate biometric data
    this.validateBiometricData(biometricData)

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new BadRequestException("User not found")
    }

    // Check maximum enrollment attempts
    const existingTemplates = await this.prisma.biometricTemplate.findMany({
      where: { 
        userId,
        type: biometricData.type,
        isActive: true 
      }
    })

    if (existingTemplates.length >= 3) {
      throw new BadRequestException(`Maximum ${biometricData.type} templates reached`)
    }

    // Validate template quality
    if (biometricData.quality < 70) {
      return {
        success: false,
        templateId: '',
        qualityScore: biometricData.quality,
        attempts: existingTemplates.length + 1,
        message: "Biometric quality too low. Please try again."
      }
    }

    // Encrypt and hash the biometric template
    const encryptedTemplate = this.encryptBiometricTemplate(biometricData.template)
    const templateHash = this.hashBiometricTemplate(biometricData.template)

    // Check for duplicate templates (anti-spoofing)
    const duplicateCheck = await this.checkForDuplicateTemplate(templateHash, userId)
    if (duplicateCheck.isDuplicate) {
      return {
        success: false,
        templateId: '',
        qualityScore: biometricData.quality,
        attempts: existingTemplates.length + 1,
        message: "Similar biometric template already exists"
      }
    }

    // Create biometric template record
    const template = await this.prisma.biometricTemplate.create({
      data: {
        userId,
        type: biometricData.type,
        templateData: encryptedTemplate,
        templateHash,
        qualityScore: biometricData.quality,
        isActive: true,
        metadata: biometricData.metadata ? JSON.stringify(biometricData.metadata) : null,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
      }
    })

    // Update user biometric status
    await this.updateUserBiometricStatus(userId, biometricData.type, true)

    return {
      success: true,
      templateId: template.id,
      qualityScore: biometricData.quality,
      attempts: existingTemplates.length + 1,
      message: "Biometric enrollment successful"
    }
  }

  /**
   * Verify biometric template against stored templates
   */
  async verifyBiometric(
    userId: string,
    biometricData: BiometricTemplate,
    options: {
      allowFallback?: boolean
      maxAttempts?: number
      requireLiveness?: boolean
    } = {}
  ): Promise<BiometricVerificationResult> {
    const { allowFallback = true, maxAttempts = 5, requireLiveness = true } = options

    // Validate biometric data
    this.validateBiometricData(biometricData)

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new UnauthorizedException("User not found")
    }

    // Get user's biometric templates
    const storedTemplates = await this.prisma.biometricTemplate.findMany({
      where: { 
        userId,
        type: biometricData.type,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      orderBy: { qualityScore: 'desc' }
    })

    if (storedTemplates.length === 0) {
      return {
        success: false,
        confidence: 0,
        attemptsRemaining: 0,
        requiresFallback: true,
        message: "No biometric templates found for user"
      }
    }

    // Check attempt limits
    const recentAttempts = await this.getRecentBiometricAttempts(userId, biometricData.type, 15 * 60 * 1000) // 15 minutes
    if (recentAttempts.length >= maxAttempts) {
      return {
        success: false,
        confidence: 0,
        attemptsRemaining: 0,
        requiresFallback: true,
        message: "Maximum biometric verification attempts exceeded"
      }
    }

    // Perform biometric matching
    let bestMatch = null
    let highestScore = 0

    for (const storedTemplate of storedTemplates) {
      const decryptedTemplate = this.decryptBiometricTemplate(storedTemplate.templateData)
      const matchScore = this.calculateBiometricMatch(
        biometricData.template,
        decryptedTemplate,
        biometricData.type
      )

      if (matchScore > highestScore) {
        highestScore = matchScore
        bestMatch = storedTemplate
      }
    }

    // Log verification attempt
    await this.logBiometricAttempt(userId, biometricData.type, highestScore, bestMatch?.id)

    // Determine verification result based on match score and thresholds
    const verificationResult = this.evaluateBiometricMatch(highestScore, biometricData.type)

    if (verificationResult.success) {
      // Update successful verification stats
      await this.updateBiometricTemplateStats(bestMatch!.id, true)
      
      return {
        success: true,
        confidence: verificationResult.confidence,
        matchScore: highestScore,
        templateId: bestMatch!.id,
        attemptsRemaining: maxAttempts - recentAttempts.length - 1,
        message: "Biometric verification successful"
      }
    } else {
      // Update failed verification stats
      if (bestMatch) {
        await this.updateBiometricTemplateStats(bestMatch.id, false)
      }

      const attemptsRemaining = maxAttempts - recentAttempts.length - 1

      return {
        success: false,
        confidence: verificationResult.confidence,
        matchScore: highestScore,
        attemptsRemaining,
        requiresFallback: attemptsRemaining <= 0 && allowFallback,
        message: verificationResult.message
      }
    }
  }

  /**
   * Multi-factor biometric authentication
   */
  async multiFactorBiometricAuth(
    userId: string,
    biometricFactors: BiometricTemplate[],
    options: {
      requiredFactors?: number
      fallbackAllowed?: boolean
    } = {}
  ): Promise<{
    success: boolean
    verifiedFactors: number
    totalFactors: number
    confidence: number
    fallbackRequired: boolean
  }> {
    const { requiredFactors = 2, fallbackAllowed = true } = options

    if (biometricFactors.length < requiredFactors) {
      throw new BadRequestException(`At least ${requiredFactors} biometric factors required`)
    }

    let verifiedFactors = 0
    let totalConfidence = 0
    let fallbackRequired = false

    for (const factor of biometricFactors) {
      const result = await this.verifyBiometric(userId, factor, {
        allowFallback: false,
        maxAttempts: 3,
        requireLiveness: true
      })

      if (result.success) {
        verifiedFactors++
        totalConfidence += result.confidence
      } else if (result.requiresFallback) {
        fallbackRequired = true
      }
    }

    const averageConfidence = verifiedFactors > 0 ? totalConfidence / verifiedFactors : 0
    const success = verifiedFactors >= requiredFactors

    return {
      success,
      verifiedFactors,
      totalFactors: biometricFactors.length,
      confidence: averageConfidence,
      fallbackRequired: !success && fallbackRequired
    }
  }

  /**
   * Revoke biometric template
   */
  async revokeBiometricTemplate(userId: string, templateId: string): Promise<boolean> {
    const template = await this.prisma.biometricTemplate.findFirst({
      where: { id: templateId, userId }
    })

    if (!template) {
      throw new BadRequestException("Biometric template not found")
    }

    await this.prisma.biometricTemplate.update({
      where: { id: templateId },
      data: { 
        isActive: false,
        revokedAt: new Date()
      }
    })

    // Check if user has any remaining templates of this type
    const remainingTemplates = await this.prisma.biometricTemplate.count({
      where: { 
        userId,
        type: template.type,
        isActive: true 
      }
    })

    if (remainingTemplates === 0) {
      await this.updateUserBiometricStatus(userId, template.type, false)
    }

    return true
  }

  /**
   * Get user's biometric status
   */
  async getBiometricStatus(userId: string): Promise<{
    enrolledTypes: string[]
    totalTemplates: number
    activeTemplates: number
    lastUsedAt?: Date
    status: 'ENABLED' | 'DISABLED' | 'PARTIAL'
  }> {
    const templates = await this.prisma.biometricTemplate.findMany({
      where: { userId, isActive: true }
    })

    const enrolledTypes = Array.from(new Set(templates.map(t => t.type))) as string[]
    const lastUsedAt = templates.length > 0 ? 
      templates.reduce((latest, template) => 
        template.lastUsedAt && template.lastUsedAt > latest ? template.lastUsedAt : latest,
        templates[0].lastUsedAt
      ) : undefined

    let status: 'ENABLED' | 'DISABLED' | 'PARTIAL'
    if (templates.length === 0) {
      status = 'DISABLED'
    } else if (enrolledTypes.length >= 2) {
      status = 'ENABLED'
    } else {
      status = 'PARTIAL'
    }

    return {
      enrolledTypes,
      totalTemplates: templates.length,
      activeTemplates: templates.filter(t => t.isActive).length,
      lastUsedAt,
      status
    }
  }

  // Private helper methods

  private validateBiometricData(data: BiometricTemplate): void {
    if (!data.type || !['fingerprint', 'face', 'voice', 'iris'].includes(data.type)) {
      throw new BadRequestException("Invalid biometric type")
    }

    if (!data.template || data.template.length < 100) {
      throw new BadRequestException("Invalid biometric template")
    }

    if (!data.quality || data.quality < 0 || data.quality > 100) {
      throw new BadRequestException("Invalid quality score")
    }
  }

  private encryptBiometricTemplate(template: string): string {
    const algorithm = 'aes-256-gcm'
    const key = crypto.scryptSync(process.env.BIOMETRIC_SECRET_KEY || 'default-secret', 'salt', 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    
    let encrypted = cipher.update(template, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
  }

  private decryptBiometricTemplate(encryptedTemplate: string): string {
    const parts = encryptedTemplate.split(':')
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted template format")
    }

    const algorithm = 'aes-256-gcm'
    const key = crypto.scryptSync(process.env.BIOMETRIC_SECRET_KEY || 'default-secret', 'salt', 32)
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  private hashBiometricTemplate(template: string): string {
    return crypto.createHash('sha256').update(template).digest('hex')
  }

  private async checkForDuplicateTemplate(hash: string, userId: string): Promise<{
    isDuplicate: boolean
    similarity?: number
  }> {
    const existingTemplate = await this.prisma.biometricTemplate.findFirst({
      where: { templateHash: hash, isActive: true }
    })

    return {
      isDuplicate: existingTemplate !== null && existingTemplate.userId !== userId,
      similarity: existingTemplate ? 100 : 0
    }
  }

  private calculateBiometricMatch(
    inputTemplate: string,
    storedTemplate: string,
    type: string
  ): number {
    // Simplified biometric matching algorithm
    // In production, this would use sophisticated biometric matching libraries
    
    const similarity = this.calculateStringSimilarity(inputTemplate, storedTemplate)
    
    // Apply type-specific thresholds and adjustments
    const typeMultiplier = {
      fingerprint: 0.95,
      face: 0.85,
      voice: 0.80,
      iris: 0.98
    }[type] || 0.90

    return Math.min(similarity * typeMultiplier * 100, 100)
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  private evaluateBiometricMatch(score: number, type: string): {
    success: boolean
    confidence: number
    message: string
  } {
    const thresholds = {
      fingerprint: { min: 85, good: 92, excellent: 97 },
      face: { min: 75, good: 85, excellent: 92 },
      voice: { min: 70, good: 80, excellent: 88 },
      iris: { min: 90, good: 95, excellent: 99 }
    }[type] || { min: 80, good: 90, excellent: 95 }

    if (score >= thresholds.excellent) {
      return {
        success: true,
        confidence: 95,
        message: "Excellent biometric match"
      }
    } else if (score >= thresholds.good) {
      return {
        success: true,
        confidence: 85,
        message: "Good biometric match"
      }
    } else if (score >= thresholds.min) {
      return {
        success: true,
        confidence: 70,
        message: "Acceptable biometric match"
      }
    } else {
      return {
        success: false,
        confidence: Math.floor(score),
        message: "Biometric match insufficient"
      }
    }
  }

  private async updateUserBiometricStatus(
    userId: string, 
    type: string, 
    enabled: boolean
  ): Promise<void> {
    // Implementation depends on user model structure
    // This would update the user's biometric status flags
  }

  private async getRecentBiometricAttempts(
    userId: string, 
    type: string, 
    timeWindow: number
  ): Promise<any[]> {
    const since = new Date(Date.now() - timeWindow)
    return await this.prisma.biometricAttempt.findMany({
      where: {
        userId,
        type,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  private async logBiometricAttempt(
    userId: string,
    type: string,
    score: number,
    templateId?: string
  ): Promise<void> {
    await this.prisma.biometricAttempt.create({
      data: {
        userId,
        type,
        score,
        templateId,
        success: score >= 70, // Threshold for logging success
        ipAddress: this.getClientIp(),
        userAgent: this.getUserAgent(),
        deviceFingerprint: this.generateDeviceFingerprint()
      }
    })
  }

  private async updateBiometricTemplateStats(
    templateId: string,
    success: boolean
  ): Promise<void> {
    await this.prisma.biometricTemplate.update({
      where: { id: templateId },
      data: {
        lastUsedAt: new Date(),
        verificationCount: { increment: 1 },
        successfulVerifications: success ? { increment: 1 } : undefined,
        failedVerifications: !success ? { increment: 1 } : undefined
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
