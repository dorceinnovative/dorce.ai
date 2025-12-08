import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import { NinTemplateService, NINData, NINTemplateOptions } from './nin-template.service';
import { PrismaService } from '../prisma/prisma.service';

export interface NINVerificationRequest {
  nin: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

export interface NINVerificationResponse {
  success: boolean;
  nin: string;
  fullName: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  address: string;
  lga: string;
  state: string;
  nationality: string;
  maritalStatus: string;
  occupation?: string;
  photo: string; // Base64 encoded photo
  signature?: string; // Base64 encoded signature
  fingerprints?: {
    rightThumb?: string;
    rightIndex?: string;
    leftThumb?: string;
    leftIndex?: string;
  };
  enrollmentDate: string;
  cardStatus: 'ACTIVE' | 'EXPIRED' | 'BLOCKED';
  verificationStatus: 'VERIFIED' | 'PENDING' | 'FAILED';
  premiumSlipUrl?: string;
  qrCode: string;
}

export interface PremiumNINSlipData {
  nin: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  address: string;
  lga: string;
  state: string;
  nationality: string;
  photo: string;
  signature?: string;
  qrCode: string;
  issueDate: string;
  expiryDate: string;
  slipNumber: string;
  securityCode: string;
  verificationUrl: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  enrollmentDate?: string;
  templateType?: 'classic' | 'premium' | 'executive' | 'quantum';
  premiumFeatures?: string[];
}

@Injectable()
export class NIMCCloneService {
  private readonly logger = new Logger(NIMCCloneService.name);
  
  // Simulated NIMC database and API endpoints
  private readonly nimcDatabase = new Map<string, any>();
  private readonly premiumSlips = new Map<string, PremiumNINSlipData>();

  constructor(
    private readonly httpService: HttpService,
    private readonly templateService: NinTemplateService,
    private readonly prisma: PrismaService,
  ) {
    this.initializeMockDatabase();
  }

  /**
   * Initialize mock NIMC database with sample data
   */
  private initializeMockDatabase() {
    // Sample NIN data for testing
    const sampleData = [
      {
        nin: '12345678901',
        firstName: 'JOHN',
        lastName: 'DOE',
        middleName: 'OLUWASEUN',
        dateOfBirth: '1990-01-15',
        gender: 'MALE',
        phone: '08012345678',
        email: 'john.doe@email.com',
        address: '123 MAIN STREET, IKEJA',
        lga: 'IKEJA',
        state: 'LAGOS',
        nationality: 'NIGERIAN',
        maritalStatus: 'SINGLE',
        occupation: 'SOFTWARE ENGINEER',
        photo: this.generateSamplePhoto(),
        signature: this.generateSampleSignature(),
        fingerprints: {
          rightThumb: 'FP_RT_123',
          rightIndex: 'FP_RI_123',
          leftThumb: 'FP_LT_123',
          leftIndex: 'FP_LI_123'
        },
        enrollmentDate: '2020-03-15',
        cardStatus: 'ACTIVE'
      },
      {
        nin: '98765432109',
        firstName: 'JANE',
        lastName: 'SMITH',
        middleName: 'ADETOLA',
        dateOfBirth: '1985-06-22',
        gender: 'FEMALE',
        phone: '08098765432',
        email: 'jane.smith@email.com',
        address: '456 BROAD STREET, VICTORIA ISLAND',
        lga: 'ETI-OSA',
        state: 'LAGOS',
        nationality: 'NIGERIAN',
        maritalStatus: 'MARRIED',
        occupation: 'BUSINESS WOMAN',
        photo: this.generateSamplePhoto(),
        signature: this.generateSampleSignature(),
        fingerprints: {
          rightThumb: 'FP_RT_987',
          rightIndex: 'FP_RI_987',
          leftThumb: 'FP_LT_987',
          leftIndex: 'FP_LI_987'
        },
        enrollmentDate: '2019-11-08',
        cardStatus: 'ACTIVE'
      }
    ];

    sampleData.forEach(data => {
      this.nimcDatabase.set(data.nin, data);
    });
  }

  /**
   * Clone NIMC verification endpoint
   * This simulates the NIMC web service for NIN verification
   */
  async verifyNIN(request: NINVerificationRequest): Promise<NINVerificationResponse> {
    try {
      this.logger.log(`Verifying NIN: ${request.nin}`);
      
      // Simulate NIMC API call delay
      await this.simulateNetworkDelay();
      
      // Check if NIN exists in our cloned database
      const ninData = this.nimcDatabase.get(request.nin);
      
      if (!ninData) {
        throw new Error('NIN not found in NIMC database');
      }
      
      // Validate basic information
      if (request.firstName && request.firstName.toUpperCase() !== ninData.firstName) {
        throw new Error('First name does not match NIMC records');
      }
      
      if (request.lastName && request.lastName.toUpperCase() !== ninData.lastName) {
        throw new Error('Last name does not match NIMC records');
      }
      
      // Generate QR code for verification
      const qrCode = this.generateQRCode(request.nin);
      
      // Generate premium slip if requested
      const premiumSlipData = await this.generatePremiumSlip({
        ...ninData,
        qrCode,
        issueDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
        slipNumber: `PREM-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        securityCode: this.generateSecurityCode(),
        verificationUrl: `https://dorce.ai/verify-nin/${request.nin}`
      });
      
      return {
        success: true,
        nin: request.nin,
        fullName: `${ninData.firstName} ${ninData.middleName ? ninData.middleName + ' ' : ''}${ninData.lastName}`,
        firstName: ninData.firstName,
        lastName: ninData.lastName,
        middleName: ninData.middleName,
        dateOfBirth: ninData.dateOfBirth,
        gender: ninData.gender,
        phone: ninData.phone,
        email: ninData.email,
        address: ninData.address,
        lga: ninData.lga,
        state: ninData.state,
        nationality: ninData.nationality,
        maritalStatus: ninData.maritalStatus,
        occupation: ninData.occupation,
        photo: ninData.photo,
        signature: ninData.signature,
        fingerprints: ninData.fingerprints,
        enrollmentDate: ninData.enrollmentDate,
        cardStatus: ninData.cardStatus,
        verificationStatus: 'VERIFIED',
        premiumSlipUrl: premiumSlipData ? `https://dorce.ai/nin-slip/${premiumSlipData.slipNumber}` : undefined,
        qrCode
      };
      
    } catch (error) {
      this.logger.error(`NIN verification failed: ${(error as any)?.message}`);
      throw error;
    }
  }

  /**
   * Generate premium NIN slip with professional design
   */
  async generatePremiumSlip(data: PremiumNINSlipData): Promise<PremiumNINSlipData> {
    try {
      this.logger.log(`Generating premium slip for NIN: ${data.nin}`);
      
      // Create premium slip PDF
      const pdfDoc = await this.createPremiumNINSlipPDF(data);
      
      // Store premium slip data
      this.premiumSlips.set(data.slipNumber, data);
      
      this.logger.log(`Premium slip generated: ${data.slipNumber}`);
      return data;
      
    } catch (error) {
      this.logger.error(`Premium slip generation failed: ${(error as any)?.message}`);
      throw error;
    }
  }

  /**
   * Create premium NIN slip PDF with professional design
   */
  private async createPremiumNINSlipPDF(data: PremiumNINSlipData): Promise<Buffer> {
    const documentDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content: [
        // Header with Nigerian government branding
        {
          columns: [
            {
              width: 80,
              image: this.getNigeriaCoatOfArms(),
              height: 80,
            },
            {
              width: '*',
              stack: [
                {
                  text: 'FEDERAL REPUBLIC OF NIGERIA',
                  style: 'header',
                  alignment: 'center'
                },
                {
                  text: 'NATIONAL IDENTITY MANAGEMENT COMMISSION (NIMC)',
                  style: 'subheader',
                  alignment: 'center'
                },
                {
                  text: 'PREMIUM DIGITAL NATIONAL IDENTITY SLIP',
                  style: 'title',
                  alignment: 'center',
                  color: '#1f4788'
                }
              ]
            },
            {
              width: 80,
              image: this.getNIMClogo(),
              height: 80,
              alignment: 'right'
            }
          ],
          columnGap: 20
        },
        
        // Security features
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 5,
              x2: 515, y2: 5,
              lineWidth: 2,
              lineColor: '#1f4788'
            }
          ],
          margin: [0, 10, 0, 10]
        },
        
        // Personal Information Section
        {
          text: 'PERSONAL INFORMATION',
          style: 'sectionHeader',
          margin: [0, 15, 0, 10]
        },
        
        {
          columns: [
            {
              width: '60%',
              stack: [
                this.createInfoRow('National Identification Number (NIN):', data.nin),
                this.createInfoRow('Full Name:', data.fullName),
                this.createInfoRow('Date of Birth:', data.dateOfBirth),
                this.createInfoRow('Gender:', data.gender),
                this.createInfoRow('Phone Number:', data.phone),
                this.createInfoRow('Email Address:', data.email || 'N/A'),
                this.createInfoRow('Nationality:', data.nationality),
              ]
            },
            {
              width: '40%',
              stack: [
                {
                  image: data.photo,
                  width: 120,
                  height: 150,
                  alignment: 'center',
                  margin: [0, 0, 0, 10]
                },
                {
                  qr: data.qrCode,
                  fit: 100,
                  alignment: 'center',
                  margin: [0, 10, 0, 0]
                }
              ]
            }
          ]
        },
        
        // Address Information
        {
          text: 'ADDRESS INFORMATION',
          style: 'sectionHeader',
          margin: [0, 20, 0, 10]
        },
        {
          columns: [
            {
              width: '50%',
              stack: [
                this.createInfoRow('Residential Address:', data.address),
                this.createInfoRow('Local Government Area:', data.lga),
              ]
            },
            {
              width: '50%',
              stack: [
                this.createInfoRow('State:', data.state),
                this.createInfoRow('Signature:', data.signature ? { image: data.signature, width: 100, height: 30 } : 'N/A'),
              ]
            }
          ]
        },
        
        // Security and Validation Information
        {
          text: 'SECURITY & VALIDATION',
          style: 'sectionHeader',
          margin: [0, 20, 0, 10]
        },
        {
          columns: [
            {
              width: '50%',
              stack: [
                this.createInfoRow('Slip Number:', data.slipNumber),
                this.createInfoRow('Issue Date:', data.issueDate),
                this.createInfoRow('Expiry Date:', data.expiryDate),
              ]
            },
            {
              width: '50%',
              stack: [
                this.createInfoRow('Security Code:', data.securityCode),
                this.createInfoRow('Verification URL:', data.verificationUrl),
              ]
            }
          ]
        },
        
        // Security features and watermarks
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 5,
              x2: 515, y2: 5,
              lineWidth: 1,
              lineColor: '#cccccc',
              dash: { length: 5 }
            }
          ],
          margin: [0, 30, 0, 10]
        },
        
        // Footer with security information
        {
          text: [
            'This is an official document of the National Identity Management Commission (NIMC). ',
            'For verification, visit: ',
            { text: data.verificationUrl, color: 'blue', decoration: 'underline' },
            ' or scan the QR code above.'
          ],
          style: 'footer',
          margin: [0, 10, 0, 0]
        },
        
        // Security warning
        {
          text: 'WARNING: Any alteration or tampering with this document is a criminal offense punishable under the law.',
          style: 'warning',
          alignment: 'center',
          margin: [0, 15, 0, 0]
        }
      ],
      
      styles: {
        header: {
          fontSize: 16,
          bold: true,
          color: '#1f4788'
        },
        subheader: {
          fontSize: 12,
          bold: true,
          color: '#666666',
          margin: [0, 2, 0, 0]
        },
        title: {
          fontSize: 14,
          bold: true,
          color: '#1f4788',
          margin: [0, 5, 0, 0]
        },
        sectionHeader: {
          fontSize: 12,
          bold: true,
          color: '#1f4788',
          decoration: 'underline'
        },
        label: {
          fontSize: 9,
          color: '#666666',
          bold: true
        },
        value: {
          fontSize: 10,
          color: '#333333',
          margin: [0, 0, 0, 8]
        },
        footer: {
          fontSize: 8,
          color: '#666666',
          alignment: 'justify'
        },
        warning: {
          fontSize: 9,
          color: '#d32f2f',
          bold: true
        }
      },
      
      defaultStyle: {
        font: 'Roboto'
      }
    };
    
    const nameParts = (data.fullName || '').trim().split(/\s+/);
    const ninData: NINData = {
      nin: data.nin,
      firstName: data.firstName ?? nameParts[0] ?? '',
      lastName: data.lastName ?? nameParts[nameParts.length - 1] ?? '',
      middleName: data.middleName ?? (nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : undefined),
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      phoneNumber: data.phone,
      email: data.email,
      address: data.address,
      lga: data.lga,
      state: data.state,
      nationality: data.nationality,
      enrollmentDate: data.enrollmentDate ?? data.issueDate,
      photo: data.photo,
      signature: data.signature,
    };

    const templateOptions: NINTemplateOptions = {
      templateType: data.templateType || 'premium',
      includePhoto: !!data.photo,
      includeQR: !!data.qrCode,
      includeSecurityFeatures: true,
      premiumFeatures: data.premiumFeatures || [],
    };
    
    return await this.templateService.generatePremiumTemplate(ninData, templateOptions);
  }

  /**
   * Create information row for PDF
   */
  private createInfoRow(label: string, value: any): any {
    return {
      columns: [
        {
          width: '40%',
          text: label,
          style: 'label'
        },
        {
          width: '60%',
          text: value,
          style: 'value'
        }
      ],
      columnGap: 10
    };
  }

  /**
   * Get Nigeria Coat of Arms (placeholder)
   */
  private getNigeriaCoatOfArms(): string {
    // This would be the actual Nigeria Coat of Arms image in base64
    // For now, using a placeholder
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }

  /**
   * Get NIMC logo (placeholder)
   */
  private getNIMClogo(): string {
    // This would be the actual NIMC logo in base64
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }

  /**
   * Generate sample photo (placeholder)
   */
  private generateSamplePhoto(): string {
    // This would generate or retrieve actual passport photos
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }

  /**
   * Generate sample signature (placeholder)
   */
  private generateSampleSignature(): string {
    // This would generate or retrieve actual signatures
    return 'data:ima ge/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }

  /**
   * Generate QR code for NIN verification
   */
  private generateQRCode(nin: string): string {
    // This would generate an actual QR code
    // For now, returning a placeholder that would be converted to QR in PDF
    return `NIN:${nin}|VERIFIED|DORCE.AI|${Date.now()}`;
  }

  /**
   * Generate security code for premium slip
   */
  private generateSecurityCode(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase() + 
           Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  /**
   * Simulate network delay for realistic API behavior
   */
  private async simulateNetworkDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
  }

  /**
   * Get premium slip by slip number
   */
  async getPremiumSlip(slipNumber: string): Promise<PremiumNINSlipData | null> {
    return this.premiumSlips.get(slipNumber) || null;
  }

  /**
   * Validate premium slip
   */
  async validatePremiumSlip(slipNumber: string, securityCode: string): Promise<boolean> {
    const slip = this.premiumSlips.get(slipNumber);
    return slip ? slip.securityCode === securityCode : false;
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<any> {
    return {
      totalVerifications: this.nimcDatabase.size,
      totalPremiumSlips: this.premiumSlips.size,
      activeCards: Array.from(this.nimcDatabase.values()).filter(d => d.cardStatus === 'ACTIVE').length,
      expiredCards: Array.from(this.nimcDatabase.values()).filter(d => d.cardStatus === 'EXPIRED').length,
      lastUpdated: new Date().toISOString()
    };
  }
}