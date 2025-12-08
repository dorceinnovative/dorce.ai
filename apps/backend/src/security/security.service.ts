import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'

export interface TransactionMonitoringDto {
  transactionId: string
  amount: bigint
  fromWalletId: string
  toWalletId: string
  userId?: string
}

export interface EscrowMonitoringDto {
  escrowId: string
  buyerId: string
  sellerIds: string[]
  amountHeld: bigint
}

export interface DisputeMonitoringDto {
  escrowId: string
  disputeId: string
  userId: string
  reason: string
}

export interface SecurityAlertDto {
  alertType: string
  severity: string
  title: string
  description: string
  affectedResources: string[]
  recommendedActions: string[]
  metadata?: any
}

@Injectable()
export class SecurityService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Monitor transactions for suspicious patterns
   */
  async monitorTransaction(dto: TransactionMonitoringDto): Promise<void> {
    const alerts: SecurityAlertDto[] = []

    // Check for unusually large transactions
    if (dto.amount > 10000000) { // ₦100,000 equivalent
      alerts.push({
        alertType: 'LARGE_TRANSACTION',
        severity: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        title: 'Large Transaction Detected',
        description: `Transaction ${dto.transactionId} exceeds threshold: ₦${(Number(dto.amount) / 100).toFixed(2)}`,
        affectedResources: [dto.transactionId, dto.fromWalletId, dto.toWalletId],
        recommendedActions: ['Review transaction details', 'Verify user identity', 'Check transaction purpose']
      })
    }

    // Check for rapid transaction patterns
    const recentTransactions = await this.prisma.walletTransaction.findMany({
      where: {
        OR: [
          { walletId: dto.fromWalletId },
          { walletId: dto.toWalletId }
        ],
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      }
    })

    if (recentTransactions.length > 10) {
      alerts.push({
        alertType: 'RAPID_TRANSACTIONS',
        severity: 'HIGH' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        title: 'Rapid Transaction Pattern Detected',
        description: `Account ${dto.fromWalletId} has ${recentTransactions.length} transactions in the last hour`,
        affectedResources: [dto.fromWalletId, dto.toWalletId],
        recommendedActions: ['Monitor account activity', 'Implement rate limiting', 'Review account history']
      })
    }

    // Check for circular transactions
    const circularTransactions = await this.detectCircularTransactions(dto)
    if (circularTransactions.length > 0) {
      alerts.push({
        alertType: 'CIRCULAR_TRANSACTION',
        severity: 'CRITICAL' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        title: 'Circular Transaction Pattern Detected',
        description: `Potential money laundering detected in transaction ${dto.transactionId}`,
        affectedResources: circularTransactions,
        recommendedActions: ['Block transaction immediately', 'Investigate account network', 'Report to compliance team']
      })
    }

    // Process all alerts
    for (const alert of alerts) {
      await this.createSecurityAlert(alert)
    }
  }

  /**
   * Monitor escrow creation for suspicious patterns
   */
  async monitorEscrowCreation(dto: EscrowMonitoringDto): Promise<void> {
    const alerts: SecurityAlertDto[] = []

    // Check for large escrow amounts
    if (dto.amountHeld > 5000000) { // ₦50,000 equivalent
      alerts.push({
        alertType: 'LARGE_ESCROW',
        severity: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        title: 'Large Escrow Creation Detected',
        description: `Escrow ${dto.escrowId} exceeds threshold: ₦${(Number(dto.amountHeld) / 100).toFixed(2)}`,
        affectedResources: [dto.escrowId, dto.buyerId, ...dto.sellerIds],
        recommendedActions: ['Verify escrow purpose', 'Check buyer/seller history', 'Review transaction details']
      })
    }

    // Check for frequent escrow creation by same user
    const recentEscrows = await this.prisma.escrowLedger.findMany({
      where: {
        OR: [
          { buyerId: dto.buyerId },
          { sellerIds: { has: dto.buyerId } }
        ],
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }
    })

    if (recentEscrows.length > 5) {
      alerts.push({
        alertType: 'FREQUENT_ESCROW',
        severity: 'HIGH',
        title: 'Frequent Escrow Creation Detected',
        description: `User ${dto.buyerId} has created ${recentEscrows.length} escrows in the last 24 hours`,
        affectedResources: [dto.buyerId, dto.escrowId, ...dto.sellerIds],
        recommendedActions: ['Review user activity', 'Check for suspicious patterns', 'Implement rate limiting']
      })
    }

    // Check for self-dealing (buyer = seller) - skip since we have sellerIds array
    if (dto.sellerIds.includes(dto.buyerId)) {
      alerts.push({
        alertType: 'SELF_DEALING',
        severity: 'CRITICAL',
        title: 'Self-Dealing Escrow Detected',
        description: `Buyer and seller are the same user in escrow ${dto.escrowId}`,
        affectedResources: [dto.escrowId, dto.buyerId],
        recommendedActions: ['Block escrow immediately', 'Investigate user activity', 'Review account network']
      })
    }

    // Process all alerts
    for (const alert of alerts) {
      await this.createSecurityAlert(alert)
    }
  }

  /**
   * Monitor dispute creation for suspicious patterns
   */
  async monitorDisputeCreation(dto: DisputeMonitoringDto): Promise<void> {
    const alerts: SecurityAlertDto[] = []

    // Check for frequent disputes by same user
    const recentDisputes = await this.prisma.dispute.findMany({
      where: {
        userId: dto.userId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }
    })

    if (recentDisputes.length > 3) {
      alerts.push({
        alertType: 'FREQUENT_DISPUTES',
        severity: 'MEDIUM',
        title: 'Frequent Dispute Creation Detected',
        description: `User ${dto.userId} has raised ${recentDisputes.length} disputes in the last 30 days`,
        affectedResources: [dto.userId, dto.disputeId],
        recommendedActions: ['Review user dispute history', 'Check for pattern abuse', 'Investigate user credibility']
      })
    }

    // Check for disputes on large amounts
    const escrow = await this.prisma.escrowLedger.findUnique({
      where: { id: dto.escrowId }
    })

    if (escrow && escrow.amountHeld > 10000000) { // ₦100,000 equivalent
      alerts.push({
        alertType: 'LARGE_DISPUTE',
        severity: 'HIGH',
        title: 'Large Amount Dispute Detected',
        description: `Dispute raised on escrow ${dto.escrowId} with amount ₦${(Number(escrow.amountHeld) / 100).toFixed(2)}`,
        affectedResources: [dto.escrowId, dto.disputeId],
        recommendedActions: ['Prioritize dispute resolution', 'Investigate transaction details', 'Review escrow conditions']
      })
    }

    // Process all alerts
    for (const alert of alerts) {
      await this.createSecurityAlert(alert)
    }
  }

  /**
   * Monitor login attempts for brute force attacks
   */
  async monitorLoginAttempts(ipAddress: string, userId?: string): Promise<void> {
    const alerts: SecurityAlertDto[] = []

    // Check for failed login attempts - since we don't have securityEvent, we'll skip this for now
    const failedAttempts: any[] = [] // Placeholder - would need audit logs or similar

    if (failedAttempts.length > 5) {
      alerts.push({
        alertType: 'BRUTE_FORCE_ATTEMPT',
        severity: 'HIGH',
        title: 'Brute Force Login Attempt Detected',
        description: `${failedAttempts.length} failed login attempts from IP ${ipAddress}`,
        affectedResources: [ipAddress],
        recommendedActions: ['Block IP address', 'Implement CAPTCHA', 'Notify security team']
      })
    }

    // Check for login from unusual locations
    const geographicLocation = await this.getGeographicLocation(ipAddress)
    if (userId && geographicLocation) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      })

      if (user) {
        // This would integrate with user behavior analytics
        const isUnusualLocation = await this.isUnusualLocation(userId, geographicLocation)
        if (isUnusualLocation) {
          alerts.push({
            alertType: 'GEOGRAPHIC_ANOMALY',
            severity: 'MEDIUM',
            title: 'Unusual Login Location Detected',
            description: `Login from unusual location ${geographicLocation} for user ${userId}`,
            affectedResources: [userId],
            recommendedActions: ['Require additional verification', 'Notify user', 'Monitor account activity']
          })
        }
      }
    }

    // Process all alerts
    for (const alert of alerts) {
      await this.createSecurityAlert(alert)
    }
  }

  /**
   * Monitor API usage for suspicious patterns
   */
  async monitorApiUsage(userId: string, endpoint: string, requestCount: number): Promise<void> {
    const alerts: SecurityAlertDto[] = []

    // Check for API abuse
    if (requestCount > 1000) { // More than 1000 requests per hour
      alerts.push({
        alertType: 'API_ABUSE',
        severity: 'HIGH',
        title: 'Excessive API Usage Detected',
        description: `User ${userId} made ${requestCount} requests to ${endpoint}`,
        affectedResources: [userId],
        recommendedActions: ['Implement rate limiting', 'Block user temporarily', 'Investigate usage pattern']
      })
    }

    // Check for scraping patterns
    const sensitiveEndpoints = ['/api/users', '/api/transactions', '/api/escrows']
    if (sensitiveEndpoints.includes(endpoint) && requestCount > 100) {
      alerts.push({
        alertType: 'DATA_SCRAPING',
        severity: 'MEDIUM',
        title: 'Potential Data Scraping Detected',
        description: `User ${userId} accessed sensitive endpoint ${endpoint} ${requestCount} times`,
        affectedResources: [userId, endpoint],
        recommendedActions: ['Implement rate limiting', 'Add CAPTCHA protection', 'Monitor data access patterns']
      })
    }

    // Process all alerts
    for (const alert of alerts) {
      await this.createSecurityAlert(alert)
    }
  }

  /**
   * Create a security alert and trigger appropriate responses
   */
  private async createSecurityAlert(alert: SecurityAlertDto): Promise<void> {
    // Since we don't have securityEvent in main schema, we'll just log and create audit entry
    console.log(`SECURITY ALERT: ${alert.title} - ${alert.description}`)

    // Create audit log
    await this.auditService.createSecurityEvent({
      eventType: alert.alertType,
      severity: alert.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      title: alert.title,
      description: alert.description,
      eventData: alert as any,
      ipAddress: 'system',
      blocked: alert.severity === 'CRITICAL'
    })

    // Send real-time notifications for high/critical alerts
    if (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') {
      await this.sendSecurityNotification(alert)
    }

    // Take automated response actions
    if (alert.severity === 'CRITICAL') {
      await this.executeAutoResponse(alert)
    }
  }

  /**
   * Detect circular transaction patterns (money laundering indicator)
   */
  private async detectCircularTransactions(dto: TransactionMonitoringDto): Promise<string[]> {
    const circularAccounts: string[] = []
    
    // Get transaction history for both accounts
    const [debitHistory, creditHistory] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: {
          OR: [
            { walletId: dto.fromWalletId },
            { userId: dto.fromWalletId }
          ],
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        }
      }),
      this.prisma.walletTransaction.findMany({
        where: {
          OR: [
            { walletId: dto.toWalletId },
            { userId: dto.toWalletId }
          ],
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        }
      })
    ])

    // Analyze for circular patterns
    const allTransactions = [...debitHistory, ...creditHistory]
    const accountFrequency = new Map<string, number>()

    for (const transaction of allTransactions) {
      const accounts = [transaction.walletId, transaction.userId]
      for (const account of accounts) {
        if (account !== dto.fromWalletId && account !== dto.toWalletId) {
          accountFrequency.set(account, (accountFrequency.get(account) || 0) + 1)
        }
      }
    }

    // Find accounts that appear frequently (potential circular patterns)
    const entries = Array.from(accountFrequency.entries())
    for (const [account, frequency] of entries) {
      if (frequency > 5) {
        circularAccounts.push(account)
      }
    }

    return circularAccounts
  }

  /**
   * Generate automated response based on alert type
   */
  private async generateAutoResponse(alert: SecurityAlertDto): Promise<any> {
    const responses: any = {}

    switch (alert.alertType) {
      case 'BRUTE_FORCE_ATTEMPT':
        responses.actions = ['BLOCK_IP', 'ENABLE_CAPTCHA', 'NOTIFY_SECURITY']
        responses.blockDuration = '1 hour'
        break
      case 'LARGE_TRANSACTION':
        responses.actions = ['HOLD_TRANSACTION', 'REQUIRE_APPROVAL', 'NOTIFY_COMPLIANCE']
        responses.holdDuration = '24 hours'
        break
      case 'CIRCULAR_TRANSACTION':
        responses.actions = ['BLOCK_ACCOUNTS', 'FREEZE_FUNDS', 'INVESTIGATE']
        responses.freezeDuration = 'Until investigation complete'
        break
      case 'SELF_DEALING':
        responses.actions = ['BLOCK_ESCROW', 'INVESTIGATE_USER', 'REPORT_COMPLIANCE']
        responses.investigationPriority = 'HIGH'
        break
      default:
        responses.actions = ['MONITOR', 'LOG_EVENT', 'NOTIFY_TEAM']
    }

    return responses
  }

  /**
   * Execute automated response actions
   */
  private async executeAutoResponse(alert: SecurityAlertDto): Promise<void> {
    const autoResponse = await this.generateAutoResponse(alert)

    for (const action of autoResponse.actions) {
      switch (action) {
        case 'BLOCK_IP':
          // Implement IP blocking logic
          console.log(`Blocking IP: ${alert.affectedResources[0]}`)
          break
        case 'BLOCK_ACCOUNTS':
          // Implement account blocking logic
          for (const resource of alert.affectedResources) {
            if (resource.startsWith('user_')) {
              await this.blockUserAccount(resource)
            }
          }
          break
        case 'HOLD_TRANSACTION':
          // Implement transaction holding logic
          for (const resource of alert.affectedResources) {
            if (resource.startsWith('txn_')) {
              await this.holdTransaction(resource)
            }
          }
          break
        case 'FREEZE_FUNDS':
          // Implement fund freezing logic
          for (const resource of alert.affectedResources) {
            if (resource.startsWith('account_')) {
              await this.freezeAccountFunds(resource)
            }
          }
          break
      }
    }
  }

  /**
   * Send security notification to relevant teams
   */
  private async sendSecurityNotification(alert: SecurityAlertDto): Promise<void> {
    // This would integrate with notification systems (Slack, PagerDuty, email)
    console.log(`SECURITY ALERT: ${alert.title} - ${alert.description}`)
  }

  /**
   * Get geographic location from IP address
   */
  private async getGeographicLocation(ipAddress: string): Promise<string | null> {
    // This would integrate with a GeoIP service
    return null
  }

  /**
   * Check if location is unusual for user
   */
  private async isUnusualLocation(userId: string, location: string): Promise<boolean> {
    // This would integrate with user behavior analytics
    return false
  }

  /**
   * Block user account
   */
  private async blockUserAccount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true }
    })
  }

  /**
   * Hold transaction
   */
  private async holdTransaction(transactionId: string): Promise<void> {
    // Since wallet transactions don't have a PENDING status, we'll skip this for now
    console.log(`Would hold transaction: ${transactionId}`)
  }

  /**
   * Freeze account funds
   */
  private async freezeAccountFunds(accountId: string): Promise<void> {
    // Since we don't have ledgerAccount model, we'll block the user instead
    const user = await this.prisma.user.findUnique({
      where: { id: accountId }
    })
    
    if (user) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isBlocked: true }
      })
    }
  }
}