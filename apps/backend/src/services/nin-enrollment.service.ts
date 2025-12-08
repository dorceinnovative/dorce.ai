import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentIntegrationService } from './payment-integration.service';
import { NotificationService } from '../notification/notification.service';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { v4 as uuidv4 } from 'uuid';

(pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;

interface BiometricData {
  fingerprintTemplates: string[]; // Base64 encoded fingerprint templates
  faceImage: string; // Base64 encoded face image
  signature: string; // Base64 encoded signature
}

interface EnrollmentData {
  // Personal Information
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  phoneNumber: string;
  email?: string;
  
  // Address Information
  addressLine: string;
  town: string;
  lga: string;
  state: string;
  
  // Birth Information
  birthState: string;
  birthLGA: string;
  birthCountry: string;
  
  // Additional Information
  religion?: string;
  profession?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinAddress?: string;
  
  // Biometric Data
  biometrics: BiometricData;
}

export interface EnrollmentResponse {
  success: boolean;
  trackingNumber?: string;
  enrollmentNumber?: string;
  message?: string;
  estimatedProcessingTime?: string;
  error?: string;
}

@Injectable()
export class NinEnrollmentService {
  private readonly ENROLLMENT_COST = 50000; // ₦500 for new enrollment
  private readonly MODIFICATION_COST = 25000; // ₦250 for modifications
  private readonly PREMIUM_CARD_COST = 15000; // ₦150 for premium card

  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentIntegrationService,
    private notificationService: NotificationService
  ) {}

  /**
   * Create new NIN enrollment
   */
  async createEnrollment(
    userId: string, 
    enrollmentData: EnrollmentData, 
    paymentMethod: string = 'WALLET'
  ): Promise<EnrollmentResponse> {
    try {
      // Validate user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Check if user already has NIN
      const existingNin = await this.prisma.verification.findFirst({
        where: { 
          userId,
          type: 'NIN',
          status: { in: ['VERIFIED', 'PENDING'] }
        }
      });

      if (existingNin) {
        return { 
          success: false, 
          error: 'You already have an active NIN enrollment. Use modification service instead.' 
        };
      }

      // Process payment
      const enrollmentCost = this.ENROLLMENT_COST;
      
      if (paymentMethod === 'WALLET') {
        if (!user.wallet || user.wallet.balance < enrollmentCost) {
          return { success: false, error: 'Insufficient wallet balance' };
        }

        // Deduct from wallet
        await this.prisma.wallet.update({
          where: { id: user.wallet.id },
          data: { balance: { decrement: enrollmentCost } }
        });

        // Create wallet transaction
        await this.prisma.walletTransaction.create({
          data: {
            walletId: user.wallet.id,
            userId: userId,
            amount: enrollmentCost,
            type: 'PURCHASE',
            status: 'SUCCESS',
            description: 'NIN Enrollment Fee',
            reference: `nin-enroll-${Date.now()}`
          }
        });
      }

      // Generate tracking and enrollment numbers
      const trackingNumber = this.generateTrackingNumber();
      const enrollmentNumber = this.generateEnrollmentNumber();

      // Create verification record for NIN enrollment
      const enrollment = await this.prisma.verification.create({
        data: {
          userId,
          type: 'NIN',
          reference: trackingNumber,
          status: 'PENDING',
          result: {
            enrollmentNumber,
            firstName: enrollmentData.firstName,
            lastName: enrollmentData.lastName,
            middleName: enrollmentData.middleName,
            dateOfBirth: enrollmentData.dateOfBirth,
            gender: enrollmentData.gender,
            phoneNumber: enrollmentData.phoneNumber,
            email: enrollmentData.email || null,
            addressLine: enrollmentData.addressLine,
            town: enrollmentData.town,
            lga: enrollmentData.lga,
            state: enrollmentData.state,
            birthState: enrollmentData.birthState,
            birthLGA: enrollmentData.birthLGA,
            birthCountry: enrollmentData.birthCountry,
            religion: enrollmentData.religion,
            profession: enrollmentData.profession,
            nextOfKinName: enrollmentData.nextOfKinName,
            nextOfKinPhone: enrollmentData.nextOfKinPhone,
            nextOfKinAddress: enrollmentData.nextOfKinAddress,
            fingerprintTemplates: enrollmentData.biometrics.fingerprintTemplates,
            faceImage: enrollmentData.biometrics.faceImage,
            signature: enrollmentData.biometrics.signature,
            cost: enrollmentCost,
            paymentMethod,
            status: 'PENDING_PAYMENT'
          }
        }
      });

      // Send notification
      await this.notificationService.sendNotification({
        userId,
        type: 'NIN_ENROLLMENT_CREATED',
        title: 'NIN Enrollment Initiated',
        message: `Your NIN enrollment has been initiated. Tracking Number: ${trackingNumber}`,
        metadata: {
          enrollmentId: enrollment.id,
          trackingNumber,
          enrollmentNumber
        }
      });

      return {
        success: true,
        trackingNumber,
        enrollmentNumber,
        message: 'Enrollment created successfully. Please proceed with biometric capture.',
        estimatedProcessingTime: '5-7 working days'
      };

    } catch (error) {
      console.error('NIN enrollment error:', error);
      return { success: false, error: 'Failed to create enrollment' };
    }
  }

  /**
   * Submit biometric data for enrollment
   */
  async submitBiometrics(
    userId: string,
    trackingNumber: string,
    biometricData: BiometricData
  ): Promise<EnrollmentResponse> {
    try {
      const enrollment = await this.prisma.verification.findFirst({
        where: { 
          reference: trackingNumber, 
          userId,
          type: 'NIN'
        }
      });

      if (!enrollment) {
        return { success: false, error: 'Enrollment not found' };
      }

      if (enrollment.status !== 'PENDING') {
        return { success: false, error: 'Invalid enrollment status for biometric submission' };
      }

      // Validate biometric data
      if (!biometricData.fingerprintTemplates || biometricData.fingerprintTemplates.length < 10) {
        return { success: false, error: 'All 10 fingerprints are required' };
      }

      if (!biometricData.faceImage) {
        return { success: false, error: 'Face image is required' };
      }

      if (!biometricData.signature) {
        return { success: false, error: 'Signature is required' };
      }

      // Update verification with biometric data
      await this.prisma.verification.update({
        where: { id: enrollment.id },
        data: {
          status: 'PENDING',
          result: {
            ...(enrollment.result as object || {}),
            fingerprintTemplates: biometricData.fingerprintTemplates,
            faceImage: biometricData.faceImage,
            signature: biometricData.signature,
            biometricSubmittedAt: new Date()
          }
        }
      });

      // Send notification
      await this.notificationService.sendNotification({
        userId,
        type: 'NIN_BIOMETRICS_SUBMITTED',
        title: 'Biometrics Submitted',
        message: 'Your biometric data has been submitted successfully. Your enrollment is now being processed.',
        metadata: {
          enrollmentId: enrollment.id,
          trackingNumber
        }
      });

      return {
        success: true,
        trackingNumber,
        message: 'Biometric data submitted successfully',
        estimatedProcessingTime: '5-7 working days'
      };

    } catch (error) {
      console.error('Biometric submission error:', error);
      return { success: false, error: 'Failed to submit biometrics' };
    }
  }

  /**
   * Generate enrollment acknowledgment slip
   */
  async generateEnrollmentSlip(trackingNumber: string, userId: string): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
    try {
      const enrollment = await this.prisma.verification.findFirst({
        where: { 
          reference: trackingNumber, 
          userId,
          type: 'NIN'
        }
      });

      if (!enrollment) {
        return { success: false, error: 'Enrollment not found' };
      }

      // Generate PDF slip
      const pdfBuffer = await this.generateEnrollmentSlipPDF(enrollment);
      
      // Upload to storage
      const pdfUrl = await this.uploadToStorage(pdfBuffer, `enrollment-slip-${trackingNumber}.pdf`);

      // Update verification record with PDF URL
      await this.prisma.verification.update({
        where: { id: enrollment.id },
        data: { 
          result: {
            ...(enrollment.result as object || {}),
            acknowledgmentSlipUrl: pdfUrl
          }
        }
      });

      return { success: true, pdfUrl };

    } catch (error) {
      console.error('Enrollment slip generation error:', error);
      return { success: false, error: 'Failed to generate enrollment slip' };
    }
  }

  /**
   * Complete enrollment (admin function)
   */
  async completeEnrollment(trackingNumber: string, assignedNin: string, adminId: string): Promise<EnrollmentResponse> {
    try {
      const enrollment = await this.prisma.verification.findFirst({
        where: { 
          reference: trackingNumber,
          type: 'NIN'
        }
      });

      if (!enrollment) {
        return { success: false, error: 'Enrollment not found' };
      }

      if (enrollment.status !== 'PENDING') {
        return { success: false, error: 'Enrollment is not in processing status' };
      }

      // Validate assigned NIN
      if (!/^\d{11}$/.test(assignedNin)) {
        return { success: false, error: 'Invalid NIN format' };
      }

      // Update verification with completed NIN
      await this.prisma.verification.update({
        where: { id: enrollment.id },
        data: {
          status: 'VERIFIED',
          result: {
            ...(enrollment.result as object || {}),
            assignedNin,
            completedAt: new Date(),
            completedBy: adminId
          },
          verifiedAt: new Date()
        }
      });

      // Send notification
      await this.notificationService.sendNotification({
        userId: enrollment.userId,
        type: 'NIN_ENROLLMENT_COMPLETED',
        title: 'NIN Enrollment Completed',
        message: `Your NIN enrollment has been completed. Your assigned NIN is ${assignedNin}`,
        metadata: {
          verificationId: enrollment.id,
          trackingNumber,
          assignedNin
        }
      });

      return {
        success: true,
        trackingNumber,
        message: 'Enrollment completed successfully'
      };

    } catch (error) {
      console.error('Enrollment completion error:', error);
      return { success: false, error: 'Failed to complete enrollment' };
    }
  }

  /**
   * Get enrollment status
   */
  async getEnrollmentStatus(trackingNumber: string, userId?: string): Promise<any> {
    try {
      const whereClause: any = { trackingNumber };
      if (userId) {
        whereClause.userId = userId;
      }

      const enrollment = await this.prisma.verification.findFirst({
        where: {
          reference: trackingNumber,
          type: 'NIN',
          ...(userId && { userId })
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        }
      });

      if (!enrollment) {
        return { success: false, error: 'Enrollment not found' };
      }

      const enrollmentData = enrollment.result as any;
      return {
        success: true,
        data: {
          trackingNumber: enrollment.reference,
          enrollmentNumber: enrollmentData?.enrollmentNumber,
          status: enrollment.status,
          firstName: enrollmentData?.firstName,
          lastName: enrollmentData?.lastName,
          middleName: enrollmentData?.middleName,
          assignedNin: enrollmentData?.assignedNin,
          createdAt: enrollment.createdAt,
          estimatedCompletion: this.calculateEstimatedCompletion(enrollment.createdAt),
          acknowledgmentSlipUrl: enrollmentData?.acknowledgmentSlipUrl,
          cost: enrollmentData?.cost,
          paymentMethod: enrollmentData?.paymentMethod
        }
      };

    } catch (error) {
      console.error('Get enrollment status error:', error);
      return { success: false, error: 'Failed to get enrollment status' };
    }
  }

  /**
   * Get user's enrollments
   */
  async getUserEnrollments(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      this.prisma.verification.findMany({
        where: { 
          userId,
          type: 'NIN'
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.verification.count({ 
        where: { 
          userId,
          type: 'NIN'
        }
      })
    ]);

    return {
      data: enrollments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get all enrollments (admin)
   */
  async getAllEnrollments(page: number = 1, limit: number = 50, status?: string) {
    const skip = (page - 1) * limit;
    const whereClause: any = { type: 'NIN' };
    
    if (status) {
      whereClause.status = status;
    }

    const [enrollments, total] = await Promise.all([
      this.prisma.verification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        }
      }),
      this.prisma.verification.count({ where: whereClause })
    ]);

    return {
      data: enrollments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Generate enrollment acknowledgment slip PDF
   */
  private async generateEnrollmentSlipPDF(enrollment: any): Promise<Buffer> {
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          text: 'NIN ENROLLMENT ACKNOWLEDGMENT',
          style: 'header',
          alignment: 'center'
        },
        {
          text: 'Federal Republic of Nigeria - National Identity Management Commission',
          style: 'subheader',
          alignment: 'center'
        },
        { text: ' ', margin: [0, 20] },
        {
          table: {
            widths: ['40%', '60%'],
            body: [
              ['Tracking Number:', enrollment.trackingNumber],
              ['Enrollment Number:', enrollment.enrollmentNumber],
              ['Full Name:', `${enrollment.firstName} ${enrollment.middleName || ''} ${enrollment.lastName}`],
              ['Phone Number:', enrollment.phoneNumber],
              ['Email:', enrollment.email || 'N/A'],
              ['Status:', enrollment.status],
              ['Date of Enrollment:', enrollment.createdAt.toLocaleDateString()],
              ['Estimated Completion:', '5-7 working days']
            ]
          },
          layout: 'noBorders'
        },
        { text: ' ', margin: [0, 30] },
        {
          text: 'Important Information:',
          style: 'subheader'
        },
        {
          text: [
            '1. Keep this acknowledgment slip safe\n',
            '2. Your NIN will be assigned within 5-7 working days\n',
            '3. You will be notified via SMS and email when completed\n',
            '4. Use your tracking number to check status\n',
            '5. Contact support if you have any questions'
          ],
          style: 'info'
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10]
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5]
        },
        info: {
          fontSize: 12,
          margin: [0, 5, 0, 5]
        }
      }
    };

    return new Promise((resolve, reject) => {
      const pdfDoc = pdfMake.createPdf(docDefinition as any);
      
      pdfDoc.getBuffer((buffer: Buffer) => {
        resolve(buffer);
      });
    });
  }

  /**
   * Generate tracking number
   */
  private generateTrackingNumber(): string {
    const prefix = 'NIN';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Generate enrollment number
   */
  private generateEnrollmentNumber(): string {
    const prefix = 'ENRL';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Calculate estimated completion date
   */
  private calculateEstimatedCompletion(createdAt: Date): string {
    const completionDate = new Date(createdAt);
    completionDate.setDate(completionDate.getDate() + 7); // 7 working days
    return completionDate.toLocaleDateString();
  }

  /**
   * Upload to storage (placeholder)
   */
  private async uploadToStorage(buffer: Buffer, fileName: string): Promise<string> {
    // Implement your storage solution
    return `https://storage.dorce.ai/nin-enrollments/${fileName}`;
  }
}