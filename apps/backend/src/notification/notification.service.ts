import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export interface NotificationOptions {
  userId: string;
  type: 'LOAN_APPLICATION_UPDATE' | 'LOAN_DISBURSEMENT' | 'REPAYMENT_REMINDER' | 'CAC_UPDATE' | 'GENERAL' | 'LOAN_AMOUNT_REDUCED' | 'LOAN_TOP_UP_SUCCESSFUL' | 'LOAN_RESTRUCTURED' | 'PAYMENT_SUCCESS' | 'LOAN_APPROVED' | 'LOAN_REJECTED' | 'LOAN_DOCUMENTS_REQUESTED' | 'LOAN_GUARANTOR_REQUIRED' | 'ORDER_CREATED' | 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'ORDER_CANCELLED' | 'REFUND_PROCESSED' | 'STORE_FOLLOWED' | 'PRODUCT_REVIEWED' | 'RFQ_RESPONSE' | 'BOOKING_CONFIRMED' | 'BOOKING_COMPLETED' | 'NIN_VERIFIED' | 'VENDOR_APPLICATION' | 'NIN_ENROLLMENT_CREATED' | 'NIN_BIOMETRICS_SUBMITTED' | 'NIN_ENROLLMENT_COMPLETED' | 'SECURITY_ALERT';
  title: string;
  message: string;
  channels?: ('email' | 'sms' | 'push' | 'whatsapp')[];
  metadata?: any;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly termiiKey = process.env.TERMII_API_KEY || ''
  private readonly termiiSender = process.env.TERMII_SENDER_ID || 'DorceAI'
  private readonly sendgridKey = process.env.SENDGRID_API_KEY || ''
  private readonly twilioSid = process.env.TWILIO_ACCOUNT_SID || ''
  private readonly twilioToken = process.env.TWILIO_AUTH_TOKEN || ''
  private readonly twilioWhatsappFrom = process.env.TWILIO_WHATSAPP_FROM || ''

  constructor(private readonly http: HttpService) {}

  async sendNotification(options: NotificationOptions): Promise<void> {
    this.logger.log(`Sending ${options.type} notification to user ${options.userId}`);

    // Default channels if not specified
    const channels = options.channels || ['email', 'sms'];

    try {
      // Send notifications through configured channels
      const promises = channels.map(channel => {
        switch (channel) {
          case 'email':
            return this.sendEmailNotification(options);
          case 'sms':
            return this.sendSmsNotification(options);
          case 'push':
            return this.sendPushNotification(options);
          case 'whatsapp':
            return this.sendWhatsAppNotification(options);
          default:
            this.logger.warn(`Unknown notification channel: ${channel}`);
            return Promise.resolve();
        }
      });

      await Promise.allSettled(promises);
      
      this.logger.log(`Notification sent successfully to user ${options.userId}`);
    } catch (error) {
      this.logger.error(`Error sending notification to user ${options.userId}:`, error);
      // Don't throw error - notifications are non-critical
    }
  }

  private async sendEmailNotification(options: NotificationOptions): Promise<void> {
    if (!this.sendgridKey) {
      this.logger.warn('SENDGRID_API_KEY not set; skipping email send');
      return
    }
    try {
      const payload = {
        personalizations: [{ to: [{ email: options.metadata?.email || options.metadata?.to }], subject: options.title }],
        from: { email: options.metadata?.from || 'no-reply@dorce.ai', name: 'Dorce.ai' },
        content: [{ type: 'text/html', value: options.message }]
      }
      await this.http.post('https://api.sendgrid.com/v3/mail/send', payload, {
        headers: { Authorization: `Bearer ${this.sendgridKey}`, 'Content-Type': 'application/json' }
      }).toPromise()
    } catch (e) {
      this.logger.error(`SendGrid email failed: ${(e as any)?.message}`)
    }
  }

  private async sendSmsNotification(options: NotificationOptions): Promise<void> {
    if (!this.termiiKey) {
      this.logger.warn('TERMII_API_KEY not set; skipping SMS send');
      return
    }
    try {
      const to = options.metadata?.phone || options.metadata?.to
      const payload = {
        to,
        from: this.termiiSender,
        sms: options.message,
        type: 'plain',
        channel: 'generic'
      }
      await this.http.post('https://api.ng.termii.com/api/sms/send', payload, {
        params: { api_key: this.termiiKey },
        headers: { 'Content-Type': 'application/json' }
      }).toPromise()
    } catch (e) {
      this.logger.error(`Termii SMS failed: ${(e as any)?.message}`)
    }
  }

  private async sendPushNotification(options: NotificationOptions): Promise<void> {
    // Push notification implementation
    this.logger.log(`Sending push notification to user ${options.userId}: ${options.title}`);
    
    // In a real implementation, this would integrate with a push notification service
    // like Firebase Cloud Messaging (FCM) or OneSignal
    
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 100));
    this.logger.log(`Push notification sent to user ${options.userId}`);
  }

  private async sendWhatsAppNotification(options: NotificationOptions): Promise<void> {
    if (!this.twilioSid || !this.twilioToken || !this.twilioWhatsappFrom) {
      this.logger.warn('Twilio WhatsApp env not set; skipping WhatsApp send')
      return
    }
    try {
      const to = options.metadata?.whatsapp || options.metadata?.to
      const client = require('twilio')(this.twilioSid, this.twilioToken)
      await client.messages.create({
        from: `whatsapp:${this.twilioWhatsappFrom}`,
        to: `whatsapp:${to}`,
        body: options.message
      })
    } catch (e) {
      this.logger.error(`WhatsApp send failed: ${(e as any)?.message}`)
    }
  }

  async sendBulkNotifications(notifications: NotificationOptions[]): Promise<void> {
    this.logger.log(`Sending bulk notifications for ${notifications.length} users`);

    try {
      const promises = notifications.map(notification => 
        this.sendNotification(notification).catch(error => 
          this.logger.error(`Failed to send notification to user ${notification.userId}:`, error)
        )
      );

      await Promise.allSettled(promises);
      
      this.logger.log(`Bulk notifications completed`);
    } catch (error) {
      this.logger.error(`Error sending bulk notifications:`, error);
    }
  }

  async scheduleNotification(options: NotificationOptions, delay: number): Promise<void> {
    this.logger.log(`Scheduling notification for user ${options.userId} in ${delay}ms`);

    setTimeout(() => {
      this.sendNotification(options).catch(error => 
        this.logger.error(`Failed to send scheduled notification to user ${options.userId}:`, error)
      );
    }, delay);
  }

  // Compatibility wrappers for existing code paths
  async sendSms(options: { to: string; message: string }): Promise<void> {
    return this.sendNotification({
      userId: 'system',
      type: 'GENERAL',
      title: 'SMS',
      message: options.message,
      channels: ['sms'],
      metadata: { phone: options.to }
    })
  }

  async sendEmail(options: { to: string; subject: string; html: string }): Promise<void> {
    return this.sendNotification({
      userId: 'system',
      type: 'GENERAL',
      title: options.subject,
      message: options.html,
      channels: ['email'],
      metadata: { email: options.to, from: 'no-reply@dorce.ai' }
    })
  }
}
