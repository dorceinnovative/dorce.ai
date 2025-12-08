import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VendorOnboardingSimpleService } from '../services/vendor-onboarding-simple.service';

class CreateStoreDto {
  name: string;
  slug: string;
  description: string;
  logo?: string;
  banner?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

class UpdateStoreSettingsDto {
  currency?: string;
  timezone?: string;
  language?: string;
  taxRate?: number;
  commissionRate?: number;
  minimumOrderAmount?: number;
  maximumOrderAmount?: number;
  autoAcceptOrders?: boolean;
  requirePhoneVerification?: boolean;
  requireEmailVerification?: boolean;
}

@Controller('vendor')
@UseGuards(JwtAuthGuard)
export class VendorController {
  constructor(
    private vendorService: VendorOnboardingSimpleService,
  ) {}

  @Post('store')
  @HttpCode(HttpStatus.CREATED)
  async createStore(@Request() req, @Body() createStoreDto: CreateStoreDto) {
    const result = await this.vendorService.createStore(req.user.id, createStoreDto);
    return {
      success: true,
      message: 'Store created successfully',
      data: result,
    };
  }

  @Get('store')
  async getStore(@Request() req) {
    const store = await this.vendorService.getStoreByVendor(req.user.id);
    return {
      success: true,
      data: store,
    };
  }

  @Put('store/settings')
  async updateStoreSettings(@Request() req, @Body() settingsDto: UpdateStoreSettingsDto) {
    const store = await this.vendorService.getStoreByVendor(req.user.id);
    const result = await this.vendorService.updateStoreSettings(req.user.id, store.id, settingsDto);
    return {
      success: true,
      message: 'Store settings updated successfully',
      data: result,
    };
  }

  @Get('dashboard')
  async getDashboard(@Request() req) {
    const dashboard = await this.vendorService.getVendorDashboard(req.user.id);
    return {
      success: true,
      data: dashboard,
    };
  }
}