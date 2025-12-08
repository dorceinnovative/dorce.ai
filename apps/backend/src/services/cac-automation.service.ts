import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { PrismaService } from '../prisma/prisma.service';
import type { $Enums } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

export interface CACRegistrationData {
  businessName: string;
  businessType: BusinessType;
  objectives: string;
  address: string;
  state: string;
  lga: string;
  city: string;
  postalCode: string;
  email: string;
  phone: string;
  directors: DirectorInfo[];
  shareCapital: number;
  shares: ShareInfo[];
  documents: DocumentUpload[];
}

export interface DirectorInfo {
  surname: string;
  firstName: string;
  middleName?: string;
  nationality: string;
  occupation: string;
  dateOfBirth: string;
  address: string;
  email: string;
  phone: string;
  identification: {
    type: 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE';
    number: string;
    expiryDate?: string;
  };
}

export interface ShareInfo {
  directorId: string;
  numberOfShares: number;
  valuePerShare: number;
}

export interface DocumentUpload {
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export enum BusinessType {
  PRIVATE_LIMITED = 'PRIVATE_LIMITED',
  PUBLIC_LIMITED = 'PUBLIC_LIMITED',
  UNLIMITED = 'UNLIMITED',
  COMPANY_LIMITED_BY_GUARANTEE = 'COMPANY_LIMITED_BY_GUARANTEE',
  LIMITED_LIABILITY_PARTNERSHIP = 'LIMITED_LIABILITY_PARTNERSHIP',
  BUSINESS_NAME = 'BUSINESS_NAME',
  INCORPORATED_TRUSTEE = 'INCORPORATED_TRUSTEE'
}

export enum DocumentType {
  MEMORANDUM_ARTICLES = 'MEMORANDUM_ARTICLES',
  FORM_CO1 = 'FORM_CO1',
  FORM_CO2 = 'FORM_CO2',
  FORM_CO7 = 'FORM_CO7',
  IDENTIFICATION_DOCUMENTS = 'IDENTIFICATION_DOCUMENTS',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
  STAMP_DUTY_CERTIFICATE = 'STAMP_DUTY_CERTIFICATE',
  BANK_REFERENCE = 'BANK_REFERENCE',
  PROFESSIONAL_CERTIFICATE = 'PROFESSIONAL_CERTIFICATE'
}

export interface CACPortalConfig {
  baseUrl: string;
  username: string;
  password: string;
  apiKey?: string;
  timeout: number;
}

export interface NameAvailabilityResponse {
  available: boolean;
  message: string;
  alternatives?: string[];
  reservationCode?: string;
}

export interface RegistrationStatus {
  status: CACStatus;
  trackingNumber: string;
  rcNumber?: string;
  certificateUrl?: string;
  documents?: DocumentStatus[];
  estimatedCompletionDate?: Date;
  currentStage: string;
  nextAction?: string;
}

export interface DocumentStatus {
  type: DocumentType;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  uploadedAt: Date;
  reviewedAt?: Date;
}

export enum CACStatus {
  DRAFT = 'DRAFT',
  NAME_SEARCH = 'NAME_SEARCH',
  NAME_RESERVED = 'NAME_RESERVED',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CERTIFICATE_READY = 'CERTIFICATE_READY'
}

@Injectable()
export class CACAutomationService {
  private readonly logger = new Logger(CACAutomationService.name);
  private browser: puppeteer.Browser | null;
  private portalConfig: CACPortalConfig;

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private httpService: HttpService,
  ) {
    this.portalConfig = {
      baseUrl: process.env.CAC_PORTAL_URL || 'https://publicsearch.cac.gov.ng',
      username: process.env.CAC_USERNAME || '',
      password: process.env.CAC_PASSWORD || '',
      apiKey: process.env.CAC_API_KEY,
      timeout: 30000,
    };
  }

  async initializeBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: process.env.NODE_ENV === 'production' ? true : false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async checkNameAvailability(businessName: string): Promise<NameAvailabilityResponse> {
    try {
      await this.initializeBrowser();
      const page = await this.browser!.newPage();
      
      await page.goto(`${this.portalConfig.baseUrl}/comsearch`, {
        waitUntil: 'networkidle0',
        timeout: this.portalConfig.timeout,
      });

      // Fill the name search form
      await page.waitForSelector('#searchText');
      await page.type('#searchText', businessName);
      
      // Click search button
      await page.click('#btnSearch');
      await page.waitForSelector('#searchResults', { timeout: 10000 });

      // Parse results
      const resultsHtml = await page.content();
      const $ = cheerio.load(resultsHtml);
      
      const results = $('#searchResults .result-item');
      let available = true;
      let message = 'Business name is available for registration';
      const alternatives: string[] = [];

      if (results.length > 0) {
        available = false;
        message = 'Business name is already taken';
        
        // Generate alternatives
        const suffixes = ['Global', 'Nigeria', 'Africa', 'International', 'Limited', 'Services'];
        for (const suffix of suffixes) {
          const alternative = `${businessName} ${suffix}`;
          alternatives.push(alternative);
        }
      }

      // Reserve name if available
      let reservationCode: string | undefined;
      if (available) {
        reservationCode = await this.reserveName(businessName, page);
      }

      await page.close();

      return {
        available,
        message,
        alternatives: alternatives.slice(0, 5),
        reservationCode,
      };
    } catch (error) {
      this.logger.error(`Error checking name availability: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to check business name availability: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async reserveName(businessName: string, page: puppeteer.Page): Promise<string> {
    try {
      // Click reserve button
      await page.click('#btnReserve');
      await page.waitForSelector('#reservationForm', { timeout: 5000 });

      // Fill reservation form
      const reservationCode = `CAC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await page.type('#reservationCode', reservationCode);
      await page.type('#businessName', businessName);
      
      // Submit reservation
      await page.click('#submitReservation');
      await page.waitForSelector('#reservationSuccess', { timeout: 10000 });

      return reservationCode;
    } catch (error) {
      this.logger.warn(`Failed to reserve name: ${error instanceof Error ? error.message : String(error)}`);
      return '';
    }
  }

  async submitRegistration(
    userId: string,
    registrationData: CACRegistrationData,
  ): Promise<string> {
    try {
      const trackingNumber = `CAC-${uuidv4()}`;
      // Create registration record
      const registration = await this.prisma.cACApplication.create({
        data: {
          userId,
          businessName: registrationData.businessName,
          businessType: this.mapBusinessType(registrationData.businessType),
          registrationType: 'NEW_REGISTRATION' as $Enums.CACRegistrationType,
          providerResponse: {
            objectives: registrationData.objectives,
            address: registrationData.address,
            state: registrationData.state,
            lga: registrationData.lga,
            city: registrationData.city,
            postalCode: registrationData.postalCode,
            email: registrationData.email,
            phone: registrationData.phone,
          },
          shareCapital: registrationData.shareCapital,
          status: 'PENDING' as $Enums.CACStatus,
          providerReference: trackingNumber,
        },
      });

      // Create directors (store as JSON array)
      const directorsJson = registrationData.directors.map(director => ({
        surname: director.surname,
        firstName: director.firstName,
        middleName: director.middleName,
        nationality: director.nationality,
        occupation: director.occupation,
        dateOfBirth: director.dateOfBirth,
        address: director.address,
        email: director.email,
        phone: director.phone,
        identification: {
          type: director.identification.type,
          number: director.identification.number,
          expiryDate: director.identification.expiryDate,
        },
      }));

      // Update registration with directors
      await this.prisma.cACApplication.update({
        where: { id: registration.id },
        data: {
          directors: directorsJson,
        },
      });

      // Create shares structure (store as JSON array)
      const shareholdersJson = registrationData.shares.map(share => ({
        directorId: share.directorId,
        numberOfShares: share.numberOfShares,
        valuePerShare: share.valuePerShare,
        totalValue: share.numberOfShares * share.valuePerShare,
      }));

      // Update registration with shareholders
      await this.prisma.cACApplication.update({
        where: { id: registration.id },
        data: {
          shareholders: shareholdersJson,
        },
      });

      // Process documents
      for (const document of registrationData.documents) {
        const createdDoc = await this.prisma.document.create({
          data: {
            userId,
            type: document.type as any,
            fileName: document.fileName,
            fileUrl: document.fileUrl,
            fileSize: document.fileSize,
            mimeType: document.mimeType,
            status: 'PENDING' as $Enums.DocumentStatus,
          },
        });

        await this.prisma.cACDocument.create({
          data: {
            cacApplicationId: registration.id,
            documentId: createdDoc.id,
            required: true,
          },
        });
      }

      // Send notification
      await this.notificationService.sendNotification({
        userId,
        type: 'CAC_UPDATE',
        title: 'CAC Registration Submitted',
        message: `Your business registration for ${registrationData.businessName} has been submitted successfully. Tracking number: ${trackingNumber}`,
        channels: ['email', 'push'],
        metadata: {
          registrationId: registration.id,
          trackingNumber,
          businessName: registrationData.businessName,
        },
      });

      return registration.id;
    } catch (error) {
      this.logger.error(`Error submitting registration: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to submit CAC registration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async processRegistration(registrationId: string): Promise<void> {
    try {
      const registration = await this.prisma.cACApplication.findUnique({
        where: { id: registrationId },
        include: {
          documents: true,
        },
      });

      if (!registration) {
        throw new Error('Registration not found');
      }

      // Step 1: Name search and reservation
      if (registration.status === 'PENDING') {
        await this.processNameSearch(registration);
      }

      // Step 2: Document verification
      if (registration.status === 'UNDER_REVIEW') {
        await this.processDocumentVerification(registration);
      }

      // Step 3: Payment processing
      if (registration.status === 'APPROVED') {
        await this.processPayment(registration);
      }

      // Step 4: Final submission
      if (registration.status === 'COMPLETED') {
        await this.processFinalSubmission(registration);
      }
    } catch (error) {
      this.logger.error(`Error processing registration ${registrationId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async processNameSearch(registration: any): Promise<void> {
    try {
      const nameCheck = await this.checkNameAvailability(registration.businessName);
      
      if (!nameCheck.available) {
        await this.prisma.cACApplication.update({
          where: { id: registration.id },
          data: {
            status: CACStatus.REJECTED,
            rejectionReason: `Business name "${registration.businessName}" is not available. ${nameCheck.message}`,
          },
        });

        await this.notificationService.sendNotification({
          userId: registration.userId,
          type: 'CAC_UPDATE',
          title: 'Business Name Not Available',
          message: `The business name "${registration.businessName}" is already taken. Please choose an alternative name.`,
          channels: ['email', 'push'],
          metadata: {
            registrationId: registration.id,
            alternatives: nameCheck.alternatives,
          },
        });

        return;
      }

      await this.prisma.cACApplication.update({
        where: { id: registration.id },
        data: {
          status: 'UNDER_REVIEW',
        },
      });

      await this.notificationService.sendNotification({
        userId: registration.userId,
        type: 'CAC_UPDATE',
        title: 'Business Name Reserved',
        message: `Your business name "${registration.businessName}" has been reserved successfully.`,
        channels: ['email', 'push'],
        metadata: {
          registrationId: registration.id,
          reservationCode: nameCheck.reservationCode,
        },
      });
    } catch (error) {
      this.logger.error(`Error in name search: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async processDocumentVerification(registration: any): Promise<void> {
    try {
      // Verify all required documents are uploaded
      const requiredDocuments = this.getRequiredDocuments(registration.businessType);
      const uploadedDocuments = registration.documents.map((d: any) => d.type);
      
      const missingDocuments = requiredDocuments.filter(
        (doc) => !uploadedDocuments.includes(doc),
      );

      if (missingDocuments.length > 0) {
        await this.notificationService.sendNotification({
          userId: registration.userId,
          type: 'CAC_UPDATE',
          title: 'Missing Required Documents',
          message: `Please upload the following required documents: ${missingDocuments.join(', ')}`,
          channels: ['email', 'push'],
          metadata: {
            registrationId: registration.id,
            missingDocuments,
          },
        });

        return;
      }

      // Update status to payment pending
      await this.prisma.cACApplication.update({
        where: { id: registration.id },
        data: { status: 'APPROVED' },
      });

      // Calculate fees
      const fees = this.calculateRegistrationFees(registration);
      
      await this.notificationService.sendNotification({
          userId: registration.userId,
          type: 'CAC_UPDATE',
          title: 'Payment Required for CAC Registration',
          message: `Please make payment of ₦${fees.total.toLocaleString()} to complete your registration.`,
          channels: ['email', 'push'],
          metadata: {
            registrationId: registration.id,
            fees,
          },
        });
    } catch (error) {
      this.logger.error(`Error in document verification: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async processPayment(registration: any): Promise<void> {
    try {
      // This would integrate with payment service
      const paymentSuccessful = await this.simulatePayment(registration);
      
      if (paymentSuccessful) {
        await this.prisma.cACApplication.update({
          where: { id: registration.id },
          data: { status: 'COMPLETED' },
        });

        await this.notificationService.sendNotification({
          userId: registration.userId,
          type: 'CAC_UPDATE',
          title: 'Payment Confirmed',
          message: 'Your payment has been confirmed. Processing your registration now.',
          channels: ['email', 'push'],
          metadata: {
            registrationId: registration.id,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error in payment processing: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async processFinalSubmission(registration: any): Promise<void> {
    try {
      await this.initializeBrowser();
      const page = await this.browser!.newPage();
      
      // Navigate to CAC portal
      await page.goto(`${this.portalConfig.baseUrl}/registration`, {
        waitUntil: 'networkidle0',
        timeout: this.portalConfig.timeout,
      });

      // Login to portal
      await page.waitForSelector('#username');
      await page.type('#username', this.portalConfig.username);
      await page.type('#password', this.portalConfig.password);
      await page.click('#loginButton');
      
      await page.waitForNavigation({ timeout: 10000 });

      // Fill registration form
      await this.fillRegistrationForm(page, registration);
      
      // Upload documents
      await this.uploadDocuments(page, registration.documents);
      
      // Submit registration
      await page.click('#submitRegistration');
      
      // Wait for confirmation
      await page.waitForSelector('#registrationSuccess', { timeout: 30000 });
      
      // Extract RC number
      const rcNumber = await page.$eval('#rcNumber', (el) => el.textContent);
      
      await page.close();

      // Update registration status
      await this.prisma.cACApplication.update({
        where: { id: registration.id },
        data: {
          status: 'APPROVED' as $Enums.CACStatus,
          approvedName: rcNumber,
        },
      });

      await this.notificationService.sendNotification({
        userId: registration.userId,
        type: 'CAC_UPDATE',
        title: 'Business Registration Completed',
        message: `Your business registration has been completed successfully. RC Number: ${rcNumber}`,
        channels: ['email', 'push'],
        metadata: {
          registrationId: registration.id,
          rcNumber,
        },
      });
    } catch (error) {
      this.logger.error(`Error in final submission: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async fillRegistrationForm(page: puppeteer.Page, registration: any): Promise<void> {
    // Fill business details
    await page.type('#businessName', registration.businessName);
    await page.select('#businessType', registration.businessType);
    await page.type('#objectives', registration.objectives);
    
    // Fill address details
    await page.type('#address', registration.address);
    await page.select('#state', registration.state);
    await page.select('#lga', registration.lga);
    await page.type('#city', registration.city);
    await page.type('#postalCode', registration.postalCode);
    
    // Fill contact details
    await page.type('#email', registration.email);
    await page.type('#phone', registration.phone);
    
    // Fill share capital
    await page.type('#shareCapital', registration.shareCapital.toString());
    
    // Add directors
    for (let i = 0; i < registration.directors.length; i++) {
      const director = registration.directors[i];
      
      if (i > 0) {
        await page.click('#addDirector');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      await page.type(`#director${i}_surname`, director.surname);
      await page.type(`#director${i}_firstName`, director.firstName);
      if (director.middleName) {
        await page.type(`#director${i}_middleName`, director.middleName);
      }
      await page.select(`#director${i}_nationality`, director.nationality);
      await page.type(`#director${i}_occupation`, director.occupation);
      await page.type(`#director${i}_dateOfBirth`, director.dateOfBirth);
      await page.type(`#director${i}_address`, director.address);
      await page.type(`#director${i}_email`, director.email);
      await page.type(`#director${i}_phone`, director.phone);
    }
  }

  private async uploadDocuments(page: puppeteer.Page, documents: any[]): Promise<void> {
    for (const document of documents) {
      const fileInputSelector = `#document_${document.type}`;
      
      if (await page.$(fileInputSelector)) {
        const input = await page.$(fileInputSelector) as puppeteer.ElementHandle<HTMLInputElement>;
        await input?.uploadFile(document.fileUrl);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private getRequiredDocuments(businessType: BusinessType): DocumentType[] {
    const baseDocuments = [
      DocumentType.MEMORANDUM_ARTICLES, // placeholder for general doc set
      DocumentType.FORM_CO2,
      DocumentType.FORM_CO7,
    ];

    switch (businessType) {
      case BusinessType.PRIVATE_LIMITED:
      case BusinessType.PUBLIC_LIMITED:
        return [
          ...baseDocuments,
          DocumentType.MEMORANDUM_ARTICLES,
          DocumentType.FORM_CO2,
          DocumentType.FORM_CO7,
        ];
      case BusinessType.BUSINESS_NAME:
        return [
          ...baseDocuments,
          DocumentType.FORM_CO2,
        ];
      default:
        return baseDocuments;
    }
  }

  private calculateRegistrationFees(registration: any): any {
    const baseFee = 20000; // Base CAC fee
    const nameReservationFee = 5000;
    const stampDutyFee = registration.shareCapital * 0.0075; // 0.75% of share capital
    const processingFee = 10000; // Our processing fee
    
    const total = baseFee + nameReservationFee + stampDutyFee + processingFee;
    
    return {
      baseFee,
      nameReservationFee,
      stampDutyFee,
      processingFee,
      total,
    };
  }

  private async simulatePayment(registration: any): Promise<boolean> {
    // In a real implementation, this would integrate with payment gateway
    // For now, simulate successful payment
    return true;
  }

  async getRegistrationStatus(registrationId: string): Promise<RegistrationStatus> {
    try {
      const registration = await this.prisma.cACApplication.findUnique({
        where: { id: registrationId },
        include: {
          documents: { include: { document: true } },
        },
      });

      if (!registration) {
        throw new Error('Registration not found');
      }

      const docs: DocumentStatus[] = registration.documents.map((d: any) => ({
        type: (d.document?.type as any) ?? DocumentType.PROFESSIONAL_CERTIFICATE,
        status: (d.document?.status === 'VERIFIED' ? 'APPROVED' : (d.document?.status as any)) ?? 'PENDING',
        remarks: undefined,
        uploadedAt: d.document?.uploadedAt ?? new Date(),
        reviewedAt: d.document?.verifiedAt ?? undefined,
      }));

      return {
        status: registration.status as any,
        trackingNumber: registration.id,
        rcNumber: registration.approvedName || undefined,
        certificateUrl: undefined,
        documents: docs,
        estimatedCompletionDate: this.calculateEstimatedCompletion(registration.status as any),
        currentStage: this.getCurrentStage(registration.status as any),
        nextAction: this.getNextAction(registration.status as any),
      };
    } catch (error) {
      this.logger.error(`Error getting registration status: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private calculateEstimatedCompletion(currentStatus: CACStatus): Date {
    const daysFromNow = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date;
    };

    switch (currentStatus) {
      case CACStatus.DRAFT:
        return daysFromNow(14);
      case CACStatus.NAME_SEARCH:
      case CACStatus.NAME_RESERVED:
        return daysFromNow(10);
      case CACStatus.DOCUMENT_UPLOAD:
      case CACStatus.PAYMENT_PENDING:
      case CACStatus.PAYMENT_CONFIRMED:
        return daysFromNow(7);
      case CACStatus.UNDER_REVIEW:
        return daysFromNow(3);
      case CACStatus.APPROVED:
      case CACStatus.CERTIFICATE_READY:
        return daysFromNow(1);
      default:
        return daysFromNow(14);
    }
  }

  private getCurrentStage(status: CACStatus): string {
    const stages = {
      [CACStatus.DRAFT]: 'Initial Setup',
      [CACStatus.NAME_SEARCH]: 'Name Search',
      [CACStatus.NAME_RESERVED]: 'Name Reserved',
      [CACStatus.DOCUMENT_UPLOAD]: 'Document Upload',
      [CACStatus.PAYMENT_PENDING]: 'Payment Pending',
      [CACStatus.PAYMENT_CONFIRMED]: 'Payment Confirmed',
      [CACStatus.UNDER_REVIEW]: 'Under Review',
      [CACStatus.APPROVED]: 'Approved',
      [CACStatus.REJECTED]: 'Rejected',
      [CACStatus.COMPLETED]: 'Completed',
      [CACStatus.CERTIFICATE_READY]: 'Certificate Ready',
    };

    return stages[status] || 'Unknown';
  }

  private getNextAction(status: CACStatus): string | undefined {
    const actions = {
      [CACStatus.DRAFT]: 'Complete name search',
      [CACStatus.NAME_SEARCH]: 'Wait for name reservation',
      [CACStatus.NAME_RESERVED]: 'Upload required documents',
      [CACStatus.DOCUMENT_UPLOAD]: 'Make payment',
      [CACStatus.PAYMENT_PENDING]: 'Complete payment',
      [CACStatus.PAYMENT_CONFIRMED]: 'Wait for review',
      [CACStatus.UNDER_REVIEW]: 'Wait for approval',
      [CACStatus.APPROVED]: 'Download certificate',
      [CACStatus.REJECTED]: 'Address rejection reasons',
      [CACStatus.COMPLETED]: 'Registration complete',
      [CACStatus.CERTIFICATE_READY]: 'Download certificate',
    };

    return actions[status];
  }

  async downloadCertificate(registrationId: string): Promise<string> {
    try {
      const registration = await this.prisma.cACApplication.findUnique({
        where: { id: registrationId },
      });

      if (!registration) {
        throw new Error('Registration not found');
      }

      if (registration.status !== 'COMPLETED') {
        throw new Error('Certificate not ready for download');
      }

      // Generate certificate URL or fetch from CAC portal
      const certificateUrl = await this.generateCertificateUrl(registration);
      
      // Note: certificateUrl field doesn't exist in current schema
      // In production, you might want to store this in a separate table or metadata
      
      return certificateUrl;
    } catch (error) {
      this.logger.error(`Error downloading certificate: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async generateCertificateUrl(registration: any): Promise<string> {
    // In a real implementation, this would fetch the actual certificate from CAC portal
    // For now, generate a mock certificate URL
    return `https://storage.googleapis.com/dorce-certificates/cac/${registration.approvedName}.pdf`;
  }

  async getRegistrationHistory(userId: string): Promise<any[]> {
    try {
      return await this.prisma.cACApplication.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          documents: { include: { document: true } },
        },
      });
    } catch (error) {
      this.logger.error(`Error getting registration history: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async cancelRegistration(registrationId: string, reason: string): Promise<void> {
    try {
      const registration = await this.prisma.cACApplication.findUnique({
        where: { id: registrationId },
      });

      if (!registration) {
        throw new Error('Registration not found');
      }

      if (registration.status === 'COMPLETED') {
        throw new Error('Cannot cancel completed registration');
      }

      await this.prisma.cACApplication.update({
        where: { id: registrationId },
        data: {
          status: 'REJECTED' as $Enums.CACStatus,
          rejectionReason: `Cancelled by user: ${reason}`,
        },
      });

      await this.notificationService.sendNotification({
        userId: registration.userId,
        type: 'CAC_UPDATE',
        title: 'CAC Registration Cancelled',
        message: `Your business registration has been cancelled. Reason: ${reason}`,
        channels: ['email', 'push'],
        metadata: {
          registrationId: registration.id,
          reason,
        },
      });
    } catch (error) {
      this.logger.error(`Error cancelling registration: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private mapBusinessType(bt: BusinessType): $Enums.BusinessType {
    switch (bt) {
      case BusinessType.PRIVATE_LIMITED:
        return 'PRIVATE_COMPANY' as $Enums.BusinessType;
      case BusinessType.PUBLIC_LIMITED:
        return 'PUBLIC_COMPANY' as $Enums.BusinessType;
      case BusinessType.LIMITED_LIABILITY_PARTNERSHIP:
        return 'LIMITED_LIABILITY_PARTNERSHIP' as $Enums.BusinessType;
      case BusinessType.BUSINESS_NAME:
        return 'BUSINESS_NAME' as $Enums.BusinessType;
      case BusinessType.INCORPORATED_TRUSTEE:
        return 'INCORPORATED_TRUSTEE' as $Enums.BusinessType;
      case BusinessType.UNLIMITED:
      case BusinessType.COMPANY_LIMITED_BY_GUARANTEE:
      default:
        return 'PRIVATE_COMPANY' as $Enums.BusinessType;
    }
  }
}
