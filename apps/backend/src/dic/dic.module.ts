import { Module } from '@nestjs/common';
import { DICService } from './dic.service';
import { DICController } from './dic.controller';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [OpenAIModule],
  controllers: [DICController],
  providers: [DICService],
  exports: [DICService],
})
export class DICModule {}

export * from './dic.service';