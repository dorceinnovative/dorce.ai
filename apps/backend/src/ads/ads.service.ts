import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationService } from '../notification/notification.service'
import { TelecomAggregatorService } from '../telecom/telecom-aggregator.service'
import { WalletService } from '../wallets/wallet.service'
import { TelecomIntentService } from '../telecom/telecom-intent.service'

@Injectable()
export class AdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: NotificationService,
    private readonly telecom: TelecomAggregatorService,
    private readonly wallet: WalletService,
    private readonly telecomIntent: TelecomIntentService
  ) {}

  async createCampaign(data: any) {
    const record = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `ads-campaign-${Date.now()}`,
        fileUrl: JSON.stringify({ subtype: 'ADS_CAMPAIGN', ...data, status: 'DRAFT' }),
        fileSize: 1024,
        mimeType: 'application/json',
        userId: data.userId || 'system'
      }
    })
    return record
  }

  async startCampaign(id: string) {
    const existing = await this.prisma.document.findUnique({ where: { id } })
    const payload = existing?.fileUrl ? JSON.parse(existing.fileUrl as any) : {}
    const userId = payload?.userId
    let status = 'ACTIVE'
    const minBudget = Number(payload?.minBudget ?? 10000)
    if (userId) {
      try {
        const w = await this.wallet.getWallet(userId)
        const balance = Number(w.balance)
        if (balance < minBudget) {
          status = 'INSUFFICIENT_FUNDS'
        }
      } catch {}
    }
    const updated = await this.prisma.document.update({
      where: { id },
      data: { fileUrl: JSON.stringify({ ...payload, status }) }
    })
    return updated
  }

  async stopCampaign(id: string) {
    const campaign = await this.prisma.document.update({
      where: { id },
      data: { fileUrl: await this.updateStatusField(id, 'PAUSED') }
    })
    return campaign
  }

  private async updateStatusField(id: string, status: string) {
    const existing = await this.prisma.document.findUnique({ where: { id } })
    const payload = existing?.fileUrl ? JSON.parse(existing.fileUrl as any) : {}
    return JSON.stringify({ ...payload, status })
  }

  async deliver(id: string, payload: any) {
    const target = payload?.target || {}
    const message = payload?.message || ''
    const userId = payload?.userId || 'system'
    let cost = 0
    // Optional intent tagging
    // optional intent tagging could be added here via TelecomIntentService if available
    if (target?.phone) {
      await this.notify.sendNotification({
        userId: userId,
        type: 'GENERAL',
        title: payload?.subject || 'Campaign',
        message,
        channels: ['sms']
      })
      cost += 5000
    }
    if (target?.email) {
      await this.notify.sendNotification({
        userId: userId,
        type: 'GENERAL',
        title: payload?.subject || 'Campaign',
        message,
        channels: ['email'],
        metadata: { email: target.email }
      })
      cost += 2000
    }
    if (target?.pushUserId) {
      await this.notify.sendNotification({
        userId: target.pushUserId,
        type: 'GENERAL',
        title: payload?.subject || 'Campaign',
        message,
        channels: ['push']
      })
      cost += 1000
    }
    if (target?.whatsapp) {
      await this.notify.sendNotification({
        userId,
        type: 'GENERAL',
        title: payload?.subject || 'Campaign',
        message,
        channels: ['whatsapp'],
        metadata: { whatsapp: target.whatsapp }
      })
      cost += 5000
    }
    if (cost > 0 && userId !== 'system') {
      try {
        await this.wallet.withdrawFromWallet(userId, { amount: cost, description: `ADS_DELIVERY_${id}` })
      } catch {}
    }
    const event = await this.trackEvent({ type: 'DELIVERED', campaignId: id, target, timestamp: new Date().toISOString() })
    return { delivered: true, event }
  }

  async trackEvent(event: any) {
    const record = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `ads-event-${Date.now()}`,
        fileUrl: JSON.stringify({ subtype: 'ADS_EVENT', ...event }),
        fileSize: 512,
        mimeType: 'application/json',
        userId: event.userId || 'system'
      }
    })
    return record
  }

  async getCampaign(id: string) {
    return this.prisma.document.findUnique({ where: { id } })
  }

  async createSegment(data: any) {
    const record = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `ads-segment-${Date.now()}`,
        fileUrl: JSON.stringify({ subtype: 'ADS_SEGMENT', ...data }),
        fileSize: 512,
        mimeType: 'application/json',
        userId: data.userId || 'system'
      }
    })
    return record
  }

  async listSegments(userId?: string) {
    return this.prisma.document.findMany({
      where: {
        type: 'OTHER',
        fileName: { contains: 'ads-segment' },
        ...(userId ? { userId } : {})
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async trackClick(event: any) {
    const record = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `ads-click-${Date.now()}`,
        fileUrl: JSON.stringify({ subtype: 'ADS_CLICK', ...event }),
        fileSize: 256,
        mimeType: 'application/json',
        userId: event.userId || 'system'
      }
    })
    return record
  }

  async trackConversion(event: any) {
    const record = await this.prisma.document.create({
      data: {
        type: 'OTHER',
        fileName: `ads-conversion-${Date.now()}`,
        fileUrl: JSON.stringify({ subtype: 'ADS_CONVERSION', ...event }),
        fileSize: 256,
        mimeType: 'application/json',
        userId: event.userId || 'system'
      }
    })
    return record
  }

  async deliverBulk(id: string, payloads: any[]) {
    const results: any[] = []
    for (const p of payloads) {
      const r = await this.deliver(id, p)
      results.push(r)
    }
    return { delivered: results.length, results }
  }
}
