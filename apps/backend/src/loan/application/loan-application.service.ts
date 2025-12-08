import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanScoringService, ScoringContext, ScoringResult } from '../scoring/loan-scoring.service';
import { BankStatementService } from '../bank-statement/bank-statement.service';
import { NotificationService } from '../../notification/notification.service';
import { PaymentService } from '../../payment/payment.service';

export interface CreateLoanApplicationDto {
  userId: string;
  amount: number; // In kobo
  purpose: string;
  tenure: number; // In months
  interestRate: number;
  bankAccountId?: string;
  documents?: string[]; // Document IDs
}

export interface LoanApplicationResponse {
  id: string;
  userId: string;
  amount: number;
  purpose: string;
  tenure: number;
  interestRate: number;
  identityScore?: number;
  financialScore?: number;
  behavioralScore?: number;
  repaymentScore?: number;
  finalScore?: number;
  status: string;
  recommendation?: string;
  reasons?: string[];
  approvedAmount?: number;
  approvedTenure?: number;
  approvedInterestRate?: number;
  disbursementDate?: Date;
  repaymentStartDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class LoanApplicationService {
  private readonly logger = new Logger(LoanApplicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringService: LoanScoringService,
    private readonly bankStatementService: BankStatementService,
    private readonly notificationService: NotificationService,
    private readonly paymentService: PaymentService,
  ) {}

  async createApplication(dto: CreateLoanApplicationDto): Promise<LoanApplicationResponse> {
    this.logger.log(`Creating loan application for user ${dto.userId}`);

    try {
      // Validate user exists and is eligible
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
        include: { kyc: true, documents: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user has any pending applications
      const pendingApplications = await this.prisma.loanApplication.count({
        where: { 
          userId: dto.userId, 
          status: { in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'] }
        },
      });

      if (pendingApplications > 0) {
        throw new BadRequestException('User has pending loan applications');
      }

      // Create initial application
      const application = await this.prisma.loanApplication.create({
        data: {
          userId: dto.userId,
          amount: dto.amount,
          purpose: dto.purpose,
          tenure: dto.tenure,
          interestRate: dto.interestRate,
          status: 'PENDING',
        },
      });

      // Process application with AI scoring
      const scoringContext: ScoringContext = {
        userId: dto.userId,
        loanAmount: dto.amount,
        loanPurpose: dto.purpose,
        tenure: dto.tenure,
      };

      let scoringResult: ScoringResult;
      try {
        scoringResult = await this.scoringService.calculateScore(scoringContext);
      } catch (error) {
        this.logger.error(`Error calculating loan score for application ${application.id}:`, error);
        // Continue with manual review if scoring fails
        scoringResult = {
          identityScore: 0,
          financialScore: 0,
          behavioralScore: 0,
          repaymentScore: 0,
          finalScore: 0,
          recommendation: 'REVIEW',
          reasons: ['Scoring system error - manual review required'],
        };
      }

      // Update application with scoring results
      const updatedApplication = await this.prisma.loanApplication.update({
        where: { id: application.id },
        data: {
          identityScore: scoringResult.identityScore,
          financialScore: scoringResult.financialScore,
          behavioralScore: scoringResult.behavioralScore,
          repaymentScore: scoringResult.repaymentScore,
          finalScore: scoringResult.finalScore,
          status: scoringResult.recommendation === 'APPROVE' ? 'APPROVED' : 
                  scoringResult.recommendation === 'REVIEW' ? 'UNDER_REVIEW' : 'REJECTED',
        },
      });

      // Send notification based on recommendation
      await this.sendApplicationNotification(user, updatedApplication, scoringResult);

      this.logger.log(`Loan application ${application.id} created with score ${scoringResult.finalScore} and recommendation ${scoringResult.recommendation}`);

      return this.mapToResponse(updatedApplication, scoringResult.reasons);
    } catch (error) {
      this.logger.error(`Error creating loan application for user ${dto.userId}:`, error);
      throw error;
    }
  }

  async getApplicationById(id: string): Promise<LoanApplicationResponse> {
    const application = await this.prisma.loanApplication.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!application) {
      throw new NotFoundException('Loan application not found');
    }

    return this.mapToResponse(application);
  }

  async getApplicationsByUserId(userId: string): Promise<LoanApplicationResponse[]> {
    const applications = await this.prisma.loanApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return applications.map(app => this.mapToResponse(app));
  }

  async getAllApplications(status?: string, limit?: number, offset?: number): Promise<{
    applications: LoanApplicationResponse[];
    total: number;
  }> {
    const where = status ? { status: status as any } : {};
    
    const [applications, total] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit || 50,
        skip: offset || 0,
        include: { user: true },
      }),
      this.prisma.loanApplication.count({ where }),
    ]);

    return {
      applications: applications.map(app => this.mapToResponse(app)),
      total,
    };
  }

  async updateApplicationStatus(
    id: string, 
    status: string, 
    approvedAmount?: number,
    approvedTenure?: number,
    approvedInterestRate?: number,
    reviewerNotes?: string,
  ): Promise<LoanApplicationResponse> {
    const application = await this.prisma.loanApplication.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!application) {
      throw new NotFoundException('Loan application not found');
    }

    const updateData: any = {
      status,
      reviewerNotes,
      reviewedAt: new Date(),
    };

    if (status === 'APPROVED') {
      updateData.approvedAmount = approvedAmount || application.amount;
      updateData.approvedTenure = approvedTenure || application.tenure;
      updateData.approvedInterestRate = approvedInterestRate || application.interestRate;
      updateData.repaymentStartDate = this.calculateRepaymentStartDate();
    }

    const updatedApplication = await this.prisma.loanApplication.update({
      where: { id },
      data: updateData,
    });

    // Send status update notification
    await this.sendStatusUpdateNotification(application.user, updatedApplication);

    return this.mapToResponse(updatedApplication);
  }

  async disburseLoan(id: string): Promise<LoanApplicationResponse> {
    const application = await this.prisma.loanApplication.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!application) {
      throw new NotFoundException('Loan application not found');
    }

    if (application.status !== 'APPROVED') {
      throw new BadRequestException('Loan application must be approved before disbursement');
    }

    if (application.disbursementDate) {
      throw new BadRequestException('Loan has already been disbursed');
    }

    try {
      // Process disbursement payment
      const disbursementAmount = application.approvedAmount || application.amount;
      const paymentResult = await this.paymentService.disburseLoan(
        application.userId,
        Number(disbursementAmount),
        `Loan disbursement for application ${id}`,
      );

      if (!paymentResult.success) {
        throw new BadRequestException('Disbursement payment failed');
      }

      // Update application with disbursement details
      const updatedApplication = await this.prisma.loanApplication.update({
        where: { id },
        data: {
          status: 'DISBURSED',
          disbursementDate: new Date(),
        },
      });

      // Create repayment schedule
      await this.createRepaymentSchedule(updatedApplication);

      // Send disbursement notification
      await this.sendDisbursementNotification(application.user, updatedApplication);

      this.logger.log(`Loan ${id} disbursed successfully for amount ${disbursementAmount}`);

      return this.mapToResponse(updatedApplication);
    } catch (error) {
      this.logger.error(`Error disbursing loan ${id}:`, error);
      throw error;
    }
  }

  async getRepaymentSchedule(applicationId: string) {
    return this.prisma.loanRepayment.findMany({
      where: { loanApplicationId: applicationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async createRepaymentSchedule(application: any) {
    const loanAmount = application.approvedAmount || application.amount;
    const tenure = application.approvedTenure || application.tenure;
    const interestRate = application.approvedInterestRate || application.interestRate;
    const repaymentStartDate = new Date(application.repaymentStartDate);

    // Calculate monthly payment using simple amortization
    const monthlyInterestRate = interestRate / 100 / 12;
    const monthlyPayment = this.calculateMonthlyPayment(loanAmount, monthlyInterestRate, tenure);

    // Create repayment schedule
    const repayments: any[] = [];
    for (let i = 0; i < tenure; i++) {
      const dueDate = new Date(repaymentStartDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      repayments.push({
        loanApplicationId: application.id,
        userId: application.userId,
        installmentNumber: i + 1,
        amount: monthlyPayment,
        dueDate,
        status: 'PENDING',
      });
    }

    await this.prisma.loanRepayment.createMany({
      data: repayments,
    });
  }

  private calculateMonthlyPayment(principal: number, monthlyRate: number, months: number): number {
    if (monthlyRate === 0) {
      return principal / months;
    }
    
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
           (Math.pow(1 + monthlyRate, months) - 1);
  }

  private calculateRepaymentStartDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + 1); // Start repayment next month
    date.setDate(1); // First of the month
    return date;
  }

  private async sendApplicationNotification(user: any, application: any, scoringResult: ScoringResult) {
    try {
      let message: string;
      const channels = ['email', 'push'];

      switch (scoringResult.recommendation) {
        case 'APPROVE':
          message = `🎉 Congratulations! Your loan application for ₦${(application.amount / 100).toLocaleString()} has been approved. Your loan will be disbursed within 24 hours.`;
          break;
        case 'REVIEW':
          message = `📋 Your loan application for ₦${(application.amount / 100).toLocaleString()} is under manual review. Our team will contact you within 48 hours.`;
          break;
        case 'REJECT':
          message = `❌ We regret to inform you that your loan application for ₦${(application.amount / 100).toLocaleString()} has been declined. Reason: ${scoringResult.reasons.join(', ')}`;
          break;
        default:
          message = `Your loan application for ₦${(application.amount / 100).toLocaleString()} is being processed.`;
      }

      await this.notificationService.sendNotification({
        userId: user.id,
        type: 'LOAN_APPLICATION_UPDATE',
        title: 'Loan Application Status',
        message,
        channels: channels as ('email' | 'sms' | 'push')[],
        metadata: {
          applicationId: application.id,
          amount: application.amount,
          status: application.status,
          score: scoringResult.finalScore,
        },
      });
    } catch (error) {
      this.logger.error(`Error sending application notification:`, error);
    }
  }

  private async sendStatusUpdateNotification(user: any, application: any) {
    try {
      let message: string;

      switch (application.status) {
        case 'APPROVED':
          message = `✅ Your loan application has been approved for ₦${((application.approvedAmount || application.amount) / 100).toLocaleString()}. Ready for disbursement!`;
          break;
        case 'REJECTED':
          message = `❌ Your loan application has been declined. ${application.reviewerNotes || 'Please contact support for more information.'}`;
          break;
        case 'UNDER_REVIEW':
          message = `📋 Your loan application is under manual review. We will update you soon.`;
          break;
        default:
          return;
      }

      await this.notificationService.sendNotification({
        userId: user.id,
        type: 'LOAN_APPLICATION_UPDATE',
        title: 'Loan Application Status Update',
        message,
        channels: ['email', 'push'],
        metadata: {
          applicationId: application.id,
          status: application.status,
        },
      });
    } catch (error) {
      this.logger.error(`Error sending status update notification:`, error);
    }
  }

  private async sendDisbursementNotification(user: any, application: any) {
    try {
      const message = `💰 Your loan of ₦${((application.approvedAmount || application.amount) / 100).toLocaleString()} has been disbursed to your account. First repayment due: ${application.repaymentStartDate.toLocaleDateString()}`;

      await this.notificationService.sendNotification({
        userId: user.id,
        type: 'LOAN_DISBURSEMENT',
        title: 'Loan Disbursed Successfully',
        message,
        channels: ['email', 'push', 'sms'],
        metadata: {
          applicationId: application.id,
          amount: application.approvedAmount || application.amount,
          disbursementDate: application.disbursementDate,
          repaymentStartDate: application.repaymentStartDate,
        },
      });
    } catch (error) {
      this.logger.error(`Error sending disbursement notification:`, error);
    }
  }

  private mapToResponse(application: any, reasons?: string[]): LoanApplicationResponse {
    return {
      id: application.id,
      userId: application.userId,
      amount: application.amount,
      purpose: application.purpose,
      tenure: application.tenure,
      interestRate: application.interestRate,
      identityScore: application.identityScore,
      financialScore: application.financialScore,
      behavioralScore: application.behavioralScore,
      repaymentScore: application.repaymentScore,
      finalScore: application.finalScore,
      status: application.status,
      recommendation: application.recommendation,
      reasons: reasons || application.reasons || [],
      approvedAmount: application.approvedAmount,
      approvedTenure: application.approvedTenure,
      approvedInterestRate: application.approvedInterestRate,
      disbursementDate: application.disbursementDate,
      repaymentStartDate: application.repaymentStartDate,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    };
  }
}