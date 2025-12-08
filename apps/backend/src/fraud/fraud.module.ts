import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { PrismaModule } from "../prisma/prisma.module";
import { FraudService } from "./fraud.service";
import { FraudProcessor } from "./fraud.processor";
import { FraudController } from "./fraud.controller";

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: "fraud-detection",
      redis:
        (process.env.REDIS_URL as string) || {
          host: process.env.REDIS_HOST || "localhost",
          port: parseInt(process.env.REDIS_PORT || "6379", 10),
          password: process.env.REDIS_PASSWORD,
        },
    }),
  ],
  controllers: [FraudController],
  providers: [FraudService, FraudProcessor],
  exports: [FraudService],
})
export class FraudModule {}
