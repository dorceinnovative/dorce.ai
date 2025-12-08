import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

import { v4 as uuidv4 } from "uuid"
import type {
  CreateWalletDto,
  TopupWalletDto,
  WithdrawWalletDto,
  TransferMoneyDto,
  TransactionFilterDto,
} from "./dto/create-wallet.dto"

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a wallet for a user
   */
  async createWallet(userId: string, dto: CreateWalletDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      throw new NotFoundException("User not found")
    }

    // Check if wallet already exists
    const existingWallet = await this.prisma.wallet.findUnique({
      where: { userId },
    })
    if (existingWallet) {
      throw new ConflictException("Wallet already exists for this user")
    }

    // Create wallet
    return this.prisma.wallet.create({
      data: {
        userId,
        balance: BigInt(dto.initialBalance || 0),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  }

  /**
   * Get wallet by user ID
   */
  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    })

    if (!wallet) {
      throw new NotFoundException("Wallet not found")
    }

    return wallet
  }

  /**
   * Topup wallet
   */
  async topupWallet(userId: string, dto: TopupWalletDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException("Amount must be greater than 0")
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    })
    if (!wallet) {
      throw new NotFoundException("Wallet not found")
    }

    // Create transaction record
    const reference = `TOPUP_${userId}_${uuidv4().substring(0, 8)}`

    try {
      const transaction = await this.prisma.$transaction(async (tx) => {
        // Update wallet balance
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: BigInt(dto.amount),
            },
          },
        })

        // Create transaction record
        const txRecord = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId,
            type: 'TOPUP',
            amount: BigInt(dto.amount),
            reference,
            status: 'SUCCESS',
            paymentMethod: dto.paymentMethod || "MANUAL",
            paystackReference: dto.paystackReference,
          },
        })

        return { wallet: updatedWallet, transaction: txRecord }
      })

      return transaction
    } catch (error) {
      throw new InternalServerErrorException("Failed to topup wallet")
    }
  }

  /**
   * Withdraw from wallet
   */
  async withdrawFromWallet(userId: string, dto: WithdrawWalletDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException("Amount must be greater than 0")
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    })
    if (!wallet) {
      throw new NotFoundException("Wallet not found")
    }

    if (wallet.balance < BigInt(dto.amount)) {
      throw new BadRequestException("Insufficient wallet balance")
    }

    const reference = `WITHDRAW_${userId}_${uuidv4().substring(0, 8)}`

    try {
      const transaction = await this.prisma.$transaction(async (tx) => {
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              decrement: BigInt(dto.amount),
            },
          },
        })

        const txRecord = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId,
            type: 'WITHDRAWAL',
            amount: BigInt(dto.amount),
            description: dto.description,
            reference,
            status: 'SUCCESS',
          },
        })

        return { wallet: updatedWallet, transaction: txRecord }
      })

      return transaction
    } catch (error) {
      throw new InternalServerErrorException("Failed to withdraw from wallet")
    }
  }

  /**
   * Transfer money between users
   */
  async transferMoney(senderId: string, dto: TransferMoneyDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException("Amount must be greater than 0")
    }

    if (senderId === dto.recipientId) {
      throw new BadRequestException("Cannot transfer to yourself")
    }

    // Verify both users exist
    const [sender, recipient] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: senderId } }),
      this.prisma.user.findUnique({ where: { id: dto.recipientId } }),
    ])

    if (!sender) {
      throw new NotFoundException("Sender not found")
    }
    if (!recipient) {
      throw new NotFoundException("Recipient not found")
    }

    // Get both wallets
    const [senderWallet, recipientWallet] = await Promise.all([
      this.prisma.wallet.findUnique({ where: { userId: senderId } }),
      this.prisma.wallet.findUnique({ where: { userId: dto.recipientId } }),
    ])

    if (!senderWallet) {
      throw new NotFoundException("Sender wallet not found")
    }
    if (!recipientWallet) {
      throw new NotFoundException("Recipient wallet not found")
    }

    // Check sender balance
    if (senderWallet.balance < BigInt(dto.amount)) {
      throw new BadRequestException("Insufficient balance for transfer")
    }

    try {
      const transfer = await this.prisma.$transaction(async (tx) => {
        // Deduct from sender
        await tx.wallet.update({
          where: { id: senderWallet.id },
          data: {
            balance: {
              decrement: BigInt(dto.amount),
            },
          },
        })

        // Add to recipient
        await tx.wallet.update({
          where: { id: recipientWallet.id },
          data: {
            balance: {
              increment: BigInt(dto.amount),
            },
          },
        })

        // Create transfer record
        const transferRecord = await tx.walletTransfer.create({
          data: {
            senderId,
            receiverId: dto.recipientId,
            amount: BigInt(dto.amount),
            description: dto.description,
            status: 'SUCCESS',
            reference: `TRANSFER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            receiver: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        })

        // Create transaction records for both users
        await Promise.all([
          tx.walletTransaction.create({
            data: {
              walletId: senderWallet.id,
              userId: senderId,
              type: 'TRANSFER',
              amount: BigInt(dto.amount),
              description: `Transfer to ${recipient.firstName || recipient.email}`,
              reference: `OUT_${transferRecord.id}`,
              status: 'SUCCESS' as any,
            },
          }),
          tx.walletTransaction.create({
            data: {
              walletId: recipientWallet.id,
              userId: dto.recipientId,
              type: 'TRANSFER',
              amount: BigInt(dto.amount),
              description: `Transfer from ${sender.firstName || sender.email}`,
              reference: `IN_${transferRecord.id}`,
              status: 'SUCCESS' as any,
            },
          }),
        ])

        return transferRecord
      })

      return transfer
    } catch (error) {
      console.error("Transfer error:", error)
      throw new InternalServerErrorException("Transfer failed")
    }
  }

  /**
   * Get wallet transactions
   */
  async getTransactions(userId: string, dto: TransactionFilterDto) {
    const where: any = { userId }

    if (dto.type) {
      where.type = dto.type
    }
    if (dto.status) {
      where.status = dto.status
    }

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        skip: dto.skip ?? 0,
        take: dto.take ?? 20,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.walletTransaction.count({ where }),
    ])

    return {
      transactions,
      total,
      page: Math.floor((dto.skip ?? 0) / (dto.take ?? 20)) + 1,
      pages: Math.ceil(total / (dto.take ?? 20)),
    }
  }

  /**
   * Get wallet balance in naira (kobo to naira conversion)
   */
  async getWalletBalance(userId: string) {
    const wallet = await this.getWallet(userId)
    return {
      balanceInKobo: wallet.balance.toString(),
      balanceInNaira: (Number(wallet.balance) / 100).toFixed(2),
      wallet,
    }
  }

  /**
   * Get sent transfers for a user
   */
  async getSentTransfers(userId: string, skip = 0, take = 20) {
    const [transfers, total] = await Promise.all([
      this.prisma.walletTransfer.findMany({
        where: { senderId: userId },
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          receiver: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.walletTransfer.count({ where: { senderId: userId } }),
    ])

    return { transfers, total }
  }

  /**
   * Get received transfers for a user
   */
  async getReceivedTransfers(userId: string, skip = 0, take = 20) {
    const [transfers, total] = await Promise.all([
      this.prisma.walletTransfer.findMany({
        where: { receiverId: userId },
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.walletTransfer.count({ where: { receiverId: userId } }),
    ])

    return { transfers, total }
  }
}
