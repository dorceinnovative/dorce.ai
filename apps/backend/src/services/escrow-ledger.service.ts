import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// import { BigInt } from '@prisma/client/runtime/library';
import { EscrowStatus, EscrowLedger } from '@prisma/client';

interface CreateEscrowLedgerDto {
  orderId: string;
  buyerId: string;
  sellerIds: string[];
  amountHeld: bigint;
  status: EscrowStatus;
}

interface ReleaseEscrowFundsDto {
  escrowId: string;
  amount?: bigint;
  reason?: string;
}

interface RefundEscrowFundsDto {
  escrowId: string;
  amount?: bigint;
  reason?: string;
}

@Injectable()
export class EscrowLedgerService {
  constructor(private prisma: PrismaService) {}

  async createEscrowLedger(data: CreateEscrowLedgerDto): Promise<EscrowLedger> {
    return this.prisma.escrowLedger.create({
      data: {
        orderId: data.orderId,
        buyerId: data.buyerId,
        sellerIds: data.sellerIds,
        amountHeld: data.amountHeld,
        amountReleased: BigInt(0),
        amountRefunded: BigInt(0),
        status: data.status,
        holdReason: 'Order payment held in escrow'
      }
    });
  }

  async releaseEscrowFunds(escrowId: string, reason: string = 'Order completed'): Promise<EscrowLedger> {
    const escrow = await this.prisma.escrowLedger.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new NotFoundException('Escrow ledger not found');
    }

    if (escrow.status !== EscrowStatus.HELD) {
      throw new BadRequestException('Escrow funds are not in held status');
    }

    const remainingAmount = escrow.amountHeld - escrow.amountReleased - escrow.amountRefunded;
    
    if (remainingAmount <= BigInt(0)) {
      throw new BadRequestException('No funds available to release');
    }

    return this.prisma.escrowLedger.update({
      where: { id: escrowId },
      data: {
        amountReleased: escrow.amountReleased + remainingAmount,
        status: EscrowStatus.RELEASED,
        releaseReason: reason
      }
    });
  }

  async refundEscrowFunds(escrowId: string, reason: string = 'Order cancelled'): Promise<EscrowLedger> {
    const escrow = await this.prisma.escrowLedger.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new NotFoundException('Escrow ledger not found');
    }

    if (escrow.status !== EscrowStatus.HELD) {
      throw new BadRequestException('Escrow funds are not in held status');
    }

    const remainingAmount = escrow.amountHeld - escrow.amountReleased - escrow.amountRefunded;
    
    if (remainingAmount <= BigInt(0)) {
      throw new BadRequestException('No funds available to refund');
    }

    return this.prisma.escrowLedger.update({
      where: { id: escrowId },
      data: {
        amountRefunded: escrow.amountRefunded + remainingAmount,
        status: EscrowStatus.REFUNDED,
        refundReason: reason
      }
    });
  }

  async getEscrowLedger(orderId: string): Promise<EscrowLedger | null> {
    return this.prisma.escrowLedger.findUnique({
      where: { orderId }
    });
  }

  async getEscrowLedgersByUser(userId: string, role: 'buyer' | 'seller'): Promise<EscrowLedger[]> {
    if (role === 'buyer') {
      return this.prisma.escrowLedger.findMany({
        where: { buyerId: userId }
      });
    } else {
      return this.prisma.escrowLedger.findMany({
        where: { sellerIds: { has: userId } }
      });
    }
  }

  async createDispute(escrowId: string, disputeId: string): Promise<EscrowLedger> {
    const escrow = await this.prisma.escrowLedger.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new NotFoundException('Escrow ledger not found');
    }

    return this.prisma.escrowLedger.update({
      where: { id: escrowId },
      data: { disputeId }
    });
  }
}