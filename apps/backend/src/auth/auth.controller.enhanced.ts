import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  BadRequestException, 
  UnauthorizedException,
  UseGuards,
  Get,
  Param,
  Delete,
  Req,
  Headers
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger"
import { AuthService } from "./auth.service"
import type { AuthResponse } from "./auth.service"
import { RegisterDto } from "./dto/register.dto"
import { LoginDto } from "./dto/login.dto"
import { OtpVerifyDto } from "./dto/otp-verify.dto"
import { BiometricAuthService, BiometricTemplate, BiometricVerificationResult } from "./biometric-auth.service"
import { TwoFactorAuthService, TwoFactorSetupResult, TwoFactorVerificationResult, BackupCodeVerificationResult } from "./two-factor-auth.service"
import { SessionService, SessionInfo, CreateSessionResult, DeviceInfo } from "./session.service"
import { RateLimitService } from "./rate-limit.service"
import { JwtAuthGuard } from "./jwt-auth.guard"
import { CurrentUser } from "./decorators/current-user.decorator"
import { Roles } from "./decorators/roles.decorator"
import { RolesGuard } from "./guards/roles.guard"

@ApiTags("auth")
@Controller("api/auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private biometricAuthService: BiometricAuthService,
    private twoFactorAuthService: TwoFactorAuthService,
    private sessionService: SessionService,
    private rateLimitService: RateLimitService
  ) {}

  // Enhanced Authentication Endpoints
  @Post("register")
  @HttpCode(201)
  @ApiOperation({ summary: "Register a new user with email and phone" })
  async register(
    @Body() registerDto: RegisterDto,
    @Headers('x-forwarded-for') ipAddress?: string,
    @Headers('user-agent') userAgent?: string
  ): Promise<AuthResponse> {
    // Check registration rate limit
    const rateLimitResult = await this.rateLimitService.checkRegistrationRateLimit(
      ipAddress || 'unknown',
      registerDto.email,
      registerDto.phone
    )

    if (!rateLimitResult.allowed) {
      throw new BadRequestException("Registration rate limit exceeded. Please try again later.")
    }

    try {
      const result = await this.authService.register(registerDto)
      
      // Record successful registration
      await this.rateLimitService.recordAttempt(
        registerDto.email || registerDto.phone,
        'registration',
        true
      )

      return result
    } catch (error) {
      // Record failed registration attempt
      await this.rateLimitService.recordAttempt(
        registerDto.email || registerDto.phone,
        'registration',
        false
      )
      throw error
    }
  }

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Login with email/phone and password" })
  async login(
    @Body() loginDto: LoginDto,
    @Headers('x-forwarded-for') ipAddress?: string,
    @Headers('user-agent') userAgent?: string
  ): Promise<AuthResponse> {
    // Check login rate limit
    const rateLimitResult = await this.rateLimitService.checkLoginRateLimit(
      loginDto.email,
      { byEmail: true, byIP: !!ipAddress }
    )

    if (!rateLimitResult.allowed) {
      // Record failed attempt
      await this.rateLimitService.recordAttempt(loginDto.email, 'login_by_email', false)
      if (ipAddress) {
        await this.rateLimitService.recordAttempt(ipAddress, 'login_by_ip', false)
      }
      
      throw new UnauthorizedException("Too many login attempts. Please try again later.")
    }

    try {
      const result = await this.authService.login(loginDto)
      
      if (!result) {
        // Record failed login attempt
        await this.rateLimitService.recordAttempt(loginDto.email, 'login_by_email', false)
        if (ipAddress) {
          await this.rateLimitService.recordAttempt(ipAddress, 'login_by_ip', false)
        }
        
        throw new UnauthorizedException("Invalid credentials")
      }

      // Record successful login
      await this.rateLimitService.recordAttempt(loginDto.email, 'login_by_email', true)
      if (ipAddress) {
        await this.rateLimitService.recordAttempt(ipAddress, 'login_by_ip', true)
      }

      // Create session
      const deviceInfo: DeviceInfo = {
        userAgent: userAgent || 'unknown',
        ipAddress: ipAddress || 'unknown',
        deviceFingerprint: this.sessionService.generateDeviceFingerprint({
          userAgent: userAgent || 'unknown',
          ipAddress: ipAddress || 'unknown'
        })
      }

      const sessionResult = await this.sessionService.createSession(
        result.user.id,
        deviceInfo
      )

      return {
        ...result,
        refreshToken: sessionResult.refreshToken
      }
    } catch (error) {
      // Record failed login attempt
      await this.rateLimitService.recordAttempt(loginDto.email, 'login_by_email', false)
      if (ipAddress) {
        await this.rateLimitService.recordAttempt(ipAddress, 'login_by_ip', false)
      }
      
      throw error
    }
  }

  // Biometric Authentication Endpoints
  @Post("biometric/enroll")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Enroll biometric authentication" })
  async enrollBiometric(
    @CurrentUser() user: any,
    @Body() biometricData: BiometricTemplate
  ): Promise<{
    success: boolean
    templateId: string
    qualityScore: number
    attempts: number
    message: string
  }> {
    return this.biometricAuthService.enrollBiometric(user.id, biometricData)
  }

  @Post("biometric/verify")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Verify biometric authentication" })
  async verifyBiometric(
    @CurrentUser() user: any,
    @Body() biometricData: BiometricTemplate,
    @Body("allowFallback") allowFallback?: boolean,
    @Body("maxAttempts") maxAttempts?: number
  ): Promise<BiometricVerificationResult> {
    // Check biometric rate limit
    const rateLimitResult = await this.rateLimitService.checkBiometricRateLimit(
      user.id,
      biometricData.type
    )

    if (!rateLimitResult.allowed) {
      throw new BadRequestException("Too many biometric verification attempts. Please try again later.")
    }

    try {
      const result = await this.biometricAuthService.verifyBiometric(
        user.id,
        biometricData,
        { allowFallback, maxAttempts }
      )

      // Record attempt
      await this.rateLimitService.recordAttempt(
        `${user.id}_${biometricData.type}`,
        'biometric_verification',
        result.success
      )

      return result
    } catch (error) {
      // Record failed attempt
      await this.rateLimitService.recordAttempt(
        `${user.id}_${biometricData.type}`,
        'biometric_verification',
        false
      )
      throw error
    }
  }

  // Two-Factor Authentication Endpoints
  @Post("2fa/setup")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Setup two-factor authentication" })
  async setupTwoFactor(
    @CurrentUser() user: any,
    @Body("method") method: 'totp' | 'sms' | 'email'
  ): Promise<TwoFactorSetupResult> {
    return this.twoFactorAuthService.setupTwoFactor(user.id, method)
  }

  @Post("2fa/verify")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Verify two-factor authentication code" })
  async verifyTwoFactor(
    @CurrentUser() user: any,
    @Body("code") code: string,
    @Body("method") method?: 'totp' | 'sms' | 'email'
  ): Promise<TwoFactorVerificationResult> {
    return this.twoFactorAuthService.verifyTwoFactor(user.id, code, method)
  }
}