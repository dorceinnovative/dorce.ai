import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { NinVerificationService, NinVerificationResponse } from '../services/nin-verification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/nin-verification')
export class NinVerificationController {
  constructor(private readonly ninVerificationService: NinVerificationService) {}

  /**
   * Verify NIN number
   * POST /api/nin-verification/verify
   */
  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verifyNin(
    @Body() body: { nin: string; paymentMethod?: string },
    @Req() req: any
  ): Promise<NinVerificationResponse> {
    const userId = req.user.id;
    const { nin, paymentMethod = 'WALLET' } = body;

    return this.ninVerificationService.verifyNin(userId, nin, paymentMethod);
  }

  /**
   * Get verification history
   * GET /api/nin-verification/history
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getVerificationHistory(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<any> {
    const userId = req.user.id;

    return this.ninVerificationService.getVerificationHistory(userId, page || 1, limit || 10);
  }

  /**
   * Get verification details
   * GET /api/nin-verification/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getVerificationDetails(
    @Param('id') verificationId: string,
    @Req() req: any
  ): Promise<NinVerificationResponse> {
    const userId = req.user.id;

    return this.ninVerificationService.getVerificationDetails(userId, verificationId);
  }

  /**
   * Download verification slip
   * GET /api/nin-verification/:id/slip
   */
  @Get(':id/slip')
  @UseGuards(JwtAuthGuard)
  async downloadVerificationSlip(
    @Param('id') verificationId: string,
    @Req() req: any
  ): Promise<any> {
    const userId = req.user.id;

    return this.ninVerificationService.downloadVerificationSlip(userId, verificationId);
  }
}