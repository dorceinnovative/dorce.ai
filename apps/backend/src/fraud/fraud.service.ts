import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { PrismaService } from "../prisma/prisma.service";
// import {
//   FraudAlertStatus,
//   FraudSeverity,
//   TransactionStatus,
//   NotificationType,
// } from "@prisma/client";
import { Queue } from "bull";

export interface FraudCheckData {
  userId: string;
  transactionId: string;
  transactionType: string;
  amount: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface FraudRule {
  name: string;
  check: (data: FraudCheckData, userHistory: any) => boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

@Injectable()
export class FraudService {
  private readonly logger = new Logger("FraudService");
  private fraudRules: FraudRule[];

  constructor(
    private prisma: PrismaService,
    @InjectQueue("fraud-detection") private fraudQueue: Queue
  ) {
    this.initializeFraudRules();
  }

  /** Initialize fraud detection rules */
  private initializeFraudRules() {
    this.fraudRules = [
      {
        name: "multiple_failed_transactions",
        check: (data, history) => {
          const oneHourAgo = new Date(Date.now() - 3600000);
          const failedCount =
            history.recentTransactions?.filter(
              (t: any) => t.status === "FAILED" && new Date(t.createdAt) > oneHourAgo
            ).length || 0;
          return failedCount > 3;
        },
        severity: 'MEDIUM',
        description: "Multiple failed transactions detected in short timeframe",
      },
      {
        name: "unusually_large_transaction",
        check: (data, history) => {
          if (!history.averageTransaction) return false;
          return data.amount > history.averageTransaction * 10;
        },
        severity: 'HIGH',
        description: "Transaction amount unusually large compared to user history",
      },
      {
        name: "rapid_consecutive_transfers",
        check: (data, history) => {
          const fiveMinutesAgo = new Date(Date.now() - 300000);
          const recentTransfers =
            history.sentTransfers?.filter((t: any) => new Date(t.createdAt) > fiveMinutesAgo)
              .length || 0;
          return recentTransfers >= 5;
        },
        severity: 'HIGH',
        description: "Rapid consecutive transfers detected",
      },
      {
        name: "new_recipient_large_amount",
        check: (data, history) => {
          if (data.transactionType !== "TRANSFER" || data.amount < 100000) return false;
          const recipients = history.sentTransfers?.map((t: any) => t.receiverId) || [];
          return !recipients.includes(data.metadata?.recipientId);
        },
        severity: 'HIGH',
        description: "Large transfer to new recipient",
      },
      {
        name: "location_velocity_check",
        check: (data, history) => {
          const lastTransaction = history.recentTransactions?.[0];
          if (!lastTransaction || !data.metadata?.location) return false;

          const timeDiff = Date.now() - new Date(lastTransaction.createdAt).getTime();
          const locationDiff = data.metadata.location !== lastTransaction.metadata?.location;

          return locationDiff && timeDiff < 900000;
        },
        severity: 'CRITICAL',
        description: "Impossible location velocity detected",
      },
      {
        name: "account_takeover_attempt",
        check: (data, history) => {
          if (!history.failedLogins) return false;
          const oneHourAgo = new Date(Date.now() - 3600000);
          const recentFailedLogins =
            history.failedLogins?.filter((t: any) => new Date(t.timestamp) > oneHourAgo).length || 0;

          return recentFailedLogins > 5 && data.amount > 50000;
        },
        severity: 'CRITICAL',
        description: "Potential account takeover: Multiple failed logins followed by large transaction",
      },
      {
        name: "duplicate_transaction",
        check: (data, history) => {
          const twoMinutesAgo = new Date(Date.now() - 120000);
          const duplicates =
            history.recentTransactions?.filter(
              (t: any) =>
                t.amount === data.amount &&
                t.description === data.description &&
                new Date(t.createdAt) > twoMinutesAgo
            ).length || 0;
          return duplicates > 0;
        },
        severity: 'MEDIUM',
        description: "Possible duplicate transaction detected",
      },
      {
        name: "blacklist_recipient",
        check: (data, history) => history.isBlacklistedRecipient === true,
        severity: 'CRITICAL',
        description: "Transfer to blacklisted recipient detected",
      },
    ];
  }

  /** Queue a transaction for fraud checking */
  async checkTransaction(data: FraudCheckData) {
    try {
      await this.fraudQueue.add(data, {
        priority: 1,
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      });
    } catch (error) {
      this.logger.error("Failed to queue fraud check:", error);
    }
  }

  /** Perform fraud checks on transaction */
  async performFraudCheck(data: FraudCheckData): Promise<void> {
    try {
      this.logger.log(`Checking transaction ${data.transactionId} for user ${data.userId}`);
      const userHistory = await this.getUserTransactionHistory(data.userId);

      const triggeredRules: Array<{ rule: FraudRule; triggered: boolean }> = [];
      for (const rule of this.fraudRules) {
        try {
          const triggered = rule.check(data, userHistory);
          triggeredRules.push({ rule, triggered });
          if (triggered) this.logger.warn(`Fraud rule triggered: ${rule.name}`);
        } catch (err) {
          this.logger.error(`Error in fraud rule ${rule.name}:`, err);
        }
      }

      const criticalRules = triggeredRules.filter(
        (t) => t.triggered && t.rule.severity === 'CRITICAL'
      );
      const highRules = triggeredRules.filter(
        (t) => t.triggered && t.rule.severity === 'HIGH'
      );

      if (criticalRules.length || highRules.length) {
        await this.createFraudAlerts(data, criticalRules.length ? criticalRules : highRules);
      }
    } catch (error) {
      this.logger.error(`Fraud check failed for transaction ${data.transactionId}:`, error);
    }
  }

  /** Get user transaction history */
  private async getUserTransactionHistory(userId: string) {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600000);

    const [recentTransactions, sentTransfers, wallet, allTransactions] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { userId, createdAt: { gte: oneHourAgo } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      this.prisma.walletTransfer.findMany({
        where: { senderId: userId, createdAt: { gte: oneHourAgo } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      this.prisma.wallet.findUnique({ where: { userId } }),
      this.prisma.walletTransaction.findMany({
        where: { userId, createdAt: { gte: thirtyDaysAgo }, status: 'SUCCESS' },
      }),
    ]);

    const successfulAmounts = allTransactions.map((t) => Number(t.amount));
    const averageTransaction =
      successfulAmounts.length > 0
        ? successfulAmounts.reduce((sum, amount) => sum + amount, 0) / successfulAmounts.length
        : 0;

    return {
      recentTransactions,
      sentTransfers,
      wallet,
      averageTransaction,
      isBlacklistedRecipient: false,
      failedLogins: [],
    };
  }

  /** Create fraud alerts */
  private async createFraudAlerts(
    data: FraudCheckData,
    triggeredRules: Array<{ rule: FraudRule; triggered: boolean }>
  ): Promise<void> {
    const highestSeverity = triggeredRules.reduce(
      (max, t) => (t.rule.severity > max ? t.rule.severity : max),
      'LOW'
    );

    const alert = await this.prisma.fraudAlert.create({
      data: {
        userId: data.userId,
        severity: highestSeverity as any,
        status: 'OPEN',
        description: triggeredRules.map((t) => t.rule.description).join(", "),
        rule: triggeredRules.map((t) => t.rule.name).join(", "),
      },
    });

    await this.createNotification(data.userId, alert.id, highestSeverity);

    if (highestSeverity === 'CRITICAL') {
      await this.blockTransaction(data.transactionId);
    }
  }

  /** Block critical transaction */
  private async blockTransaction(transactionId: string): Promise<void> {
    try {
      await this.prisma.walletTransaction.update({
        where: { id: transactionId },
        data: { status: 'CANCELLED' },
      });
      this.logger.warn(`Transaction ${transactionId} blocked due to fraud`);
    } catch (error) {
      this.logger.error(`Failed to block transaction ${transactionId}:`, error);
    }
  }

  /** Create notification for fraud alert */
  private async createNotification(
    userId: string,
    alertId: string,
    severity: string
  ): Promise<void> {
    try {
      await this.prisma.document.create({
        data: {
          userId,
          type: 'OTHER',
          fileName: 'NOTIFICATION',
          fileSize: 0,
          mimeType: 'application/json',
          fileUrl: JSON.stringify({
            type: 'ALERT',
            title: "Fraud Alert",
            body: `Suspicious activity detected on your account. Severity: ${severity}`,
            metadata: { alertId, severity }
          }),
        },
      });
    } catch (error) {
      this.logger.error("Failed to create fraud notification:", error);
    }
  }

  /** Get fraud alerts for user */
  async getUserFraudAlerts(userId?: string) {
    return this.prisma.fraudAlert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  /** Resolve fraud alert */
  async getFraudAlert(alertId: string) {
    return this.prisma.fraudAlert.findUnique({
      where: { id: alertId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  }

  async getFraudStatistics() {
    const [totalAlerts, pendingAlerts, resolvedAlerts, criticalAlerts] = await Promise.all([
      this.prisma.fraudAlert.count(),
      this.prisma.fraudAlert.count({ where: { status: 'OPEN' } }),
      this.prisma.fraudAlert.count({ where: { status: 'RESOLVED' } }),
      this.prisma.fraudAlert.count({ where: { severity: 'CRITICAL' } }),
    ])

    return {
      totalAlerts,
      pendingAlerts,
      resolvedAlerts,
      criticalAlerts,
      resolutionRate: totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 0,
    }
  }

  async resolveFraudAlert(alertId: string, resolution: string, resolvedBy: string) {
    // Get existing fraud alert document
    const alertDoc = await this.prisma.document.findUnique({
      where: { id: alertId }
    })

    if (!alertDoc || alertDoc.fileName !== 'FRAUD_ALERT') {
      throw new Error('Fraud alert not found')
    }

    const alertData = JSON.parse(alertDoc.fileUrl || '{}')
    alertData.status = 'RESOLVED'
    alertData.reviewedAt = new Date()
    alertData.reviewedBy = resolvedBy
    alertData.action = resolution

    return this.prisma.document.update({
      where: { id: alertId },
      data: {
        fileUrl: JSON.stringify(alertData),
      },
    });
  }
}
