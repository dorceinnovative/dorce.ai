import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { LedgerService, TransactionCategory } from '../ledger/ledger.service'
import { AuditService } from '../audit/audit.service'
import { SecurityService } from '../security/security.service'

// Define local LedgerAccountType enum
enum LedgerAccountType {
  ESCROW_HOLDING = 'ESCROW_HOLDING',
  DEPOSIT = 'DEPOSIT',
  LOAN = 'LOAN',
  INVESTMENT = 'INVESTMENT',
  SYSTEM = 'SYSTEM'
}
// import { TransactionCategory, LedgerStatus, EscrowStatus } from '@prisma/client'

// Define local enums for missing Prisma types
enum EscrowStatus {
  PENDING = 'PENDING',
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED'
}

// Use TransactionCategory enum for consistency

export interface CreateEscrowDto {
  buyerId: string
  sellerId: string
  initiatorId: string
  totalAmount: bigint
  currency?: string
  releaseConditions: any
  autoReleaseDate?: Date
  disputeDeadline?: Date
  orderId?: string
  contractId?: string
  stakeholderIds?: string[]
  requiresApproval?: boolean
}

export interface ReleaseEscrowDto {
  escrowId: string
  amount?: bigint // Partial release amount, defaults to full amount
  releaseReason: string
  releasedBy: string
  stakeholderApprovals?: { userId: string; approved: boolean; reason?: string }[]
}

export interface RefundEscrowDto {
  escrowId: string
  amount?: bigint // Partial refund amount, defaults to full amount
  refundReason: string
  refundedBy: string
}

export interface EscrowDisputeDto {
  escrowId: string
  raisedBy: string
  disputeReason: string
  disputeDetails: any
  evidence?: string[]
}

@Injectable()
export class EnhancedEscrowService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService,
    private auditService: AuditService,
    private securityService: SecurityService,
  ) {}

  /**
   * Create a new escrow with multi-party support and comprehensive validation
   */
  async createEscrow(dto: CreateEscrowDto): Promise<any> {
    // Validate all parties exist and are active
    const [buyer, seller, initiator] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.buyerId } }),
      this.prisma.user.findUnique({ where: { id: dto.sellerId } }),
      this.prisma.user.findUnique({ where: { id: dto.initiatorId } })
    ])

    if (!buyer || !seller || !initiator) {
      throw new NotFoundException('One or more parties not found')
    }

    if (buyer.isBlocked || seller.isBlocked || initiator.isBlocked) {
      throw new BadRequestException('One or more parties are blocked')
    }

    // Validate stakeholder IDs if provided
    if (dto.stakeholderIds && dto.stakeholderIds.length > 0) {
      const stakeholders = await this.prisma.user.findMany({
        where: { id: { in: dto.stakeholderIds } }
      })

      if (stakeholders.length !== dto.stakeholderIds.length) {
        throw new NotFoundException('One or more stakeholders not found')
      }

      const blockedStakeholders = stakeholders.filter(s => s.isBlocked)
      if (blockedStakeholders.length > 0) {
        throw new BadRequestException('One or more stakeholders are blocked')
      }
    }

    // Validate buyer has sufficient balance
    const buyerAccount = await this.prisma.document.findFirst({
      where: { 
        userId: dto.buyerId,
        type: 'OTHER',
        fileName: 'LEDGER_ACCOUNT'
      }
    })

    if (!buyerAccount) {
      throw new BadRequestException('Buyer does not have a valid deposit account')
    }

    // Check balance from stored JSON data
    const accountData = buyerAccount?.fileUrl ? JSON.parse(buyerAccount.fileUrl) : {}
    const balance = accountData.balance || 0n
    if (balance < dto.totalAmount) {
      throw new BadRequestException('Buyer has insufficient balance')
    }

    // Generate escrow number
    const escrowNumber = await this.generateEscrowNumber()

    // Create escrow with comprehensive audit trail
    const escrow = await this.prisma.$transaction(async (tx) => {
      // Create ledger entry for escrow hold
      const ledgerEntry = await this.ledgerService.createEntry({
        debitAccountId: buyerAccount.id,
        creditAccountId: await this.getEscrowHoldingAccountId(),
        amount: dto.totalAmount,
        currency: dto.currency || 'NGN',
        description: `Escrow hold for ${escrowNumber}`,
        category: TransactionCategory.ESCROW_HOLD,
        subcategory: 'ESCROW_CREATION',
        createdBy: dto.initiatorId,
        requiresApproval: dto.requiresApproval
      })

      // Create enhanced escrow
      const newEscrow = await tx.document.create({
        data: {
          userId: dto.buyerId,
          type: 'OTHER',
          fileName: 'ENHANCED_ESCROW',
          fileSize: 0,
          mimeType: 'application/json',
          fileUrl: JSON.stringify({
            escrowNumber,
            initiatorId: dto.initiatorId,
            buyerId: dto.buyerId,
            sellerId: dto.sellerId,
            stakeholderIds: dto.stakeholderIds || [],
            totalAmount: dto.totalAmount,
            currency: dto.currency || 'NGN',
            buyerLedgerEntryId: ledgerEntry.id,
            releaseConditions: dto.releaseConditions,
            autoReleaseDate: dto.autoReleaseDate,
            disputeDeadline: dto.disputeDeadline || this.getDefaultDisputeDeadline(),
            orderId: dto.orderId,
            contractId: dto.contractId,
            status: dto.requiresApproval ? EscrowStatus.PENDING : EscrowStatus.HELD,
            complianceFlags: await this.checkComplianceFlags(dto),
            requiresApproval: dto.requiresApproval
          })
        }
      })

      // Create audit log
      await this.auditService.log({
        action: 'ESCROW_CREATE',
        resourceType: 'ESCROW',
        resourceId: newEscrow.id,
        resourceDisplay: `Escrow ${escrowNumber}`,
        actionDetails: {
          escrowNumber,
          buyerId: dto.buyerId,
          sellerId: dto.sellerId,
          totalAmount: dto.totalAmount.toString(),
          currency: dto.currency || 'NGN',
          releaseConditions: dto.releaseConditions,
          requiresApproval: dto.requiresApproval
        },
        userId: dto.initiatorId
      })

      // Monitor for suspicious escrow patterns
      await this.securityService.monitorEscrowCreation({
        escrowId: newEscrow.id,
        buyerId: dto.buyerId,
        sellerIds: [dto.sellerId],
        amountHeld: dto.totalAmount
      })

      return newEscrow
    })

    return escrow
  }

  /**
   * Release escrow funds with multi-party approval support
   */
  async releaseEscrow(dto: ReleaseEscrowDto): Promise<any> {
    const escrowDoc = await this.prisma.document.findUnique({
      where: { id: dto.escrowId }
    })

    if (!escrowDoc || escrowDoc.fileName !== 'ENHANCED_ESCROW') {
      throw new NotFoundException('Escrow not found')
    }

    const escrow = JSON.parse(escrowDoc.fileUrl || '{}')

    if (!escrow) {
      throw new NotFoundException('Escrow not found')
    }

    if (escrow.status !== EscrowStatus.HELD) {
      throw new ConflictException('Escrow is not in HELD status')
    }

    const releaseAmount = dto.amount || escrow.totalAmount

    if (releaseAmount > escrow.totalAmount) {
      throw new BadRequestException('Release amount exceeds escrow total')
    }

    // Validate stakeholder approvals if required
    if (escrow.stakeholderIds.length > 0 && dto.stakeholderApprovals) {
      await this.validateStakeholderApprovals(escrow, dto.stakeholderApprovals)
    }

    // Get seller's deposit account
    const sellerAccount = await this.prisma.document.findFirst({
      where: { 
        userId: escrow.sellerId,
        type: 'OTHER',
        fileName: 'LEDGER_ACCOUNT'
      }
    })

    if (!sellerAccount) {
      throw new BadRequestException('Seller does not have a valid deposit account')
    }

    // Release escrow with comprehensive audit trail
    const result = await this.prisma.$transaction(async (tx) => {
      // Create ledger entry for release
      const ledgerEntry = await this.ledgerService.createEntry({
        debitAccountId: await this.getEscrowHoldingAccountId(),
        creditAccountId: sellerAccount.id,
        amount: releaseAmount,
        currency: escrow.currency,
        description: `Escrow release for ${escrow.escrowNumber}: ${dto.releaseReason}`,
        category: TransactionCategory.ESCROW_RELEASE,
        subcategory: 'ESCROW_RELEASE',
        createdBy: dto.releasedBy
      })

      // Update escrow status
      const currentEscrow = await tx.document.findUnique({ where: { id: dto.escrowId } })
      if (!currentEscrow) throw new NotFoundException('Escrow not found')
      
      const escrowData = JSON.parse(currentEscrow.fileUrl || '{}')
      escrowData.status = EscrowStatus.RELEASED
      escrowData.releasedAmount = releaseAmount
      escrowData.releasedAt = new Date()
      escrowData.releasedBy = dto.releasedBy
      escrowData.releaseReason = dto.releaseReason
      
      const updatedEscrow = await tx.document.update({
        where: { id: dto.escrowId },
        data: {
          fileUrl: JSON.stringify(escrowData)
        }
      })

      // Create audit log
      await this.auditService.log({
        action: 'ESCROW_RELEASE',
        resourceType: 'ESCROW',
        resourceId: dto.escrowId,
        resourceDisplay: `Escrow ${escrow.escrowNumber}`,
        actionDetails: {
          escrowNumber: escrow.escrowNumber,
          releaseAmount: releaseAmount.toString(),
          releaseReason: dto.releaseReason,
          releasedBy: dto.releasedBy,
          stakeholderApprovals: dto.stakeholderApprovals
        },
        userId: dto.releasedBy
      })

      return updatedEscrow
    })

    return result
  }

  /**
   * Refund escrow funds to buyer
   */
  async refundEscrow(dto: RefundEscrowDto): Promise<any> {
    const escrowDoc = await this.prisma.document.findUnique({
      where: { id: dto.escrowId }
    })

    if (!escrowDoc || escrowDoc.fileName !== 'ENHANCED_ESCROW') {
      throw new NotFoundException('Escrow not found')
    }

    const escrow = JSON.parse(escrowDoc.fileUrl || '{}')

    if (!escrow) {
      throw new NotFoundException('Escrow not found')
    }

    if (escrow.status !== EscrowStatus.HELD && escrow.status !== EscrowStatus.PENDING) {
      throw new ConflictException('Escrow is not in a refundable status')
    }

    const refundAmount = dto.amount || escrow.totalAmount

    if (refundAmount > escrow.totalAmount) {
      throw new BadRequestException('Refund amount exceeds escrow total')
    }

    // Get buyer's deposit account
    const buyerAccount = await this.prisma.document.findFirst({
      where: { 
        userId: escrow.buyerId,
        type: 'OTHER',
        fileName: 'LEDGER_ACCOUNT'
      }
    })

    if (!buyerAccount) {
      throw new BadRequestException('Buyer does not have a valid deposit account')
    }

    // Refund escrow with comprehensive audit trail
    const result = await this.prisma.$transaction(async (tx) => {
      // Create ledger entry for refund
      const ledgerEntry = await this.ledgerService.createEntry({
        debitAccountId: await this.getEscrowHoldingAccountId(),
        creditAccountId: buyerAccount.id,
        amount: refundAmount,
        currency: escrow.currency,
        description: `Escrow refund for ${escrow.escrowNumber}: ${dto.refundReason}`,
        category: TransactionCategory.ESCROW_REFUND,
        subcategory: 'ESCROW_REFUND',
        createdBy: dto.refundedBy
      })

      // Update escrow status
      const currentEscrow = await tx.document.findUnique({ where: { id: dto.escrowId } })
      if (!currentEscrow) throw new NotFoundException('Escrow not found')
      
      const escrowData = JSON.parse(currentEscrow.fileUrl || '{}')
      escrowData.status = EscrowStatus.REFUNDED
      escrowData.refundedAmount = refundAmount
      escrowData.refundedAt = new Date()
      escrowData.refundedBy = dto.refundedBy
      escrowData.refundReason = dto.refundReason
      
      const updatedEscrow = await tx.document.update({
        where: { id: dto.escrowId },
        data: {
          fileUrl: JSON.stringify(escrowData)
        }
      })

      // Create audit log
      await this.auditService.log({
        action: 'ESCROW_REFUND',
        resourceType: 'ESCROW',
        resourceId: dto.escrowId,
        resourceDisplay: `Escrow ${escrow.escrowNumber}`,
        actionDetails: {
          escrowNumber: escrow.escrowNumber,
          refundAmount: refundAmount.toString(),
          refundReason: dto.refundReason,
          refundedBy: dto.refundedBy
        },
        userId: dto.refundedBy
      })

      return updatedEscrow
    })

    return result
  }

  /**
   * Raise a dispute on an escrow
   */
  async raiseDispute(dto: EscrowDisputeDto): Promise<any> {
    const escrowDoc = await this.prisma.document.findUnique({
      where: { id: dto.escrowId }
    })

    if (!escrowDoc || escrowDoc.fileName !== 'ENHANCED_ESCROW') {
      throw new NotFoundException('Escrow not found')
    }

    const escrow = JSON.parse(escrowDoc.fileUrl || '{}')

    if (!escrow) {
      throw new NotFoundException('Escrow not found')
    }

    if (escrow.status !== EscrowStatus.HELD) {
      throw new ConflictException('Escrow is not in HELD status')
    }

    // Check if dispute deadline has passed
    if (escrow.disputeDeadline && new Date() > escrow.disputeDeadline) {
      throw new ConflictException('Dispute deadline has passed')
    }

    // Create dispute with comprehensive audit trail
    const result = await this.prisma.$transaction(async (tx) => {
      // Create dispute
      const dispute = await tx.document.create({
        data: {
          userId: dto.raisedBy,
          type: 'OTHER',
          fileName: 'DISPUTE',
          fileSize: 0,
          mimeType: 'application/json',
          fileUrl: JSON.stringify({
            type: 'ESCROW_DISPUTE',
            status: 'OPEN',
            raisedBy: dto.raisedBy,
            reason: dto.disputeReason,
            details: dto.disputeDetails,
            evidence: dto.evidence || [],
            amount: escrow.totalAmount,
            currency: escrow.currency,
            assignedTo: await this.getNextDisputeResolver()
          })
        }
      })

      // Update escrow with dispute reference
      const currentEscrow = await tx.document.findUnique({ where: { id: dto.escrowId } })
      if (!currentEscrow) throw new NotFoundException('Escrow not found')
      
      const escrowData = JSON.parse(currentEscrow.fileUrl || '{}')
      escrowData.status = EscrowStatus.DISPUTED
      escrowData.disputeId = dispute.id
      
      const updatedEscrow = await tx.document.update({
        where: { id: dto.escrowId },
        data: {
          fileUrl: JSON.stringify(escrowData)
        }
      })

      // Create audit log
      await this.auditService.log({
        action: 'DISPUTE_RAISE',
        resourceType: 'ESCROW',
        resourceId: dto.escrowId,
        resourceDisplay: `Escrow ${escrow.escrowNumber}`,
        actionDetails: {
          escrowNumber: escrow.escrowNumber,
          disputeId: dispute.id,
          disputeReason: dto.disputeReason,
          raisedBy: dto.raisedBy
        },
        userId: dto.raisedBy
      })

      // Monitor for suspicious dispute patterns
      await this.securityService.monitorDisputeCreation({
        escrowId: dto.escrowId,
        disputeId: dispute.id,
        userId: dto.raisedBy,
        reason: dto.disputeReason
      })

      return { escrow: updatedEscrow, dispute }
    })

    return result
  }

  /**
   * Get escrow details with comprehensive information
   */
  async getEscrowDetails(escrowId: string): Promise<any> {
    const escrowDoc = await this.prisma.document.findUnique({
      where: { id: escrowId }
    })

    if (!escrowDoc || escrowDoc.fileName !== 'ENHANCED_ESCROW') {
      throw new NotFoundException('Escrow not found')
    }

    const escrow = JSON.parse(escrowDoc.fileUrl || '{}')

    // Get related user data
    const [buyer, seller, initiator] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: escrow.buyerId },
        select: { id: true, email: true, firstName: true, lastName: true }
      }),
      this.prisma.user.findUnique({
        where: { id: escrow.sellerId },
        select: { id: true, email: true, firstName: true, lastName: true }
      }),
      this.prisma.user.findUnique({
        where: { id: escrow.initiatorId },
        select: { id: true, email: true, firstName: true, lastName: true }
      })
    ])

    // Get related ledger entry if exists
    const buyerLedgerEntry = escrow.buyerLedgerEntryId ? await this.prisma.document.findUnique({
      where: { id: escrow.buyerLedgerEntryId }
    }) : null

    // Get dispute if exists
    const dispute = escrow.disputeId ? await this.prisma.document.findUnique({
      where: { id: escrow.disputeId }
    }) : null

    return {
      ...escrow,
      buyer,
      seller,
      initiator,
      buyerLedgerEntry,
      dispute
    }
  }

  /**
   * Get user's escrow transactions with filtering
   */
  async getUserEscrows(
    userId: string,
    filters: {
      status?: EscrowStatus
      role?: 'buyer' | 'seller' | 'initiator' | 'stakeholder'
      startDate?: Date
      endDate?: Date
      limit?: number
      offset?: number
    } = {}
  ): Promise<any[]> {
    // Get all escrow documents for this user
    const escrowDocs = await this.prisma.document.findMany({
      where: {
        type: 'OTHER',
        fileName: 'ENHANCED_ESCROW',
        createdAt: filters.startDate || filters.endDate ? {
          gte: filters.startDate,
          lte: filters.endDate
        } : undefined
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0
    })

    // Parse and filter escrows based on role and status
    const userEscrows: any[] = []
    for (const doc of escrowDocs) {
      const escrow = JSON.parse(doc.fileUrl || '{}')
      
      // Apply status filter
      if (filters.status && escrow.status !== filters.status) continue
      
      // Apply role filter
      let matchesRole = false
      if (!filters.role) {
        // All roles
        matchesRole = escrow.buyerId === userId || 
                     escrow.sellerId === userId || 
                     escrow.initiatorId === userId ||
                     (escrow.stakeholderIds && escrow.stakeholderIds.includes(userId))
      } else if (filters.role === 'buyer') {
        matchesRole = escrow.buyerId === userId
      } else if (filters.role === 'seller') {
        matchesRole = escrow.sellerId === userId
      } else if (filters.role === 'initiator') {
        matchesRole = escrow.initiatorId === userId
      } else if (filters.role === 'stakeholder') {
        matchesRole = escrow.stakeholderIds && escrow.stakeholderIds.includes(userId)
      }
      
      if (!matchesRole) continue

      // Get related user data
      const [buyer, seller] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: escrow.buyerId },
          select: { id: true, email: true, firstName: true, lastName: true }
        }),
        this.prisma.user.findUnique({
          where: { id: escrow.sellerId },
          select: { id: true, email: true, firstName: true, lastName: true }
        })
      ])

      // Get dispute if exists
      const dispute = escrow.disputeId ? await this.prisma.document.findUnique({
        where: { id: escrow.disputeId },
        select: { id: true, status: true, fileUrl: true }
      }) : null

      userEscrows.push({
        ...escrow,
        id: doc.id,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        buyer,
        seller,
        dispute: dispute ? { 
          id: dispute.id, 
          status: dispute.status,
          reason: JSON.parse(dispute.fileUrl || '{}').reason 
        } : null
      })
    }

    return userEscrows
  }

  /**
   * Generate unique escrow number
   */
  private async generateEscrowNumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substr(2, 6).toUpperCase()
    return `ESC${timestamp}${random}`
  }

  /**
   * Get escrow holding account ID (system account)
   */
  private async getEscrowHoldingAccountId(): Promise<string> {
    let account = await this.prisma.document.findFirst({
      where: {
        type: 'OTHER',
        fileName: 'ESCROW_HOLDING_ACCOUNT'
      }
    })

    if (!account) {
      // Create system escrow holding account if it doesn't exist
      account = await this.prisma.document.create({
        data: {
          userId: 'SYSTEM',
          type: 'OTHER',
          fileName: 'ESCROW_HOLDING_ACCOUNT',
          fileSize: 0,
          mimeType: 'application/json',
          fileUrl: JSON.stringify({
            accountType: LedgerAccountType.ESCROW_HOLDING,
            description: 'System Escrow Holding Account',
            isSystem: true,
            balance: 0,
            currency: 'NGN'
          })
        }
      })
    }

    return account.id
  }

  /**
   * Get default dispute deadline (7 days from now)
   */
  private getDefaultDisputeDeadline(): Date {
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 7)
    return deadline
  }

  /**
   * Check compliance flags for escrow
   */
  private async checkComplianceFlags(dto: CreateEscrowDto): Promise<string[]> {
    const flags: string[] = []

    // Check for high-value transactions
    if (dto.totalAmount > 1000000) { // ₦10,000 equivalent
      flags.push('HIGH_VALUE_TRANSACTION')
    }

    // Check for unusual patterns (would integrate with ML models)
    const recentEscrows = await this.prisma.document.findMany({
      where: {
        type: 'OTHER',
        fileName: 'ENHANCED_ESCROW',
        userId: dto.buyerId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }
    })

    if (recentEscrows.length > 5) {
      flags.push('FREQUENT_ESCROW_ACTIVITY')
    }

    return flags
  }

  /**
   * Validate stakeholder approvals
   */
  private async validateStakeholderApprovals(
    escrow: any,
    approvals: { userId: string; approved: boolean; reason?: string }[]
  ): Promise<void> {
    const requiredStakeholders = escrow.stakeholderIds
    const approvingStakeholders = approvals.filter(a => a.approved).map(a => a.userId)

    // Check if all required stakeholders have approved
    const missingApprovals = requiredStakeholders.filter(id => 
      !approvingStakeholders.includes(id)
    )

    if (missingApprovals.length > 0) {
      throw new BadRequestException(`Missing approvals from stakeholders: ${missingApprovals.join(', ')}`)
    }

    // Check for any rejections
    const rejectedApprovals = approvals.filter(a => !a.approved)
    if (rejectedApprovals.length > 0) {
      throw new BadRequestException(`Stakeholder ${rejectedApprovals[0].userId} rejected release: ${rejectedApprovals[0].reason}`)
    }
  }

  /**
   * Get next dispute resolver (round-robin assignment)
   */
  private async getNextDisputeResolver(): Promise<string> {
    // This would integrate with a proper assignment system
    // For now, return a placeholder
    return 'SYSTEM'
  }
}