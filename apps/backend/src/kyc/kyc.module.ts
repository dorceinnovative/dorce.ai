import { Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { KycController } from "./kyc.controller"

@Module({
  imports: [PrismaModule],
  controllers: [KycController],
})
export class KycModule {}

