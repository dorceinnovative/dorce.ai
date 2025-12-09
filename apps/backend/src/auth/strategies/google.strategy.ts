import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, Profile } from 'passport-google-oauth20'
import { PrismaService } from '../../prisma/prisma.service'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly prisma: PrismaService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://dorce.ai/api/auth/google/callback',
      scope: ['profile', 'email'],
    })
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0]?.value
    const firstName = profile.name?.givenName
    const lastName = profile.name?.familyName
    if (!email) return null

    let user = await this.prisma.user.findUnique({ where: { email }, include: { wallet: true } })
    if (!user) {
      const tempPassword = Math.random().toString(36).slice(2)
      const passwordHash = await bcrypt.hash(tempPassword, 12)
      user = await this.prisma.user.create({
        data: {
          email,
          phone: `+000${Math.floor(Math.random()*1e9)}`,
          passwordHash,
          firstName,
          lastName,
          role: 'USER',
          emailVerified: true,
          wallet: { create: { balance: 0 } },
        },
        include: { wallet: true }
      })
    } else if (!user.emailVerified) {
      await this.prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } })
    }

    return { id: user.id, email: user.email, role: user.role }
  }
}

