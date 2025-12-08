import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../../wallets/wallet.service';
import { LedgerService } from '../../ledger/ledger.service';

@Injectable()
export class LandAcquisitionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly ledgerService: LedgerService,
  ) {}

  async initiateLandAcquisition(projectId: string, acquisitionData: any, userId: string) {
    const { landCost, location, size, zoning } = acquisitionData;
    
    const wallet = await this.walletService.getWallet(userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.balance < landCost) {
      throw new Error('Insufficient balance for land acquisition');
    }

    const acquisition = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `land-acquisition-${projectId}`,
        fileUrl: JSON.stringify({
          projectId,
          userId,
          type: 'LAND_ACQUISITION',
          landCost,
          location,
          size,
          zoning,
          status: 'INITIATED',
          acquisitionDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }),
        userId,
        fileSize: 0,
        mimeType: 'application/json',
      },
    });

    await this.walletService.withdrawFromWallet(userId, { amount: landCost });

    return acquisition;
  }

  async getLandAcquisition(projectId: string, userId: string) {
    const acquisition = await this.prisma.document.findFirst({
      where: { 
        fileName: `land-acquisition-${projectId}`,
        userId,
        type: 'OTHER'
      },
    });

    if (!acquisition) {
      throw new Error('Land acquisition not found');
    }

    return {
      ...acquisition,
      fileUrl: JSON.parse(acquisition.fileUrl as string),
    };
  }
}