import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentIntegrationService } from './payment-integration.service';
import { NotificationService } from '../notification/notification.service';
import axios from 'axios';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// Setup pdfMake fonts
(pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;

export interface NinVerificationResponse {
  success: boolean;
  data?: {
    nin: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    email?: string;
    address: {
      town: string;
      lga: string;
      state: string;
      addressLine: string;
    };
    photo: string; // Base64 encoded image
    signature?: string; // Base64 encoded signature
    birthState: string;
    birthLGA: string;
    birthCountry: string;
    religion?: string;
    nextOfKinState?: string;
  };
  error?: string;
}

interface PremiumSlipData {
  nin: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  address: string;
  photo: string;
  signature?: string;
  issueDate: string;
  expiryDate: string;
  qrCode: string;
}

@Injectable()
export class NinVerificationService {
  private readonly VERIFYME_API_URL = 'https://vapi.verifyme.ng/v1/verifications/identities';
  private readonly YOUVERIFY_API_URL = 'https://api.youverify.co/v2/api/identity/ng';
  private readonly KORAPAY_API_URL = 'https://api.korapay.com/merchant/api/v1/identities/ng/nin';
  
  // Cost per verification (in kobo)
  private readonly VERIFICATION_COST = 15000; // ₦150
  private readonly PREMIUM_SLIP_COST = 5000; // ₦50 additional for premium slip

  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentIntegrationService,
    private notificationService: NotificationService
  ) {}

  /**
   * Verify NIN using multiple providers (fallback system)
   */
  async verifyNin(nin: string, userId: string, paymentMethod: string = 'WALLET'): Promise<NinVerificationResponse> {
    try {
      // Check if user has sufficient balance
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Check if NIN was already verified recently (cache for 24 hours)
      const existingVerification = await this.prisma.verification.findFirst({
        where: {
          reference: nin,
          type: 'NIN',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          status: 'VERIFIED'
        }
      });

      if (existingVerification) {
        return {
          success: true,
          data: existingVerification.result as any
        };
      }

      // Deduct verification cost from user wallet
      const totalCost = this.VERIFICATION_COST;
      
      if (paymentMethod === 'WALLET') {
        if (!user.wallet || user.wallet.balance < totalCost) {
          return { success: false, error: 'Insufficient wallet balance' };
        }

        // Deduct from wallet
        await this.prisma.wallet.update({
          where: { id: user.wallet.id },
          data: { balance: { decrement: totalCost } }
        });

        // Create wallet transaction
        await this.prisma.walletTransaction.create({
          data: {
            walletId: user.wallet.id,
            userId: userId,
            amount: totalCost,
            type: 'PURCHASE',
            status: 'SUCCESS',
            description: `NIN Verification - ${nin}`,
            reference: `nin-verify-${Date.now()}`
          }
        });
      }

      // Try verification with multiple providers
      let verificationResult = await this.verifyWithVerifyMe(nin);
      
      if (!verificationResult.success) {
        verificationResult = await this.verifyWithYouVerify(nin);
      }
      
      if (!verificationResult.success) {
        verificationResult = await this.verifyWithKoraPay(nin);
      }

      // Save verification result
      await this.prisma.verification.create({
        data: {
          userId,
          type: 'NIN',
          reference: nin,
          status: verificationResult.success ? 'VERIFIED' : 'FAILED',
          result: verificationResult.success ? verificationResult.data : { error: verificationResult.error },
          provider: verificationResult.success ? 'MULTI_PROVIDER' : 'FAILED'
        }
      });

      if (verificationResult.success) {
        // Send notification
        await this.notificationService.sendNotification({
          userId,
          type: 'GENERAL',
          title: 'NIN Verification Successful',
          message: `Your NIN ${nin} has been successfully verified.`,
          metadata: { nin }
        });
      }

      return verificationResult;
    } catch (error) {
      console.error('NIN verification error:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Generate premium NIN slip PDF
   */
  async generatePremiumSlip(nin: string, userId: string): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
    try {
      // Get NIN data
      const verification = await this.prisma.verification.findFirst({
        where: { reference: nin, userId, status: 'VERIFIED', type: 'NIN' },
        orderBy: { createdAt: 'desc' }
      });

      if (!verification) {
        return { success: false, error: 'NIN not verified. Please verify NIN first.' };
      }

      const ninData = JSON.parse(verification.result as string);

      // Generate premium slip data
      const slipData: PremiumSlipData = {
        nin: ninData.nin,
        fullName: `${ninData.firstName} ${ninData.middleName || ''} ${ninData.lastName}`.trim(),
        dateOfBirth: ninData.dateOfBirth,
        gender: ninData.gender,
        phone: ninData.phone,
        email: ninData.email || 'N/A',
        address: `${ninData.address.addressLine}, ${ninData.address.town}, ${ninData.address.lga}, ${ninData.address.state}`,
        photo: ninData.photo,
        signature: ninData.signature || '',
        issueDate: new Date().toLocaleDateString(),
        expiryDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 10 years
        qrCode: this.generateQRCode(ninData.nin)
      };

      // Generate PDF
      const pdfBuffer = await this.generatePremiumSlipPDF(slipData);

      // Upload to storage (implement your storage solution)
      const pdfUrl = await this.uploadToStorage(pdfBuffer, `premium-slip-${nin}-${Date.now()}.pdf`);

      // Save slip generation record
      await this.prisma.document.create({
        data: {
          userId,
          type: 'OTHER',
          fileName: `NIN Premium Slip - ${nin}.pdf`,
          fileUrl: pdfUrl,
          fileSize: pdfBuffer.length,
          mimeType: 'application/pdf',
          status: 'VERIFIED',
          verifiedAt: new Date(),
          verificationResult: {
            nin,
            slipType: 'PREMIUM',
            cost: this.PREMIUM_SLIP_COST,
            issueDate: new Date()
          }
        }
      });

      return { success: true, pdfUrl };
    } catch (error) {
      console.error('Premium slip generation error:', error);
      return { success: false, error: 'Failed to generate premium slip' };
    }
  }

  /**
   * Verify with VerifyMe API
   */
  private async verifyWithVerifyMe(nin: string): Promise<NinVerificationResponse> {
    try {
      const response = await axios.post(
        `${this.VERIFYME_API_URL}/nin/${nin}`,
        {
          firstname: 'Test', // Required but not validated in basic verification
          lastname: 'User'   // Required but not validated in basic verification
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.VERIFYME_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        return {
          success: true,
          data: {
            nin: response.data.data.nin,
            firstName: response.data.data.firstname,
            lastName: response.data.data.lastname,
            middleName: response.data.data.middlename,
            dateOfBirth: response.data.data.birthdate,
            gender: response.data.data.gender,
            phone: response.data.data.phone,
            photo: response.data.data.photo,
            address: {
              town: 'Unknown',
              lga: 'Unknown',
              state: 'Unknown',
              addressLine: 'Unknown'
            },
            birthState: 'Unknown',
            birthLGA: 'Unknown',
            birthCountry: 'Nigeria'
          }
        };
      }
    } catch (error) {
      console.error('VerifyMe API error:', error);
    }

    return { success: false, error: 'VerifyMe verification failed' };
  }

  /**
   * Verify with YouVerify API
   */
  private async verifyWithYouVerify(nin: string): Promise<NinVerificationResponse> {
    try {
      const response = await axios.post(
        `${this.YOUVERIFY_API_URL}/nin`,
        {
          id: nin,
          premiumNin: true,
          isSubjectConsent: true
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.YOUVERIFY_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const data = response.data.data;
        return {
          success: true,
          data: {
            nin: data.idNumber,
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            phone: data.mobile,
            email: data.email,
            photo: data.image,
            signature: data.signature,
            address: data.address,
            birthState: data.birthState,
            birthLGA: data.birthLGA,
            birthCountry: data.birthCountry,
            religion: data.religion,
            nextOfKinState: data.nokState
          }
        };
      }
    } catch (error) {
      console.error('YouVerify API error:', error);
    }

    return { success: false, error: 'YouVerify verification failed' };
  }

  /**
   * Verify with KoraPay API
   */
  private async verifyWithKoraPay(nin: string): Promise<NinVerificationResponse> {
    try {
      const response = await axios.post(
        this.KORAPAY_API_URL,
        {
          identity: nin,
          identity_type: 'nin'
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.KORAPAY_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === true) {
        const data = response.data.data;
        return {
          success: true,
          data: {
            nin: data.id,
            firstName: data.first_name,
            lastName: data.last_name,
            middleName: data.middle_name,
            dateOfBirth: data.date_of_birth,
            gender: data.gender,
            phone: data.phone_number,
            email: data.email,
            photo: data.image,
            address: data.address,
            birthState: data.birth_state,
            birthLGA: data.birth_lga,
            birthCountry: data.birth_country
          }
        };
      }
    } catch (error) {
      console.error('KoraPay API error:', error);
    }

    return { success: false, error: 'KoraPay verification failed' };
  }

  /**
   * Generate premium slip PDF
   */
  private async generatePremiumSlipPDF(data: PremiumSlipData): Promise<Buffer> {
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          columns: [
            {
              width: 100,
              image: data.photo,
              fit: [100, 100],
              alignment: 'left'
            },
            {
              width: '*',
              text: 'FEDERAL REPUBLIC OF NIGERIA\nNATIONAL IDENTITY CARD\nPREMIUM SLIP',
              style: 'header',
              alignment: 'center'
            },
            {
              width: 100,
              qr: data.qrCode,
              fit: [100, 100],
              alignment: 'right'
            }
          ],
          columnGap: 20
        },
        { text: ' ', margin: [0, 20] },
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              ['National Identity Number (NIN):', data.nin],
              ['Full Name:', data.fullName],
              ['Date of Birth:', data.dateOfBirth],
              ['Gender:', data.gender],
              ['Phone Number:', data.phone],
              ['Email:', data.email],
              ['Address:', data.address]
            ]
          },
          layout: 'noBorders'
        },
        { text: ' ', margin: [0, 20] },
        {
          text: 'Card Details',
          style: 'subheader'
        },
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              ['Issue Date:', data.issueDate],
              ['Expiry Date:', data.expiryDate],
              ['Card Type:', 'Premium National ID Slip']
            ]
          },
          layout: 'noBorders'
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
   * Generate QR code for NIN
   */
  private generateQRCode(nin: string): string {
    // Simple QR code generation - in production, use a proper QR code library
    return `NIN:${nin}|VERIFIED|${new Date().toISOString()}`;
  }

  /**
   * Upload to storage (placeholder - implement your storage solution)
   */
  private async uploadToStorage(buffer: Buffer, fileName: string): Promise<string> {
    // Implement your storage solution (AWS S3, Google Cloud Storage, etc.)
    // For now, return a placeholder URL
    return `https://storage.dorce.ai/nin-slips/${fileName}`;
  }

  /**
   * Get verification history for user
   */
  async getVerificationHistory(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [verifications, total] = await Promise.all([
      this.prisma.verification.findMany({
        where: { 
          userId,
          type: 'NIN'
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.verification.count({ where: { 
        userId,
        type: 'NIN'
      } })
    ]);

    return {
      data: verifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get slip generation history
   */
  async getSlipHistory(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
      const [slips, total] = await Promise.all([
        this.prisma.document.findMany({
          where: { userId, type: 'OTHER' },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.document.count({ where: { userId, type: 'OTHER' } })
      ]);

    return {
      data: slips,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get verification statistics
   */
  async getStatistics(userId?: string) {
    const whereClause = userId ? { userId } : {};
    
    const [totalVerifications, successfulVerifications, totalSlips] = await Promise.all([
      this.prisma.verification.count({ where: { ...whereClause, type: 'NIN' } }),
      this.prisma.verification.count({ where: { ...whereClause, type: 'NIN', status: 'VERIFIED' } }),
      this.prisma.document.count({ where: { ...whereClause, type: 'OTHER' } })
    ]);

    return {
      totalVerifications,
      successfulVerifications,
      failedVerifications: totalVerifications - successfulVerifications,
      totalSlips,
      totalRevenue: 0,
      successRate: totalVerifications > 0 ? (successfulVerifications / totalVerifications) * 100 : 0
    };
  }

  /**
   * Get verification details by ID
   */
  async getVerificationDetails(userId: string, verificationId: string): Promise<NinVerificationResponse> {
    try {
      const verification = await this.prisma.verification.findFirst({
        where: { 
          id: verificationId,
          userId,
          type: 'NIN'
        }
      });

      if (!verification) {
        return { success: false, error: 'Verification not found' };
      }

      if (verification.status !== 'VERIFIED' || !verification.result) {
        return { success: false, error: 'Verification not completed or failed' };
      }

      return {
        success: true,
        data: verification.result as any
      };
    } catch (error) {
      console.error('Get verification details error:', error);
      return { success: false, error: 'Failed to get verification details' };
    }
  }

  /**
   * Download verification slip
   */
  async downloadVerificationSlip(userId: string, verificationId: string): Promise<any> {
    try {
      const verification = await this.prisma.verification.findFirst({
        where: { 
          id: verificationId,
          userId,
          type: 'NIN',
          status: 'VERIFIED'
        }
      });

      if (!verification || !verification.result) {
        return { success: false, error: 'Verification not found or not completed' };
      }

      const result = verification.result as any;
      
      // Generate slip data
      const slipData: PremiumSlipData = {
        nin: result.nin,
        fullName: `${result.firstName} ${result.lastName}${result.middleName ? ' ' + result.middleName : ''}`,
        dateOfBirth: result.dateOfBirth,
        gender: result.gender,
        phone: result.phone,
        email: result.email,
        address: `${result.address?.addressLine || ''}, ${result.address?.town || ''}, ${result.address?.lga || ''}, ${result.address?.state || ''}`.replace(/^,\s*/, ''),
        photo: result.photo,
        signature: result.signature,
        issueDate: new Date().toLocaleDateString(),
        expiryDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        qrCode: this.generateQRCode(result.nin)
      };

      // Generate PDF
      const pdfBuffer = await this.generatePremiumSlipPDF(slipData);

      return {
        success: true,
        pdfBuffer,
        fileName: `NIN-Verification-Slip-${result.nin}.pdf`
      };
    } catch (error) {
      console.error('Download verification slip error:', error);
      return { success: false, error: 'Failed to generate verification slip' };
    }
  }
}