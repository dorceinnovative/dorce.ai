import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NinController } from './nin.controller';
import { NIMCCloneService } from './nimc-clone.service';
import { NinTemplateService } from './nin-template.service';
import { NotificationModule } from '../notification/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    NotificationModule,
    PrismaModule,
    AuthModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [NinController],
  providers: [NIMCCloneService, NinTemplateService],
  exports: [NIMCCloneService, NinTemplateService],
})
export class NinModule {}
