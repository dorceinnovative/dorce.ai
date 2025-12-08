import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, $Enums } from '@prisma/client';
import { AIScoringService } from './ai-scoring.service';
import { NotificationService } from '../notification/notification.service';
import { PaymentIntegrationService } from './payment-integration.service';
import { BankStatementIntegrationService } from './bank-statement-integration.service';
import { addMonths, addDays, isAfter, isBefore } from 'date-fns';

export interface LoanApplicationDto {
  userId: string;
  amount: number; // in kobo
  purpose: string;
  tenure: number; // in months
  interestRate: number;
  employmentStatus?: string;
  monthlyIncome?: number;
  bankStatementId?: string;
  bvn: string;
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorEmail?: string;
  guarantorAddress?: string;
  workAddress?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelationship?: string;
  documents?: LoanDocumentDto[];
}

export interface LoanDocumentDto {
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export enum DocumentType {
  ID_CARD = 'ID_CARD',
  UTILITY_BILL = 'UTILITY_BILL',
  BANK_STATEMENT = 'BANK_STATEMENT',
  EMPLOYMENT_LETTER = 'EMPLOYMENT_LETTER',
  SALARY_SLIP = 'SALARY_SLIP',
  PASSPORT_PHOTO = 'PASSPORT_PHOTO',
  GUARANTOR_ID = 'GUARANTOR_ID',
  BUSINESS_REGISTRATION = 'BUSINESS_REGISTRATION',
  TAX_CLEARANCE = 'TAX_CLEARANCE',
}

export interface LoanReviewDto {
  applicationId: string;
  action: 'APPROVE' | 'REJECT' | 'REQUEST_DOCUMENTS' | 'REQUEST_GUARANTOR' | 'REDUCE_AMOUNT';
  comments?: string;
  reviewedBy: string;
  approvedAmount?: number;
  newInterestRate?: number;
}

export interface LoanRepaymentDto {
  loanApplicationId: string;
  amount: number;
  paymentMethod: 'BANK_TRANSFER' | 'CARD' | 'USSD' | 'WALLET';
  paymentReference?: string;
  transactionId?: string;
}

export interface LoanTopUpDto {
  loanApplicationId: string;
  additionalAmount: number;
  reason: string;
}

export interface LoanRestructureDto {
  loanApplicationId: string;
  newTenure: number;
  newInterestRate?: number;
  reason: string;
}

@Injectable()
export class LoanService {
  private readonly logger = new Logger(LoanService.name);
  private readonly MIN_LOAN_AMOUNT = 500000; // ₦5,000
  private readonly MAX_LOAN_AMOUNT = 50000000; // ₦500,000
  private readonly MIN_TENURE = 1; // 1 month
  private readonly MAX_TENURE = 24; // 24 months
  private readonly MAX_DTI_RATIO = 0.4; // 40% Debt-to-Income ratio
  private readonly MIN_CREDIT_SCORE = 60; // Minimum credit score for approval

  constructor(
    private prisma: PrismaService,
    private aiScoringService: AIScoringService,
    private notificationService: NotificationService,
    private paymentService: PaymentIntegrationService,
    private bankStatementService: BankStatementIntegrationService,
  ) {}

  async createApplication(applicationData: LoanApplicationDto) {
    try {
      // Validate user exists
      const user = await this.prisma.user.findUnique({
        where: { id: applicationData.userId },
        select: { id: true, email: true, phoneNumber: true, firstName: true, lastName: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Validate loan amount and tenure
      this.validateLoanParameters(applicationData);

      // Check for existing active loans or pending applications
      const existingActiveOrPending = await this.prisma.loanApplication.count({
        where: {
          userId: applicationData.userId,
          status: { in: [$Enums.LoanStatus.PENDING, $Enums.LoanStatus.APPROVED, $Enums.LoanStatus.DISBURSED] },
        },
      });
      if (existingActiveOrPending > 0) {
        throw new BadRequestException('You already have an active loan or pending application');
      }

      // Check creditworthiness using AI scoring
      const creditScore = await this.calculateCreditScore(applicationData, user);
      
      if (creditScore.finalScore < this.MIN_CREDIT_SCORE) {
        throw new BadRequestException(
          `Your credit score (${creditScore.finalScore}) is below the minimum requirement (${this.MIN_CREDIT_SCORE})`
        );
      }

      // Validate debt-to-income ratio
      if (applicationData.monthlyIncome) {
        const monthlyPayment = this.calculateMonthlyPayment(
          applicationData.amount,
          applicationData.tenure,
          applicationData.interestRate
        );
        const dtiRatio = monthlyPayment / applicationData.monthlyIncome;
        
        if (dtiRatio > this.MAX_DTI_RATIO) {
          throw new BadRequestException(
            `Your debt-to-income ratio (${(dtiRatio * 100).toFixed(1)}%) exceeds the maximum allowed (${this.MAX_DTI_RATIO * 100}%)`
          );
        }
      }

      // Process documents if provided (handled separately)

      // Create loan application
      const application = await this.prisma.loanApplication.create({
        data: {
          userId: applicationData.userId,
          amount: BigInt(applicationData.amount),
          purpose: applicationData.purpose,
          tenure: applicationData.tenure,
          interestRate: applicationData.interestRate,
          status: $Enums.LoanStatus.PENDING,
          identityScore: creditScore.identityScore,
          financialScore: creditScore.financialScore,
          behavioralScore: creditScore.behavioralScore,
          repaymentScore: creditScore.repaymentScore,
          finalScore: creditScore.finalScore,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phoneNumber: true,
              firstName: true,
              lastName: true,
            },
          },
          repayments: true,
        },
      });

      // Send notification
    await this.notificationService.sendNotification({
      userId: applicationData.userId,
      type: 'LOAN_APPLICATION_UPDATE',
      title: 'Loan Application Submitted',
      message: `Your loan application for ₦${(applicationData.amount / 100).toLocaleString()} has been submitted successfully.`,
      channels: ['email', 'push'],
      metadata: {
        applicationId: application.id,
        amount: applicationData.amount,
        creditScore: creditScore.finalScore,
      },
    });

      this.logger.log(`Loan application created for user ${applicationData.userId} with amount ₦${(applicationData.amount / 100).toLocaleString()}`);

      return application;
    } catch (error) {
      this.logger.error(`Error creating loan application: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private validateLoanParameters(applicationData: LoanApplicationDto): void {
    if (applicationData.amount < this.MIN_LOAN_AMOUNT) {
      throw new BadRequestException(
        `Loan amount must be at least ₦${(this.MIN_LOAN_AMOUNT / 100).toLocaleString()}`
      );
    }

    if (applicationData.amount > this.MAX_LOAN_AMOUNT) {
      throw new BadRequestException(
        `Loan amount cannot exceed ₦${(this.MAX_LOAN_AMOUNT / 100).toLocaleString()}`
      );
    }

    if (applicationData.tenure < this.MIN_TENURE || applicationData.tenure > this.MAX_TENURE) {
      throw new BadRequestException(
        `Loan tenure must be between ${this.MIN_TENURE} and ${this.MAX_TENURE} months`
      );
    }

    if (applicationData.interestRate < 0 || applicationData.interestRate > 100) {
      throw new BadRequestException('Interest rate must be between 0 and 100');
    }
  }

  private async calculateCreditScore(applicationData: LoanApplicationDto, user: any): Promise<any> {
    try {
      let bankStatementAnalysis: any = null;
      if (applicationData.bankStatementId) {
        bankStatementAnalysis = await this.bankStatementService.analyzeBankStatement(applicationData.userId, applicationData.bankStatementId);
      }

      const aiScores = await this.aiScoringService.calculateScores({
        userId: applicationData.userId,
        loanAmount: applicationData.amount,
        loanTenure: applicationData.tenure,
        bvn: applicationData.bvn,
        bankStatementId: applicationData.bankStatementId,
        employmentStatus: applicationData.employmentStatus,
        monthlyIncome: applicationData.monthlyIncome,
      });

      return aiScores;
    } catch (error) {
      this.logger.error(`Error calculating credit score: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to calculate credit score');
    }
  }

  private calculateMonthlyPayment(principal: number, tenure: number, interestRate: number): number {
    const monthlyInterestRate = interestRate / 100 / 12;
    const monthlyPayment = (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, tenure)) /
      (Math.pow(1 + monthlyInterestRate, tenure) - 1);
    return Math.round(monthlyPayment);
  }

  private async processDocuments(documents: LoanDocumentDto[]): Promise<any[]> {
    const requiredDocuments = [DocumentType.ID_CARD, DocumentType.UTILITY_BILL];
    const uploadedDocumentTypes = documents.map(d => d.type);
    
    const missingDocuments = requiredDocuments.filter(doc => !uploadedDocumentTypes.includes(doc));
    
    if (missingDocuments.length > 0) {
      throw new BadRequestException(`Missing required documents: ${missingDocuments.join(', ')}`);
    }

    return documents.map(doc => ({
      type: doc.type,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      status: 'PENDING',
      uploadedAt: new Date(),
    }));
  }

  async reviewApplication(reviewData: LoanReviewDto) {
    try {
      const application = await this.prisma.loanApplication.findUnique({
        where: { id: reviewData.applicationId },
        include: {
          user: true,
          documents: true,
        },
      });

      if (!application) {
        throw new NotFoundException('Loan application not found');
      }

      if (application.status !== 'PENDING') {
        throw new BadRequestException('Application has already been reviewed');
      }

      let updatedApplication;

      switch (reviewData.action) {
        case 'APPROVE':
          updatedApplication = await this.approveApplication(application, reviewData);
          break;
        case 'REJECT':
          updatedApplication = await this.rejectApplication(application, reviewData);
          break;
        case 'REQUEST_DOCUMENTS':
          updatedApplication = await this.requestDocuments(application, reviewData);
          break;
        case 'REQUEST_GUARANTOR':
          updatedApplication = await this.requestGuarantor(application, reviewData);
          break;
        case 'REDUCE_AMOUNT':
          updatedApplication = await this.reduceAmount(application, reviewData);
          break;
        default:
          throw new BadRequestException('Invalid review action');
      }

      // No extra fields to update beyond status changes handled in actions

      return updatedApplication;
    } catch (error) {
      this.logger.error(`Error reviewing loan application: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async approveApplication(application: any, reviewData: LoanReviewDto) {
    const approvedAmount = reviewData.approvedAmount || application.amount;
    const interestRate = reviewData.newInterestRate || application.interestRate;

    const updatedApplication = await this.prisma.loanApplication.update({
      where: { id: application.id },
      data: {
        status: $Enums.LoanStatus.APPROVED,
        approvedAmount: approvedAmount,
        interestRate: interestRate,
      },
    });

    // Create repayment schedule
    const repaymentSchedule = this.generateRepaymentSchedule(
      Number(approvedAmount),
      application.tenure,
      interestRate,
    );

    await this.prisma.repaymentSchedule.createMany({
      data: repaymentSchedule.map((schedule, index) => ({
        loanApplicationId: application.id,
        installmentNumber: index + 1,
        dueDate: schedule.dueDate,
        principalAmount: BigInt(schedule.principal),
        interestAmount: BigInt(schedule.interest),
        totalAmount: BigInt(schedule.totalAmount),
        paidAmount: BigInt(0),
        status: 'PENDING',
      })),
    });

    // Send approval notification
    await this.notificationService.sendNotification({
      userId: application.userId,
      type: 'LOAN_APPLICATION_UPDATE',
      title: 'Loan Application Approved',
      message: `Congratulations! Your loan application has been approved for ₦${(Number(approvedAmount) / 100).toLocaleString()}.`,
      channels: ['email', 'push', 'sms'],
      metadata: {
        applicationId: application.id,
        approvedAmount: Number(approvedAmount),
        tenure: application.tenure,
        monthlyPayment: repaymentSchedule[0].amount,
      },
    });

    this.logger.log(`Loan application ${application.id} approved for ₦${(Number(approvedAmount) / 100).toLocaleString()}`);

    return updatedApplication;
  }

  private async rejectApplication(application: any, reviewData: LoanReviewDto) {
    const updatedApplication = await this.prisma.loanApplication.update({
        where: { id: application.id },
        data: {
          status: $Enums.LoanStatus.REJECTED,
          rejectionReason: reviewData.comments || null,
        },
      });

    // Send rejection notification
    await this.notificationService.sendNotification({
      userId: application.userId,
      type: 'LOAN_APPLICATION_UPDATE',
      title: 'Loan Application Rejected',
      message: 'We regret to inform you that your loan application has been rejected.',
      channels: ['email', 'push'],
      metadata: {
        applicationId: application.id,
        reason: reviewData.comments,
      },
    });

    this.logger.log(`Loan application ${application.id} rejected: ${reviewData.comments}`);

    return updatedApplication;
  }

  private async requestDocuments(application: any, reviewData: LoanReviewDto) {
    const updatedApplication = await this.prisma.loanApplication.update({
      where: { id: application.id },
      data: {
        status: $Enums.LoanStatus.UNDER_REVIEW,
      },
    });

    // Send document request notification
    await this.notificationService.sendNotification({
      userId: application.userId,
      type: 'LOAN_APPLICATION_UPDATE',
      title: 'Additional Documents Required',
      message: 'Please provide additional documents to complete your loan application review.',
      channels: ['email', 'push'],
      metadata: {
        applicationId: application.id,
        requiredDocuments: reviewData.comments,
      },
    });

    return updatedApplication;
  }

  private async requestGuarantor(application: any, reviewData: LoanReviewDto) {
    const updatedApplication = await this.prisma.loanApplication.update({
      where: { id: application.id },
      data: {
        status: $Enums.LoanStatus.UNDER_REVIEW,
      },
    });

    // Send guarantor request notification
    await this.notificationService.sendNotification({
      userId: application.userId,
      type: 'LOAN_APPLICATION_UPDATE',
      title: 'Guarantor Required',
      message: 'Please provide a suitable guarantor to complete your loan application.',
      channels: ['email', 'push'],
      metadata: {
        applicationId: application.id,
        guarantorRequirements: reviewData.comments,
      },
    });

    return updatedApplication;
  }

  private async reduceAmount(application: any, reviewData: LoanReviewDto) {
    if (!reviewData.approvedAmount) {
      throw new BadRequestException('Approved amount is required for amount reduction');
    }

    const updatedApplication = await this.prisma.loanApplication.update({
      where: { id: application.id },
      data: {
        status: $Enums.LoanStatus.UNDER_REVIEW,
        approvedAmount: reviewData.approvedAmount,
        interestRate: reviewData.newInterestRate || application.interestRate,
      },
    });

    // Send amount reduction notification
    await this.notificationService.sendNotification({
      userId: application.userId,
      type: 'LOAN_AMOUNT_REDUCED',
      title: 'Loan Amount Reduced',
      message: `Your loan amount has been reduced to ₦${(reviewData.approvedAmount / 100).toLocaleString()}. Please accept to proceed.`,
      channels: ['email', 'sms'],
      metadata: {
        applicationId: application.id,
        originalAmount: application.amount,
        newAmount: reviewData.approvedAmount,
      },
    });

    return updatedApplication;
  }

  private generateRepaymentSchedule(principal: number, tenure: number, interestRate: number): { amount: number; principal: number; interest: number; dueDate: Date; totalAmount: number }[] {
    const monthlyInterestRate = interestRate / 100 / 12;
    const monthlyPayment = (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, tenure)) /
      (Math.pow(1 + monthlyInterestRate, tenure) - 1);

    const schedule: { amount: number; principal: number; interest: number; dueDate: Date; totalAmount: number }[] = [];
    let remainingPrincipal = principal;

    for (let i = 1; i <= tenure; i++) {
      const interestPayment = remainingPrincipal * monthlyInterestRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingPrincipal -= principalPayment;

      schedule.push({
        amount: Math.round(monthlyPayment),
        principal: Math.round(principalPayment),
        interest: Math.round(interestPayment),
        dueDate: addMonths(new Date(), i),
        totalAmount: Math.round(monthlyPayment),
      });
    }

    return schedule;
  }

  async processRepayment(repaymentData: LoanRepaymentDto) {
    try {
      const loan = await this.prisma.loanApplication.findUnique({
        where: { id: repaymentData.loanApplicationId },
        include: {
          repayments: {
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'asc' },
          },
          user: {
            select: { email: true, id: true }
          },
        },
      });

      if (!loan) {
        throw new NotFoundException('Loan not found');
      }

      if (loan.status !== 'DISBURSED' && loan.status !== 'APPROVED') {
        throw new BadRequestException('Loan is not active');
      }

      if (loan.repayments.length === 0) {
        throw new BadRequestException('No pending repayments found');
      }

      // Process payment through payment service
      const paymentResult = await this.paymentService.initializePayment({
        amount: repaymentData.amount,
        email: loan.user.email,
        reference: `loan_repay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        callbackUrl: `${process.env.APP_URL}/loan/repayment/callback`,
        provider: 'paystack', // Default provider
      });

      // Create repayment record
      const repayment = await this.prisma.loanRepayment.create({
        data: {
          loanApplicationId: repaymentData.loanApplicationId,
          userId: loan.userId,
          amount: repaymentData.amount,
          principalAmount: BigInt(Math.round(repaymentData.amount * 0.8)), // 80% principal
          interestAmount: BigInt(Math.round(repaymentData.amount * 0.2)), // 20% interest
          totalAmount: BigInt(repaymentData.amount),
          status: 'PENDING',
          paymentMethod: 'paystack',
          paymentReference: repaymentData.paymentReference || paymentResult.reference,
        },
      });

      return {
        repayment,
        paymentAuthorization: paymentResult,
      };
    } catch (error) {
      this.logger.error(`Error processing repayment: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async topUpLoan(topUpData: LoanTopUpDto) {
    try {
      const existingLoan = await this.prisma.loanApplication.findUnique({
        where: { id: topUpData.loanApplicationId },
        include: {
          repayments: {
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!existingLoan) {
        throw new NotFoundException('Loan not found');
      }

      if (existingLoan.status !== 'DISBURSED') {
        throw new BadRequestException('Only active loans can be topped up');
      }

      // Validate top-up amount
      if (topUpData.additionalAmount < 100000) { // ₦1,000 minimum
        throw new BadRequestException('Top-up amount must be at least ₦1,000');
      }

      // Calculate new loan amount and create new repayment schedule
      const newTotalAmount = Number(existingLoan.amount) + topUpData.additionalAmount;
      const remainingTenure = existingLoan.repayments.length;
      
      // Create new repayment schedule
      const newRepaymentSchedule = this.generateRepaymentSchedule(
        newTotalAmount,
        remainingTenure,
        existingLoan.interestRate,
      );

      // Update existing repayments
      for (let i = 0; i < existingLoan.repayments.length; i++) {
        await this.prisma.loanRepayment.update({
          where: { id: existingLoan.repayments[i].id },
          data: {
            amount: BigInt(newRepaymentSchedule[i].amount),
            principalAmount: BigInt(newRepaymentSchedule[i].principal),
            interestAmount: BigInt(newRepaymentSchedule[i].interest),
          },
        });
      }

      // Update loan amount
      const updatedLoan = await this.prisma.loanApplication.update({
        where: { id: topUpData.loanApplicationId },
        data: {
          amount: BigInt(newTotalAmount),
          topUpAmount: BigInt(topUpData.additionalAmount),
        },
      });

      // Send notification
      await this.notificationService.sendNotification({
        userId: existingLoan.userId,
        type: 'LOAN_TOP_UP_SUCCESSFUL',
        title: 'Loan Top-Up Successful',
        message: `Your loan has been topped up by ₦${(topUpData.additionalAmount / 100).toLocaleString()}. New total: ₦${(newTotalAmount / 100).toLocaleString()}.`,
        channels: ['email', 'sms'],
        metadata: {
          loanId: existingLoan.id,
          additionalAmount: topUpData.additionalAmount,
          newTotalAmount: newTotalAmount,
        },
      });

      return updatedLoan;
    } catch (error) {
      this.logger.error(`Error topping up loan: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async restructureLoan(restructureData: LoanRestructureDto) {
    try {
      const existingLoan = await this.prisma.loanApplication.findUnique({
        where: { id: restructureData.loanApplicationId },
        include: {
          repayments: {
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!existingLoan) {
        throw new NotFoundException('Loan not found');
      }

      if (existingLoan.status !== 'DISBURSED') {
        throw new BadRequestException('Only active loans can be restructured');
      }

      // Calculate remaining principal
      const remainingPrincipal = existingLoan.repayments.reduce((sum, repayment) => {
        return sum + Number(repayment.principalAmount);
      }, 0);

      // Create new repayment schedule
      const newRepaymentSchedule = this.generateRepaymentSchedule(
        remainingPrincipal,
        restructureData.newTenure,
        restructureData.newInterestRate || existingLoan.interestRate,
      );

      // Delete existing pending repayments
      await this.prisma.loanRepayment.deleteMany({
        where: {
          loanApplicationId: restructureData.loanApplicationId,
          status: 'PENDING',
        },
      });

      // Create new repayment schedule
      await this.prisma.repaymentSchedule.createMany({
        data: newRepaymentSchedule.map((schedule, index) => ({
          loanApplicationId: restructureData.loanApplicationId,
          installmentNumber: index + 1,
          dueDate: schedule.dueDate,
          principalAmount: BigInt(schedule.principal),
          interestAmount: BigInt(schedule.interest),
          totalAmount: BigInt(schedule.totalAmount),
          paidAmount: BigInt(0),
          status: 'PENDING',
        })),
      });

      // Update loan details
      const updatedLoan = await this.prisma.loanApplication.update({
        where: { id: restructureData.loanApplicationId },
        data: {
          tenure: restructureData.newTenure,
          interestRate: restructureData.newInterestRate || existingLoan.interestRate,
          restructuredAt: new Date(),
        },
      });

      // Send notification
      await this.notificationService.sendNotification({
        userId: existingLoan.userId,
        type: 'LOAN_RESTRUCTURED',
        title: 'Loan Restructured',
        message: `Your loan has been restructured to ${restructureData.newTenure} months with a new monthly payment of ₦${newRepaymentSchedule[0].amount.toLocaleString()}.`,
        channels: ['email', 'sms'],
        metadata: {
          loanId: existingLoan.id,
          newTenure: restructureData.newTenure,
          newMonthlyPayment: newRepaymentSchedule[0].amount,
        },
      });

      return updatedLoan;
    } catch (error) {
      this.logger.error(`Error restructuring loan: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getApplicationById(id: string) {
    const application = await this.prisma.loanApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        repayments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Loan application not found');
    }

    return application;
  }

  async getUserApplications(userId: string) {
    return this.prisma.loanApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        repayments: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
        documents: true,
      },
    });
  }

  async getAllApplications(filters?: {
    status?: string;
    userId?: string;
    fromDate?: Date;
    toDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    creditScoreMin?: number;
    creditScoreMax?: number;
  }) {
    const where: Prisma.LoanApplicationWhereInput = {};

    if (filters?.status) {
      where.status = filters.status as any; // Type assertion to handle enum
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        where.createdAt.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.createdAt.lte = filters.toDate;
      }
    }

    if (filters?.minAmount || filters?.maxAmount) {
      where.amount = {};
      if (filters.minAmount) {
        where.amount.gte = filters.minAmount;
      }
      if (filters.maxAmount) {
        where.amount.lte = filters.maxAmount;
      }
    }

    if (filters?.creditScoreMin || filters?.creditScoreMax) {
      where.finalScore = {};
      if (filters.creditScoreMin) {
        where.finalScore.gte = filters.creditScoreMin;
      }
      if (filters.creditScoreMax) {
        where.finalScore.lte = filters.creditScoreMax;
      }
    }

    return this.prisma.loanApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        repayments: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
  }

  async getLoanAnalytics() {
    try {
      const [
        totalApplications,
        approvedApplications,
        rejectedApplications,
        totalLoanAmount,
        totalRepayments,
        pendingRepayments,
        overdueRepayments,
      ] = await Promise.all([
        this.prisma.loanApplication.count(),
        this.prisma.loanApplication.count({ where: { status: 'APPROVED' } }),
        this.prisma.loanApplication.count({ where: { status: 'REJECTED' } }),
        this.prisma.loanApplication.aggregate({
          where: { status: 'APPROVED' },
          _sum: { amount: true },
        }),
        this.prisma.loanRepayment.aggregate({
          where: { status: 'PAID' },
          _sum: { amount: true },
        }),
        this.prisma.loanRepayment.count({ where: { status: 'PENDING' } }),
        this.prisma.loanRepayment.count({
          where: {
            status: 'PENDING',
            createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Overdue if older than 30 days
          },
        }),
      ]);

      const approvalRate = totalApplications > 0 ? (approvedApplications / totalApplications) * 100 : 0;
      const rejectionRate = totalApplications > 0 ? (rejectedApplications / totalApplications) * 100 : 0;
      const recoveryRate = totalRepayments._sum.amount && totalLoanAmount._sum.amount && Number(totalRepayments._sum.amount) > 0 
        ? (Number(totalRepayments._sum.amount) / Number(totalLoanAmount._sum.amount)) * 100 
        : 0;

      return {
        totalApplications,
        approvedApplications,
        rejectedApplications,
        approvalRate: approvalRate.toFixed(2),
        rejectionRate: rejectionRate.toFixed(2),
        totalLoanAmount: totalLoanAmount._sum.amount || 0,
        totalRepayments: totalRepayments._sum.amount || 0,
        recoveryRate: recoveryRate.toFixed(2),
        pendingRepayments,
        overdueRepayments,
      };
    } catch (error) {
      this.logger.error(`Error getting loan analytics: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getOverdueLoans() {
    try {
      return await this.prisma.loanRepayment.findMany({
        where: {
          status: 'PENDING',
          createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Overdue if older than 30 days
        },
        include: {
          loanApplication: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  phoneNumber: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Error getting overdue loans: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async sendRepaymentReminder(loanId: string) {
    try {
      const loan = await this.prisma.loanApplication.findUnique({
        where: { id: loanId },
        include: {
          repayments: {
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
          user: {
            select: {
              id: true,
              email: true,
              phoneNumber: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!loan || loan.repayments.length === 0) {
        throw new NotFoundException('No pending repayments found');
      }

      const nextRepayment = loan.repayments[0];
      const daysUntilDue = Math.ceil((nextRepayment.createdAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      await this.notificationService.sendNotification({
        userId: loan.userId,
        type: 'REPAYMENT_REMINDER',
        title: 'Loan Repayment Reminder',
        message: `Your loan repayment of ₦${Number(nextRepayment.amount).toLocaleString()} is upcoming in ${daysUntilDue} days.`,
        channels: ['email', 'sms'],
        metadata: {
          loanId: loan.id,
          repaymentId: nextRepayment.id,
          amount: Number(nextRepayment.amount),
          dueDate: nextRepayment.createdAt,
          daysUntilDue,
        },
      });

      this.logger.log(`Repayment reminder sent for loan ${loanId}`);

      return { success: true, message: 'Repayment reminder sent successfully' };
    } catch (error) {
      this.logger.error(`Error sending repayment reminder: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
