import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../../wallets/wallet.service';
import { LedgerService } from '../../ledger/ledger.service';

@Injectable()
export class DevelopmentFinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly ledgerService: LedgerService,
  ) {}

  async arrangeDevelopmentFinancing(projectId: string, financingData: any, userId: string) {
    const { financingAmount, financingType, interestRate, term, lender } = financingData;

    const financing = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `development-financing-${projectId}`,
        fileUrl: JSON.stringify({
          projectId,
          userId,
          type: 'DEVELOPMENT_FINANCING',
          financingAmount,
          financingType,
          interestRate,
          term,
          lender,
          status: 'ARRANGED',
          monthlyPayment: this.calculateMonthlyPayment(financingAmount, interestRate, term),
          totalInterest: this.calculateTotalInterest(financingAmount, interestRate, term),
          createdAt: new Date().toISOString(),
        }),
        userId,
        fileSize: 0,
        mimeType: 'application/json',
      },
    });

    await this.walletService.topupWallet(userId, { amount: financingAmount });

    return financing;
  }

  async getDevelopmentFinancing(projectId: string, userId: string) {
    const financing = await this.prisma.document.findFirst({
      where: { 
        fileName: `development-financing-${projectId}`,
        userId,
        type: 'OTHER'
      },
    });

    if (!financing) {
      throw new Error('Development financing not found');
    }

    return {
      ...financing,
      fileUrl: JSON.parse(financing.fileUrl as string),
    };
  }

  private calculateMonthlyPayment(principal: number, annualRate: number, years: number): number {
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = years * 12;
    
    if (monthlyRate === 0) {
      return principal / numberOfPayments;
    }
    
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
           (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  }

  private calculateTotalInterest(principal: number, annualRate: number, years: number): number {
    const monthlyPayment = this.calculateMonthlyPayment(principal, annualRate, years);
    const totalPayments = monthlyPayment * years * 12;
    return totalPayments - principal;
  }
}