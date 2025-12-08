import { Injectable, BadRequestException, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import * as bcrypt from "bcryptjs"
import { PrismaService } from "../prisma/prisma.service"
import { RegisterDto } from "./dto/register.dto"
import { LoginDto } from "./dto/login.dto"
import { OtpVerifyDto } from "./dto/otp-verify.dto"
import { UsersService } from "../users/users.service"
import { JwtSecretService } from "./jwt-secret.service"

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    phone: string
    role: string
    firstName?: string
    lastName?: string
  }
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
    private jwtSecretService: JwtSecretService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, phone, password, firstName, lastName } = registerDto

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { 
        OR: [{ email }, { phone }] 
      }
    })

    if (existingUser) {
      throw new BadRequestException("User with this email or phone already exists")
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user with wallet
    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        firstName,
        lastName,
        role: "USER",
        wallet: { 
          create: { 
            balance: 0
          } 
        },
      },
      include: {
        wallet: true
      }
    })

    return this.generateAuthResponse(user)
  }

  async login(loginDto: LoginDto): Promise<AuthResponse | null> {
    const { email, password } = loginDto
    
    // Find user by email
    const user = await this.prisma.user.findUnique({ 
      where: { email },
      include: { wallet: true }
    })
    
    if (!user) return null

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) return null

    // Check if user is blocked
    if (user.isBlocked) {
      throw new UnauthorizedException("Your account has been blocked. Please contact support.")
    }

    return this.generateAuthResponse(user)
  }

  async sendOtp(contact: string, type: "email" | "phone"): Promise<{ message: string }> {
    // Generate secure OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store OTP in database with expiration (15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    
    await this.prisma.oTP.upsert({
      where: { 
        contact 
      },
      update: { 
        code: otp, 
        expiresAt,
        attempts: 0 
      },
      create: { 
        contact, 
        code: otp, 
        expiresAt,
        attempts: 0 
      }
    })

    // In production, send via SMS/Email service
    // For now, return success message (don't expose OTP in production)
    return { 
      message: `OTP sent to ${contact}. Please check your ${type}.` 
    }
  }

  async verifyOtp(otpVerifyDto: OtpVerifyDto): Promise<AuthResponse | null> {
    const { contact, code } = otpVerifyDto
    
    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      return null
    }

    // Find OTP record
    const otpRecord = await this.prisma.oTP.findUnique({
      where: { contact }
    })

    if (!otpRecord) {
      return null
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await this.prisma.oTP.delete({ where: { contact } })
      return null
    }

    // Check if max attempts reached
    if (otpRecord.attempts >= 3) {
      await this.prisma.oTP.delete({ where: { contact } })
      return null
    }

    // Validate OTP code
    if (otpRecord.code !== code) {
      // Increment attempts
      await this.prisma.oTP.update({
        where: { contact },
        data: { attempts: otpRecord.attempts + 1 }
      })
      return null
    }

    // OTP is valid - find or create user
    let user = await this.prisma.user.findFirst({ 
      where: { phone: contact },
      include: { wallet: true }
    })

    if (!user) {
      // Create new user for phone authentication
      const tempPassword = this.generateSecureTempPassword()
      const passwordHash = await bcrypt.hash(tempPassword, 12)

      user = await this.prisma.user.create({
        data: {
          email: `${contact}@user.dorce.ai`, // Generate secure email
          phone: contact,
          passwordHash,
          role: "USER",
          phoneVerified: true,
          wallet: { 
            create: { 
              balance: 0
            } 
          },
        },
        include: { wallet: true }
      })
    }

    // Clean up used OTP
    await this.prisma.oTP.delete({ where: { contact } })

    return this.generateAuthResponse(user)
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    try {
      const secret = this.jwtSecretService.getRefreshSecretForToken(refreshToken) || this.jwtSecretService.getOrGenerateSecrets().refreshSecret
      const payload = this.jwtService.verify(refreshToken, {
        secret,
      })
      
      const user = await this.prisma.user.findUnique({ 
        where: { id: payload.sub },
        include: { wallet: true }
      })
      
      if (!user) {
        throw new UnauthorizedException("User not found")
      }

      return this.generateAuthResponse(user)
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token")
    }
  }

  private async generateAuthResponse(user: any): Promise<AuthResponse> {
    // Generate JWT tokens
    const accessPayload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    }
    const refreshPayload = { sub: user.id }

    const activeKey = this.jwtSecretService.getActiveKey()
    const secrets = this.jwtSecretService.getOrGenerateSecrets()

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: secrets.accessSecret,
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
      keyid: activeKey?.kid
    })
    
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: secrets.refreshSecret,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      keyid: activeKey?.kid
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    }
  }

  private generateSecureTempPassword(): string {
    // Generate cryptographically secure temporary password
    const length = 16
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      password += charset[randomIndex]
    }
    
    return password
  }
}
