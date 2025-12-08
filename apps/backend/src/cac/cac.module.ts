import { Module } from '@nestjs/common';
import { CACController } from './cac.controller';
import { CACAutomationService } from '../services/cac-automation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationService } from '../notification/notification.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [CACController],
  providers: [
    CACAutomationService,
    NotificationService,
  ],
  exports: [
    CACAutomationService,
    NotificationService,
  ],
})
export class CACModule {}