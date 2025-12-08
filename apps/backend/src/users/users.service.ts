import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        kyc: true,
      },
    })
  }

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    })
  }

  async blockUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isBlocked: true },
    })
  }

  async unblockUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isBlocked: false },
    })
  }
}
