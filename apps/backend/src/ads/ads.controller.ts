import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import { AdsService } from './ads.service'

@Controller('ads')
export class AdsController {
  constructor(private readonly ads: AdsService) {}

  @Post('campaigns')
  async createCampaign(@Body() data: any) {
    return this.ads.createCampaign(data)
  }

  @Post('campaigns/:id/start')
  async startCampaign(@Param('id') id: string) {
    return this.ads.startCampaign(id)
  }

  @Post('campaigns/:id/stop')
  async stopCampaign(@Param('id') id: string) {
    return this.ads.stopCampaign(id)
  }

  @Post('deliver/:id')
  async deliver(@Param('id') id: string, @Body() payload: any) {
    return this.ads.deliver(id, payload)
  }

  @Post('deliver-bulk/:id')
  async deliverBulk(@Param('id') id: string, @Body() body: any) {
    const payloads = Array.isArray(body?.items) ? body.items : []
    return this.ads.deliverBulk(id, payloads)
  }

  @Post('deliver-ussd/:id')
  async deliverUssd(@Param('id') id: string, @Body() payload: any) {
    const code = payload?.code || '*123#'
    const message = payload?.message || 'Welcome'
    return this.ads.trackEvent({ type: 'USSD_PUSH', campaignId: id, code, message, ts: Date.now() })
  }

  @Post('events')
  async trackEvent(@Body() event: any) {
    return this.ads.trackEvent(event)
  }

  @Post('clicks')
  async trackClick(@Body() event: any) {
    return this.ads.trackClick(event)
  }

  @Post('conversions')
  async trackConversion(@Body() event: any) {
    return this.ads.trackConversion(event)
  }

  @Post('segments')
  async createSegment(@Body() data: any) {
    return this.ads.createSegment(data)
  }

  @Get('segments')
  async listSegments() {
    return this.ads.listSegments()
  }

  @Get('campaigns/:id')
  async getCampaign(@Param('id') id: string) {
    return this.ads.getCampaign(id)
  }

  @Get('pixel.gif')
  async pixel(@Query() q: any, @Res() res: Response) {
    await this.ads.trackEvent({ type: 'PIXEL', campaignId: q.cid, url: q.u, ts: Date.now() })
    const gif = Buffer.from(
      '47494638396101000100f70000ffffff0000002c00000000010001000002' +
        '0244010003',
      'hex'
    )
    res.setHeader('Content-Type', 'image/gif')
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    res.send(gif)
  }
}
