import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as crypto from 'crypto'
import { Request } from 'express'

export interface AuditLogDto {
  action: string
  resourceType: string
  resourceId?: string
  resourceDisplay?: string
  actionDetails: any
  oldValues?: any
  newValues?: any
  changedFields?: string[]
  userId?: string
  sessionId?: string
  requestId?: string
  ipAddress?: string
  userAgent?: string
  serviceName?: string
  environment?: string
  version?: string
}

export interface SecurityEventDto {
  eventType: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  eventData: any
  userId?: string
  ipAddress: string
  userAgent?: string
  geographicLocation?: string
  autoResponse?: any
  blocked?: boolean
}

@Injectable()
export class AuditService {
  constructor(
    private prisma: PrismaService,
  ) {}

  /**
   * Log an audit event with comprehensive security context
   */
  async log(dto: AuditLogDto): Promise<any> {
    const requestId = dto.requestId || this.generateRequestId()
    const serviceName = dto.serviceName || 'unknown-service'
    const environment = dto.environment || process.env.NODE_ENV || 'production'
    const version = dto.version || process.env.APP_VERSION || '1.0.0'

    // Calculate risk score based on action and context
    const riskScore = await this.calculateRiskScore(dto)
    const riskFactors = await this.identifyRiskFactors(dto)

    // Get geographic location from IP
    const geographicLocation = dto.ipAddress ? 
      await this.getGeographicLocation(dto.ipAddress) : null

    // Calculate hash for tamper detection
    const logHash = this.calculateLogHash({
      ...dto,
      requestId,
      timestamp: new Date()
    })

    // Get previous hash for chain integrity
    const previousHash = await this.getPreviousHash()

    // Create audit log using Document model (since auditLog model doesn't exist)
    const auditData = {
      sessionId: dto.sessionId,
      requestId,
      action: dto.action,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
      resourceDisplay: dto.resourceDisplay,
      actionDetails: dto.actionDetails,
      oldValues: dto.oldValues,
      newValues: dto.newValues,
      changedFields: dto.changedFields || [],
      ipAddress: dto.ipAddress || 'unknown',
      userAgent: dto.userAgent,
      geographicLocation,
      riskScore,
      riskFactors,
      requiresReview: riskScore > 70,
      serviceName,
      environment,
      version,
      logHash,
      previousHash,
      digitalSignature: await this.generateDigitalSignature(logHash)
    }

    const auditLog = await this.prisma.document.create({
      data: {
        userId: dto.userId || 'system',
        type: 'OTHER',
        fileName: `Audit Log - ${dto.action}`,
        fileUrl: JSON.stringify(auditData),
        fileSize: JSON.stringify(auditData).length,
        mimeType: 'application/json',
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verificationResult: { 
          auditType: 'security_audit',
          riskScore,
          requiresReview: riskScore > 70
        }
      }
    })

    // Trigger security monitoring for high-risk events
    if (riskScore > 70) {
      await this.createSecurityEvent({
        eventType: 'HIGH_RISK_ACTION',
        severity: 'HIGH',
        title: `High Risk Action: ${dto.action}`,
        description: `High risk audit event detected for user ${dto.userId}`,
        eventData: {
          action: dto.action,
          resourceType: dto.resourceType,
          riskScore,
          riskFactors
        },
        userId: dto.userId,
        ipAddress: dto.ipAddress || 'unknown',
        userAgent: dto.userAgent
      })
    }

    return auditLog
  }

  /**
   * Create a security event for monitoring and alerting
   */
  async createSecurityEvent(dto: SecurityEventDto): Promise<any> {
    // Create security event using Document model (since securityEvent model doesn't exist)
    const eventData = {
      eventType: dto.eventType,
      severity: dto.severity,
      title: dto.title,
      description: dto.description,
      eventData: dto.eventData,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      geographicLocation: dto.geographicLocation,
      autoResponse: dto.autoResponse,
      blocked: dto.blocked || false
    }

    const event = await this.prisma.document.create({
      data: {
        userId: dto.userId || 'system',
        type: 'OTHER',
        fileName: `Security Event - ${dto.eventType}`,
        fileUrl: JSON.stringify(eventData),
        fileSize: JSON.stringify(eventData).length,
        mimeType: 'application/json',
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verificationResult: { 
          eventType: 'security_event',
          severity: dto.severity,
          blocked: dto.blocked || false
        }
      }
    })

    // Send real-time alerts for critical events
    if (dto.severity === 'CRITICAL') {
      await this.sendCriticalAlert(event)
    }

    return event
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(filters: {
    userId?: string
    action?: string
    resourceType?: string
    resourceId?: string
    startDate?: Date
    endDate?: Date
    riskScore?: number
    ipAddress?: string
    limit?: number
    offset?: number
  } = {}): Promise<any[]> {
    const where: any = {}

    if (filters.userId) where.userId = filters.userId
    if (filters.action) where.action = filters.action
    if (filters.resourceType) where.resourceType = filters.resourceType
    if (filters.resourceId) where.resourceId = filters.resourceId
    if (filters.ipAddress) where.ipAddress = filters.ipAddress
    if (filters.riskScore) where.riskScore = { gte: filters.riskScore }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = filters.startDate
      if (filters.endDate) where.createdAt.lte = filters.endDate
    }

    // Use Document model to retrieve audit logs
    return this.prisma.document.findMany({
      where: {
        userId: filters.userId,
        type: 'OTHER',
        fileName: {
          contains: 'Audit Log'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0
    })
  }

  /**
   * Get security events with filtering
   */
  async getSecurityEvents(filters: {
    eventType?: string
    severity?: string
    userId?: string
    ipAddress?: string
    investigationStatus?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  } = {}): Promise<any[]> {
    const where: any = {
      type: 'OTHER',
      fileName: {
        contains: 'Security Event'
      }
    }

    if (filters.userId) where.userId = filters.userId

    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = filters.startDate
      if (filters.endDate) where.createdAt.lte = filters.endDate
    }

    // Use Document model to retrieve security events
    const documents = await this.prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0
    })

    // Parse the JSON data and filter by eventType and severity
    return documents
      .map(doc => {
        try {
          const data = JSON.parse(doc.fileUrl)
          return {
            ...doc,
            ...data,
            eventData: data
          }
        } catch {
          return null
        }
      })
      .filter(event => {
        if (!event) return false
        if (filters.eventType && event.eventType !== filters.eventType) return false
        if (filters.severity && event.severity !== filters.severity) return false
        if (filters.ipAddress && event.ipAddress !== filters.ipAddress) return false
        return true
      })
  }

  /**
   * Get audit trail for a specific resource
   */
  async getResourceAuditTrail(
    resourceType: string,
    resourceId: string
  ): Promise<any[]> {
    // Use Document model to retrieve audit logs for specific resource
    const documents = await this.prisma.document.findMany({
      where: {
        type: 'OTHER',
        fileName: {
          contains: 'Audit Log'
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Parse the JSON data and filter by resourceType and resourceId
    return documents
      .map(doc => {
        try {
          const data = JSON.parse(doc.fileUrl)
          return {
            ...doc,
            ...data,
            actionDetails: data
          }
        } catch {
          return null
        }
      })
      .filter(log => {
        if (!log) return false
        if (log.resourceType !== resourceType) return false
        if (log.resourceId !== resourceId) return false
        return true
      })
  }

  /**
   * Verify audit log integrity by checking hash chain
   */
  async verifyAuditIntegrity(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []
    
    // Use Document model to retrieve audit logs
    const documents = await this.prisma.document.findMany({
      where: {
        type: 'OTHER',
        fileName: {
          contains: 'Audit Log'
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    let previousHash: string | null = null

    for (const doc of documents) {
      try {
        const log = JSON.parse(doc.fileUrl)
        
        // Verify hash chain
        if (log.previousHash !== previousHash) {
          errors.push(`Hash chain broken at log ${log.requestId}`)
        }

        // Recalculate and verify log hash
        const calculatedHash = this.calculateLogHash({
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          actionDetails: log.actionDetails,
          requestId: log.requestId,
          timestamp: doc.createdAt
        })

        if (log.logHash !== calculatedHash) {
          errors.push(`Log hash mismatch at ${log.requestId}`)
        }

        // Verify digital signature
        const isSignatureValid = await this.verifyDigitalSignature(log.logHash, log.digitalSignature)
        if (!isSignatureValid) {
          errors.push(`Digital signature invalid at ${log.requestId}`)
        }

        previousHash = log.logHash
      } catch (error) {
        errors.push(`Failed to parse audit log document ${doc.id}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Generate compliance report for regulatory requirements
   */
  async generateComplianceReport(options: {
    startDate: Date
    endDate: Date
    reportType: 'PCI_DSS' | 'SOC_2' | 'NDPR' | 'GDPR' | 'AML'
  }): Promise<any> {
    const { startDate, endDate, reportType } = options

    // Get relevant audit logs
    const auditLogs = await this.getAuditLogs({
      startDate,
      endDate,
      limit: 10000 // Large limit for compliance reporting
    })

    // Get security events
    const securityEvents = await this.getSecurityEvents({
      startDate,
      endDate,
      limit: 10000
    })

    // Generate report based on type
    switch (reportType) {
      case 'PCI_DSS':
        return this.generatePCIDSSReport(auditLogs, securityEvents, startDate, endDate)
      case 'SOC_2':
        return this.generateSOC2Report(auditLogs, securityEvents, startDate, endDate)
      case 'NDPR':
        return this.generateNDPRReport(auditLogs, securityEvents, startDate, endDate)
      case 'GDPR':
        return this.generateGDPRReport(auditLogs, securityEvents, startDate, endDate)
      case 'AML':
        return this.generateAMLReport(auditLogs, securityEvents, startDate, endDate)
      default:
        throw new Error(`Unsupported report type: ${reportType}`)
    }
  }

  /**
   * Calculate risk score for an audit event
   */
  private async calculateRiskScore(dto: AuditLogDto): Promise<number> {
    let score = 0

    // High-risk actions
    const highRiskActions = [
      'TRANSACTION_REVERSE',
      'PASSWORD_RESET',
      'ROLE_ASSIGN',
      'PERMISSION_GRANT',
      'ESCROW_RELEASE'
    ]

    if (highRiskActions.includes(dto.action)) {
      score += 30
    }

    // Risk based on resource type
    if (dto.resourceType === 'TRANSACTION' || dto.resourceType === 'ESCROW') {
      score += 20
    }

    // Geographic risk (would integrate with GeoIP service)
    if (dto.ipAddress && await this.isHighRiskLocation(dto.ipAddress)) {
      score += 25
    }

    // Time-based risk (unusual hours)
    const hour = new Date().getHours()
    if (hour < 6 || hour > 22) {
      score += 15
    }

    return Math.min(score, 100)
  }

  /**
   * Identify risk factors for an audit event
   */
  private async identifyRiskFactors(dto: AuditLogDto): Promise<string[]> {
    const factors: string[] = []

    const highRiskActions = [
      'TRANSACTION_REVERSE',
      'PASSWORD_RESET',
      'ROLE_ASSIGN',
      'PERMISSION_GRANT'
    ]

    if (highRiskActions.includes(dto.action)) {
      factors.push('HIGH_RISK_ACTION')
    }

    if (dto.resourceType === 'TRANSACTION' || dto.resourceType === 'ESCROW') {
      factors.push('FINANCIAL_TRANSACTION')
    }

    if (dto.ipAddress && await this.isHighRiskLocation(dto.ipAddress)) {
      factors.push('HIGH_RISK_LOCATION')
    }

    const hour = new Date().getHours()
    if (hour < 6 || hour > 22) {
      factors.push('UNUSUAL_HOURS')
    }

    return factors
  }

  /**
   * Calculate SHA-256 hash for audit log integrity
   */
  private calculateLogHash(data: any): string {
    const hash = crypto.createHash('sha256')
    hash.update(JSON.stringify(data))
    return hash.digest('hex')
  }

  /**
   * Get previous hash for chain integrity
   */
  private async getPreviousHash(): Promise<string | null> {
    const lastDoc = await this.prisma.document.findFirst({
      where: {
        type: 'OTHER',
        fileName: {
          contains: 'Audit Log'
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    if (!lastDoc) return null
    
    try {
      const log = JSON.parse(lastDoc.fileUrl)
      return log.logHash || null
    } catch {
      return null
    }
  }

  /**
   * Generate digital signature for non-repudiation
   */
  private async generateDigitalSignature(hash: string): Promise<string> {
    // In production, this would use HMAC with a secret key
    const secret = process.env.AUDIT_SIGNATURE_SECRET || 'default-secret'
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(hash)
    return hmac.digest('hex')
  }

  /**
   * Verify digital signature
   */
  private async verifyDigitalSignature(hash: string, signature: string | null): Promise<boolean> {
    if (!signature) return false
    const expectedSignature = await this.generateDigitalSignature(hash)
    return signature === expectedSignature
  }

  /**
   * Get geographic location from IP address
   */
  private async getGeographicLocation(ipAddress: string): Promise<string | null> {
    // This would integrate with a GeoIP service
    // For now, return null
    return null
  }

  /**
   * Check if IP address is from high-risk location
   */
  private async isHighRiskLocation(ipAddress: string): Promise<boolean> {
    // This would integrate with threat intelligence services
    // For now, return false
    return false
  }

  /**
   * Send critical security alert
   */
  private async sendCriticalAlert(event: any): Promise<void> {
    // This would integrate with alerting systems (PagerDuty, Slack, etc.)
    console.error(`CRITICAL SECURITY ALERT: ${event.title}`, event)
  }

  /**
   * Generate PCI DSS compliance report
   */
  private async generatePCIDSSReport(
    auditLogs: any[],
    securityEvents: any[],
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return {
      reportType: 'PCI_DSS',
      period: { startDate, endDate },
      totalAuditLogs: auditLogs.length,
      totalSecurityEvents: securityEvents.length,
      highRiskEvents: auditLogs.filter(log => log.riskScore > 70).length,
      criticalSecurityEvents: securityEvents.filter(event => event.severity === 'CRITICAL').length,
      accessControlEvents: auditLogs.filter(log => 
        ['LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'MFA_ENABLE'].includes(log.action)
      ).length,
      dataAccessEvents: auditLogs.filter(log => 
        log.resourceType === 'TRANSACTION' || log.resourceType === 'WALLET'
      ).length,
      generatedAt: new Date()
    }
  }

  /**
   * Generate SOC 2 compliance report
   */
  private async generateSOC2Report(
    auditLogs: any[],
    securityEvents: any[],
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return {
      reportType: 'SOC_2',
      period: { startDate, endDate },
      totalAuditLogs: auditLogs.length,
      totalSecurityEvents: securityEvents.length,
      systemAccessEvents: auditLogs.filter(log => 
        ['LOGIN', 'LOGOUT', 'ROLE_ASSIGN', 'PERMISSION_GRANT'].includes(log.action)
      ).length,
      dataIntegrityEvents: auditLogs.filter(log => 
        ['CREATE', 'UPDATE', 'DELETE'].includes(log.action)
      ).length,
      securityIncidentEvents: securityEvents.filter(event => 
        ['HIGH', 'CRITICAL'].includes(event.severity)
      ).length,
      generatedAt: new Date()
    }
  }

  /**
   * Generate NDPR compliance report
   */
  private async generateNDPRReport(
    auditLogs: any[],
    securityEvents: any[],
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return {
      reportType: 'NDPR',
      period: { startDate, endDate },
      totalAuditLogs: auditLogs.length,
      totalSecurityEvents: securityEvents.length,
      personalDataAccessEvents: auditLogs.filter(log => 
        log.resourceType === 'USER' || log.resourceType === 'KYC'
      ).length,
      consentManagementEvents: auditLogs.filter(log => 
        log.action === 'PERMISSION_GRANT' || log.action === 'PERMISSION_REVOKE'
      ).length,
      dataBreachEvents: securityEvents.filter(event => 
        event.eventType === 'SYSTEM_INTRUSION' || event.eventType === 'DATA_ACCESS_ANOMALY'
      ).length,
      generatedAt: new Date()
    }
  }

  /**
   * Generate GDPR compliance report
   */
  private async generateGDPRReport(
    auditLogs: any[],
    securityEvents: any[],
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return {
      reportType: 'GDPR',
      period: { startDate, endDate },
      totalAuditLogs: auditLogs.length,
      totalSecurityEvents: securityEvents.length,
      dataSubjectAccessEvents: auditLogs.filter(log => 
        log.resourceType === 'USER'
      ).length,
      dataProcessingEvents: auditLogs.filter(log => 
        ['CREATE', 'UPDATE', 'DELETE'].includes(log.action)
      ).length,
      dataProtectionEvents: securityEvents.filter(event => 
        ['SYSTEM_INTRUSION', 'DATA_ACCESS_ANOMALY', 'MALWARE_DETECTION'].includes(event.eventType)
      ).length,
      generatedAt: new Date()
    }
  }

  /**
   * Generate AML compliance report
   */
  private async generateAMLReport(
    auditLogs: any[],
    securityEvents: any[],
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return {
      reportType: 'AML',
      period: { startDate, endDate },
      totalAuditLogs: auditLogs.length,
      totalSecurityEvents: securityEvents.length,
      financialTransactionEvents: auditLogs.filter(log => 
        log.resourceType === 'TRANSACTION' || log.resourceType === 'ESCROW'
      ).length,
      suspiciousActivityEvents: securityEvents.filter(event => 
        event.eventType === 'TRANSACTION_ANOMALY' || event.eventType === 'SUSPICIOUS_API_USAGE'
      ).length,
      highRiskUserEvents: auditLogs.filter(log => log.riskScore > 70).length,
      generatedAt: new Date()
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substr(2, 8).toUpperCase()
    return `REQ${timestamp}${random}`
  }
}