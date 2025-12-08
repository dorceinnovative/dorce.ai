import { Module } from '@nestjs/common';
import { OSKernelService } from './os-kernel.service';
import { OSController } from './os.controller';

@Module({
  controllers: [OSController],
  providers: [OSKernelService],
  exports: [OSKernelService],
})
export class OSModule {}

export * from './os-kernel.service';