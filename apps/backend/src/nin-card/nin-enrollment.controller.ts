import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NinEnrollmentService, EnrollmentResponse } from '../services/nin-enrollment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/nin-enrollment')
export class NinEnrollmentController {
  constructor(private readonly ninEnrollmentService: NinEnrollmentService) {}

  /**
   * Create new NIN enrollment
   * POST /api/nin-enrollment/create
   */
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createEnrollment(
    @Body() body: {
      firstName: string;
      lastName: string;
      middleName?: string;
      dateOfBirth: string;
      gender: 'MALE' | 'FEMALE';
      phoneNumber: string;
      email?: string;
      addressLine: string;
      town: string;
      lga: string;
      state: string;
      birthState: string;
      birthLGA: string;
      birthCountry: string;
      religion?: string;
      profession?: string;
      nextOfKinName?: string;
      nextOfKinPhone?: string;
      nextOfKinAddress?: string;
      biometrics: {
        fingerprintTemplates: string[];
        faceImage: string;
        signature: string;
      };
    },
    @Req() req: any
  ): Promise<EnrollmentResponse> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.ninEnrollmentService.createEnrollment(userId, body);
  }

  /**
   * Submit biometrics for enrollment
   * POST /api/nin-enrollment/:id/biometrics
   */
  @Post(':id/biometrics')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async submitBiometrics(
    @Param('id') enrollmentId: string,
    @UploadedFile() photo: any,
    @Body() body: {
      fingerprints: string[];
      signature: string;
    },
    @Req() req: any
  ): Promise<EnrollmentResponse> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const biometricData = {
      fingerprintTemplates: body.fingerprints,
      faceImage: photo?.buffer?.toString('base64') || '',
      signature: body.signature,
    };

    return this.ninEnrollmentService.submitBiometrics(userId, enrollmentId, biometricData);
  }

  /**
   * Complete enrollment with payment
   * PUT /api/nin-enrollment/:id/complete
   */
  @Put(':id/complete')
  @UseGuards(JwtAuthGuard)
  async completeEnrollment(
    @Param('id') enrollmentId: string,
    @Body() body: {
      paymentMethod: string;
      paymentReference?: string;
    },
    @Req() req: any
  ): Promise<EnrollmentResponse> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.ninEnrollmentService.completeEnrollment(enrollmentId, userId, body.paymentReference || '');
  }

  /**
   * Get enrollment status
   * GET /api/nin-enrollment/:id/status
   */
  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  async getEnrollmentStatus(
    @Param('id') enrollmentId: string,
    @Req() req: any
  ): Promise<EnrollmentResponse> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.ninEnrollmentService.getEnrollmentStatus(enrollmentId, userId);
  }

  /**
   * Get user enrollments
   * GET /api/nin-enrollment/user
   */
  @Get('user')
  @UseGuards(JwtAuthGuard)
  async getUserEnrollments(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<any> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.ninEnrollmentService.getUserEnrollments(userId, page || 1, limit || 10);
  }
}