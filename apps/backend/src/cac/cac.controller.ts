import { Controller, Post, Body, UseGuards, Request, Param, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CACAutomationService } from '../services/cac-automation.service';

@ApiTags('CAC Registration')
@Controller('cac')
export class CACController {
  constructor(private readonly cacService: CACAutomationService) {}

  @Post('check-name')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async checkNameAvailability(@Body() body: { businessName: string }) {
    const result = await this.cacService.checkNameAvailability(body.businessName);
    return { success: true, data: result };
  }

  @Post('applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async submitRegistration(@Request() req, @Body() data: any) {
    const trackingNumber = await this.cacService.submitRegistration(req.user.id, data);
    return { success: true, data: { trackingNumber } };
  }

  @Get('applications/:trackingNumber/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getStatus(@Param('trackingNumber') trackingNumber: string) {
    const status = await this.cacService.getRegistrationStatus(trackingNumber);
    return { success: true, data: status };
  }
}