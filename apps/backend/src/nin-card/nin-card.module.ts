import { Module } from '@nestjs/common';
import { NinCardController } from '../controllers/nin-card.controller';
import { NinCardService } from '../services/nin-card.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentModule } from '../payment/payment.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, PaymentModule, NotificationModule],
  controllers: [NinCardController],
  providers: [NinCardService],
  exports: [NinCardService],
})
export class NinCardModule {}