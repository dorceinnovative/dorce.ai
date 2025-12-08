import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { OpenRouterService } from './openrouter.service'
import { AuthModule } from '../auth/auth.module'
import { UpstashModule } from '../upstash/upstash.module'

@Module({
  imports: [ConfigModule, AuthModule, UpstashModule],
  providers: [OpenRouterService],
  exports: [OpenRouterService],
})
export class OpenRouterModule {}