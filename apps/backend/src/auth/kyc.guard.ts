import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class KycGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const user = req.user
    if (!user) throw new ForbiddenException('Unauthorized')
    const full = await this.prisma.user.findUnique({ where: { id: user.id }, include: { kyc: true } })
    const approved = full?.kyc?.status === 'APPROVED'
    if (!approved) throw new ForbiddenException('KYC required to use this service')
    return true
  }
}

