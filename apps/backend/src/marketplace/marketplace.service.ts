import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
// import { TransactionStatus, ProductCategory } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"
import { WalletService } from "../wallets/wallet.service"
import { CreateProductDto, UpdateProductDto, GetProductsDto } from "./dto/product.dto"
import {
  PurchaseAirtimeDto,
  PurchaseElectricityDto,
  ProcessPaymentDto,
  GetTransactionsDto,
} from "./dto/purchase.dto"

@Injectable()
export class MarketplaceService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  /**
   * Create a product (admin only)
   */
  async createProduct(dto: CreateProductDto) {
    return this.prisma.document.create({
      data: {
        userId: 'SYSTEM',
        type: 'OTHER',
        fileName: 'MARKETPLACE_PRODUCT',
        fileSize: 0,
        mimeType: 'application/json',
        fileUrl: JSON.stringify({
          name: dto.name,
          category: dto.category,
          description: dto.description,
          icon: dto.icon,
          provider: dto.provider,
          price: dto.price ? BigInt(dto.price) : null,
          isActive: true,
          createdAt: new Date()
        })
      },
    })
  }

  /**
   * Update a product (admin only)
   */
  async updateProduct(productId: string, dto: UpdateProductDto) {
    const productDoc = await this.prisma.document.findUnique({
      where: { id: productId },
    })

    if (!productDoc || productDoc.fileName !== 'MARKETPLACE_PRODUCT') {
      throw new NotFoundException("Product not found")
    }

    const productData = JSON.parse(productDoc.fileUrl || '{}')
    
    // Update product data
    const updatedData = {
      ...productData,
      name: dto.name ?? productData.name,
      description: dto.description ?? productData.description,
      icon: dto.icon ?? productData.icon,
      price: dto.price !== undefined ? BigInt(dto.price) : productData.price,
      isActive: dto.isActive ?? productData.isActive,
      updatedAt: new Date()
    }

    return this.prisma.document.update({
      where: { id: productId },
      data: {
        fileUrl: JSON.stringify(updatedData)
      },
    })
  }

  /**
   * Get all products with optional filtering
   */
  async getProducts(dto: GetProductsDto) {
    // Get all product documents
    const productDocs = await this.prisma.document.findMany({
      where: {
        type: 'OTHER',
        fileName: 'MARKETPLACE_PRODUCT'
      },
      skip: dto.skip ?? 0,
      take: dto.take ?? 20,
      orderBy: { createdAt: "desc" },
    })

    // Parse product data and apply filters
    const products = productDocs.map(doc => {
      const data = JSON.parse(doc.fileUrl || '{}')
      return {
        id: doc.id,
        ...data,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }
    }).filter(product => {
      // Apply isActive filter
      if (dto.isActive !== undefined && product.isActive !== dto.isActive) return false
      // Apply category filter
      if (dto.category && product.category !== dto.category) return false
      return true
    })

    const total = products.length

    return {
      products,
      total,
      page: Math.floor((dto.skip ?? 0) / (dto.take ?? 20)) + 1,
      pages: Math.ceil(total / (dto.take ?? 20)),
    }
  }

  /**
   * Get single product
   */
  async getProduct(productId: string) {
    const productDoc = await this.prisma.document.findUnique({
      where: { id: productId },
    })

    if (!productDoc || productDoc.fileName !== 'MARKETPLACE_PRODUCT') {
      throw new NotFoundException("Product not found")
    }

    const productData = JSON.parse(productDoc.fileUrl || '{}')
    
    return {
      id: productDoc.id,
      ...productData,
      createdAt: productDoc.createdAt,
      updatedAt: productDoc.updatedAt
    }
  }

  /**
   * Purchase airtime
   */
  async purchaseAirtime(userId: string, dto: PurchaseAirtimeDto) {
    // Validate phone number
    if (!dto.phoneNumber || dto.phoneNumber.length < 10) {
      throw new BadRequestException("Invalid phone number")
    }

    // Get product
    const product = await this.getProduct(dto.productId)

    if (product.category !== 'AIRTIME') {
      throw new BadRequestException("Product is not an airtime product")
    }

    // Determine amount
    const amount = dto.customAmount || Number(product.price)
    if (!amount || amount <= 0) {
      throw new BadRequestException("Invalid purchase amount")
    }

    // Check wallet balance
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      throw new NotFoundException("Wallet not found")
    }

    if (wallet.balance < BigInt(amount)) {
      throw new BadRequestException("Insufficient wallet balance")
    }

    const reference = `AIRTIME_${userId}_${uuidv4().substring(0, 8)}`

    try {
      const transaction = await this.prisma.$transaction(async (tx) => {
        // Deduct from wallet
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              decrement: BigInt(amount),
            },
          },
        })

        // Create transaction record
        const rechargeRecord = await tx.rechargeTransaction.create({
          data: {
            productId: product.id,
            userId,
            amount: BigInt(amount),
            phone: dto.phoneNumber,
            reference,
            status: 'PENDING',
          },
        })

        return rechargeRecord
      })

      // TODO: Call airtime provider API here
      // For now, mark as processing
      await this.prisma.rechargeTransaction.update({
        where: { id: transaction.id },
        data: { status: 'PROCESSING' },
      })

      return transaction
    } catch (error) {
      console.error("Airtime purchase error:", error)
      throw new InternalServerErrorException("Failed to process airtime purchase")
    }
  }

  /**
   * Purchase electricity
   */
  async purchaseElectricity(userId: string, dto: PurchaseElectricityDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException("Amount must be greater than 0")
    }

    if (!dto.meterNumber || !dto.disco) {
      throw new BadRequestException("Meter number and DISCO are required")
    }

    // Check wallet balance
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      throw new NotFoundException("Wallet not found")
    }

    if (wallet.balance < BigInt(dto.amount)) {
      throw new BadRequestException("Insufficient wallet balance")
    }

    const reference = `ELECTRICITY_${userId}_${uuidv4().substring(0, 8)}`

    try {
      const transaction = await this.prisma.$transaction(async (tx) => {
        // Deduct from wallet
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              decrement: BigInt(dto.amount),
            },
          },
        })

        // Create transaction record
        const electricityRecord = await tx.electricityTransaction.create({
          data: {
            userId,
            meterNumber: dto.meterNumber,
            disco: dto.disco,
            amount: BigInt(dto.amount),
            reference,
            status: 'PENDING',
          },
        })

        return electricityRecord
      })

      // TODO: Call electricity provider API here
      // For now, mark as processing
      await this.prisma.electricityTransaction.update({
        where: { id: transaction.id },
        data: { status: 'PROCESSING' },
      })

      return transaction
    } catch (error) {
      console.error("Electricity purchase error:", error)
      throw new InternalServerErrorException("Failed to process electricity purchase")
    }
  }

  /**
   * Get airtime transactions for user
   */
  async getAirtimeTransactions(userId: string, dto: GetTransactionsDto) {
    const where: any = { userId }

    if (dto.status) {
      where.status = dto.status
    }

    const [transactions, total] = await Promise.all([
      this.prisma.rechargeTransaction.findMany({
        where,
        skip: dto.skip ?? 0,
        take: dto.take ?? 20,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      }),
      this.prisma.rechargeTransaction.count({ where }),
    ])

    return {
      transactions,
      total,
      page: Math.floor((dto.skip ?? 0) / (dto.take ?? 20)) + 1,
      pages: Math.ceil(total / (dto.take ?? 20)),
    }
  }

  /**
   * Get electricity transactions for user
   */
  async getElectricityTransactions(userId: string, dto: GetTransactionsDto) {
    const where: any = { userId }

    if (dto.status) {
      where.status = dto.status
    }

    const [transactions, total] = await Promise.all([
      this.prisma.electricityTransaction.findMany({
        where,
        skip: dto.skip ?? 0,
        take: dto.take ?? 20,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.electricityTransaction.count({ where }),
    ])

    return {
      transactions,
      total,
      page: Math.floor((dto.skip ?? 0) / (dto.take ?? 20)) + 1,
      pages: Math.ceil(total / (dto.take ?? 20)),
    }
  }

  /**
   * Process payment confirmation from provider
   */
  async processPaymentConfirmation(userId: string, dto: ProcessPaymentDto) {
    // Check if it's an airtime or electricity transaction
    const airtimeTransaction = await this.prisma.rechargeTransaction.findUnique({
      where: { id: dto.transactionId },
    })

    if (airtimeTransaction) {
      return this.confirmAirtimeTransaction(airtimeTransaction.id, dto)
    }

    const electricityTransaction = await this.prisma.electricityTransaction.findUnique({
      where: { id: dto.transactionId },
    })

    if (electricityTransaction) {
      return this.confirmElectricityTransaction(electricityTransaction.id, dto)
    }

    throw new NotFoundException("Transaction not found")
  }

  /**
   * Confirm airtime transaction
   */
  private async confirmAirtimeTransaction(transactionId: string, dto: ProcessPaymentDto) {
    const transaction = await this.prisma.rechargeTransaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction) {
      throw new NotFoundException("Airtime transaction not found")
    }

    return this.prisma.rechargeTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'SUCCESS',
        reference: dto.reference,
        providerResponse: dto.providerResponse,
      },
    })
  }

  /**
   * Confirm electricity transaction
   */
  private async confirmElectricityTransaction(transactionId: string, dto: ProcessPaymentDto) {
    const transaction = await this.prisma.electricityTransaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction) {
      throw new NotFoundException("Electricity transaction not found")
    }

    return this.prisma.electricityTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'SUCCESS',
        reference: dto.reference,
        providerResponse: dto.providerResponse,
      },
    })
  }

  /**
   * Refund transaction (for failed payments)
   */
  async refundTransaction(transactionId: string, _reason: string) {
    // Check both transaction types
    let transactionRecord: any = await this.prisma.rechargeTransaction.findUnique({
      where: { id: transactionId },
    })

    let amount: bigint
    let userId: string

    if (transactionRecord) {
      amount = transactionRecord.amount
      userId = transactionRecord.userId
    } else {
      transactionRecord = await this.prisma.electricityTransaction.findUnique({
        where: { id: transactionId },
      })

      if (!transactionRecord) {
        throw new NotFoundException("Transaction not found")
      }

      amount = transactionRecord.amount
      userId = transactionRecord.userId
    }

    // Refund to wallet
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      throw new NotFoundException("Wallet not found")
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // Refund wallet
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: amount,
            },
          },
        })

        // Update transaction status
        if (transactionRecord.productId) {
          // Airtime transaction
          await tx.rechargeTransaction.update({
            where: { id: transactionId },
            data: {
              status: 'CANCELLED',
            },
          })
        } else {
          // Electricity transaction
          await tx.electricityTransaction.update({
            where: { id: transactionId },
            data: {
              status: 'CANCELLED',
            },
          })
        }
      })

      return { message: "Transaction refunded successfully", amount: amount.toString() }
    } catch (error) {
      throw new InternalServerErrorException("Failed to refund transaction")
    }
  }

  /**
   * Get marketplace statistics (admin)
   */
  async getStatistics() {
    const [
      totalProducts,
      activeProducts,
      totalAirtimeTransactions,
      totalElectricityTransactions,
      successfulTransactions,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.rechargeTransaction.count(),
      this.prisma.electricityTransaction.count(),
      this.prisma.rechargeTransaction.count({
        where: { status: 'SUCCESS' },
      }),
    ])

    return {
      totalProducts,
      activeProducts,
      totalAirtimeTransactions,
      totalElectricityTransactions,
      totalTransactions: totalAirtimeTransactions + totalElectricityTransactions,
      successfulTransactions,
    }
  }
}
