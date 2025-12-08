import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

export interface PaymentProviderConfig {
  paystack: {
    secretKey: string;
    publicKey: string;
    baseUrl: string;
  };
  flutterwave: {
    secretKey: string;
    publicKey: string;
    encryptionKey: string;
    baseUrl: string;
  };
  remita: {
    merchantId: string;
    apiKey: string;
    serviceTypeId: string;
    baseUrl: string;
  };
}

export interface PaymentRequest {
  amount: number; // in kobo
  email: string;
  phone?: string;
  reference: string;
  callbackUrl: string;
  metadata?: any;
  provider: 'paystack' | 'flutterwave' | 'remita';
}

export interface PaymentVerification {
  reference: string;
  provider: 'paystack' | 'flutterwave' | 'remita';
}

export interface PaymentResponse {
  success: boolean;
  reference: string;
  authorizationUrl?: string;
  accessCode?: string;
  message: string;
  provider: string;
}

export interface VerificationResponse {
  success: boolean;
  status: string;
  amount: number;
  reference: string;
  paidAt?: Date;
  channel?: string;
  currency?: string;
  metadata?: any;
  provider: string;
}

@Injectable()
export class PaymentIntegrationService {
  private config: PaymentProviderConfig;

  constructor(
    private httpService: HttpService,
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {
    this.config = {
      paystack: {
        secretKey: process.env.PAYSTACK_SECRET_KEY || '',
        publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
        baseUrl: 'https://api.paystack.co',
      },
      flutterwave: {
        secretKey: process.env.FLUTTERWAVE_SECRET_KEY || '',
        publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
        encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY || '',
        baseUrl: 'https://api.flutterwave.com/v3',
      },
      remita: {
        merchantId: process.env.REMITA_MERCHANT_ID || '',
        apiKey: process.env.REMITA_API_KEY || '',
        serviceTypeId: process.env.REMITA_SERVICE_TYPE_ID || '',
        baseUrl: 'https://remitademo.net/remita/exapp/api/v1',
      },
    };
  }

  async initializePayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      let response: PaymentResponse;

      switch (paymentRequest.provider) {
        case 'paystack':
          response = await this.initializePaystackPayment(paymentRequest);
          break;
        case 'flutterwave':
          response = await this.initializeFlutterwavePayment(paymentRequest);
          break;
        case 'remita':
          response = await this.initializeRemitaPayment(paymentRequest);
          break;
        default:
          throw new HttpException('Invalid payment provider', HttpStatus.BAD_REQUEST);
      }

      // Log payment initiation
      await this.prisma.paymentLog.create({
        data: {
          userId: paymentRequest.metadata?.userId || 'unknown',
          reference: paymentRequest.reference,
          amount: BigInt(paymentRequest.amount),
          currency: 'NGN',
          gateway: paymentRequest.provider,
          type: 'payment_init',
          status: response.success ? 'SUCCESS' : 'FAILED',
          metadata: { 
            request: JSON.parse(JSON.stringify(paymentRequest)), 
            response: JSON.parse(JSON.stringify(response)) 
          },
        },
      });

      return response;
    } catch (error) {
      // Log error
      await this.prisma.paymentLog.create({
        data: {
          userId: paymentRequest.metadata?.userId || 'unknown',
          reference: paymentRequest.reference,
          amount: BigInt(paymentRequest.amount),
          currency: 'NGN',
          gateway: paymentRequest.provider,
          type: 'payment_init',
          status: 'FAILED',
          metadata: { request: JSON.parse(JSON.stringify(paymentRequest)) },
          verificationError: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  private async initializePaystackPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    const payload = {
      amount: paymentRequest.amount,
      email: paymentRequest.email,
      reference: paymentRequest.reference,
      callback_url: paymentRequest.callbackUrl,
      metadata: paymentRequest.metadata,
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money'],
    };

    const response: any = await firstValueFrom(
      this.httpService.post(`${this.config.paystack.baseUrl}/transaction/initialize`, payload, {
        headers: {
          Authorization: `Bearer ${this.config.paystack.secretKey}`,
          'Content-Type': 'application/json',
        },
      })
    );

    if (response.data.status) {
      return {
        success: true,
        reference: paymentRequest.reference,
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        message: response.data.message,
        provider: 'paystack',
      };
    } else {
      throw new HttpException(response.data.message, HttpStatus.BAD_REQUEST);
    }
  }

  private async initializeFlutterwavePayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    const payload = {
      tx_ref: paymentRequest.reference,
      amount: paymentRequest.amount / 100, // Convert kobo to naira
      currency: 'NGN',
      redirect_url: paymentRequest.callbackUrl,
      customer: {
        email: paymentRequest.email,
        phonenumber: paymentRequest.phone,
        name: paymentRequest.metadata?.customerName || 'Customer',
      },
      customizations: {
        title: 'Dorce.ai Payment',
        description: paymentRequest.metadata?.description || 'Payment for services',
        logo: paymentRequest.metadata?.logo || '',
      },
      meta: paymentRequest.metadata,
    };

    const response: any = await firstValueFrom(
      this.httpService.post(`${this.config.flutterwave.baseUrl}/payments`, payload, {
        headers: {
          Authorization: `Bearer ${this.config.flutterwave.secretKey}`,
          'Content-Type': 'application/json',
        },
      })
    );

    if (response.data.status === 'success') {
      return {
        success: true,
        reference: paymentRequest.reference,
        authorizationUrl: response.data.data.link,
        message: response.data.message,
        provider: 'flutterwave',
      };
    } else {
      throw new HttpException(response.data.message, HttpStatus.BAD_REQUEST);
    }
  }

  private async initializeRemitaPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    const payload = {
      merchantId: this.config.remita.merchantId,
      serviceTypeId: this.config.remita.serviceTypeId,
      orderId: paymentRequest.reference,
      amount: paymentRequest.amount / 100, // Convert kobo to naira
      responseurl: paymentRequest.callbackUrl,
      payerName: paymentRequest.metadata?.customerName || 'Customer',
      payerEmail: paymentRequest.email,
      payerPhone: paymentRequest.phone,
      description: paymentRequest.metadata?.description || 'Payment for services',
    };

    // Generate hash for Remita
    const hashString = `${this.config.remita.merchantId}${this.config.remita.serviceTypeId}${paymentRequest.reference}${paymentRequest.amount / 100}${this.config.remita.apiKey}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    const response: any = await firstValueFrom(
      this.httpService.post(`${this.config.remita.baseUrl}/generateinvoice`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `remitaConsumerKey=${this.config.remita.merchantId},remitaConsumerToken=${hash}`,
        },
      })
    );

    if (response.data.statuscode === '025') {
      return {
        success: true,
        reference: paymentRequest.reference,
        authorizationUrl: response.data.data.authorizationUrl,
        message: 'Payment initialized successfully',
        provider: 'remita',
      };
    } else {
      throw new HttpException(response.data.status, HttpStatus.BAD_REQUEST);
    }
  }

  async verifyPayment(verificationRequest: PaymentVerification): Promise<VerificationResponse> {
    try {
      let response: VerificationResponse;

      switch (verificationRequest.provider) {
        case 'paystack':
          response = await this.verifyPaystackPayment(verificationRequest.reference);
          break;
        case 'flutterwave':
          response = await this.verifyFlutterwavePayment(verificationRequest.reference);
          break;
        case 'remita':
          response = await this.verifyRemitaPayment(verificationRequest.reference);
          break;
        default:
          throw new HttpException('Invalid payment provider', HttpStatus.BAD_REQUEST);
      }

      // Update payment log
      await this.prisma.paymentLog.updateMany({
        where: { reference: verificationRequest.reference },
        data: {
          status: response.success ? 'SUCCESS' : 'FAILED',
          verifiedAt: new Date(),
          metadata: { verification: JSON.parse(JSON.stringify(response)) },
        },
      });

      // Send notification if payment is successful
      if (response.success && response.status === 'success') {
        const paymentLog = await this.prisma.paymentLog.findFirst({
          where: { reference: verificationRequest.reference },
        });

        if (paymentLog) {
          await this.notificationService.sendNotification({
            userId: paymentLog.userId,
            type: 'PAYMENT_SUCCESS',
            title: 'Payment Successful',
            message: `Your payment of ₦${(response.amount / 100).toLocaleString()} was successful.`,
            channels: ['email', 'push', 'sms'],
            metadata: {
              reference: verificationRequest.reference,
              amount: response.amount,
              provider: verificationRequest.provider,
            },
          });
        }
      }

      return response;
    } catch (error) {
      // Log verification error
      await this.prisma.paymentLog.updateMany({
        where: { reference: verificationRequest.reference },
        data: {
          status: 'FAILED',
          verifiedAt: new Date(),
          verificationError: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  private async verifyPaystackPayment(reference: string): Promise<VerificationResponse> {
    const response: any = await firstValueFrom(
      this.httpService.get(`${this.config.paystack.baseUrl}/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${this.config.paystack.secretKey}`,
          'Content-Type': 'application/json',
        },
      })
    );

    if (response.data.status) {
      const data = response.data.data;
      return {
        success: true,
        status: data.status,
        amount: data.amount,
        reference: data.reference,
        paidAt: new Date(data.paid_at),
        channel: data.channel,
        currency: data.currency,
        metadata: data.metadata,
        provider: 'paystack',
      };
    } else {
      throw new HttpException('Payment verification failed', HttpStatus.BAD_REQUEST);
    }
  }

  private async verifyFlutterwavePayment(reference: string): Promise<VerificationResponse> {
    const response: any = await firstValueFrom(
      this.httpService.get(`${this.config.flutterwave.baseUrl}/transactions/${reference}/verify`, {
        headers: {
          Authorization: `Bearer ${this.config.flutterwave.secretKey}`,
          'Content-Type': 'application/json',
        },
      })
    );

    if (response.data.status === 'success') {
      const data = response.data.data;
      return {
        success: true,
        status: data.status,
        amount: data.amount * 100, // Convert back to kobo
        reference: data.tx_ref,
        paidAt: new Date(data.created_at),
        channel: data.payment_type,
        currency: data.currency,
        metadata: data.meta,
        provider: 'flutterwave',
      };
    } else {
      throw new HttpException('Payment verification failed', HttpStatus.BAD_REQUEST);
    }
  }

  private async verifyRemitaPayment(reference: string): Promise<VerificationResponse> {
    const response: any = await firstValueFrom(
      this.httpService.get(`${this.config.remita.baseUrl}/payment/status/${reference}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );

    if (response.data.status === '01') {
      return {
        success: true,
        status: 'success',
        amount: response.data.amount * 100, // Convert to kobo
        reference: reference,
        paidAt: new Date(),
        channel: 'remita',
        currency: 'NGN',
        provider: 'remita',
      };
    } else {
      throw new HttpException('Payment verification failed', HttpStatus.BAD_REQUEST);
    }
  }

  async getPaymentHistory(userId: string, limit = 50, offset = 0) {
    const payments = await this.prisma.paymentLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.paymentLog.count({ where: { userId } });

    return {
      payments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async getProviderStats() {
    const stats = await this.prisma.paymentLog.groupBy({
      by: ['gateway'],
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      },
      where: {
        status: 'SUCCESS',
      },
    });

    return stats.map(stat => ({
      provider: (stat as any).gateway,
      totalTransactions: (stat as any)._count?._all || 0,
      totalAmount: stat._sum.amount ? Number(stat._sum.amount) : 0,
    }));
  }
}
