import { Module } from '@nestjs/common'
import { IntegrationService } from './integration.service'
import { IntegrationController } from './integration.controller'
import { SupabaseModule } from '../supabase/supabase.module'
import { OpenRouterModule } from '../openrouter/openrouter.module'
import { UpstashModule } from '../upstash/upstash.module'
import { AuthModule } from '../auth/auth.module'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [
    SupabaseModule,
    OpenRouterModule,
    UpstashModule,
    AuthModule,
    PrismaModule,
  ],
  controllers: [IntegrationController],
  providers: [IntegrationService],
  exports: [IntegrationService],
})
export class IntegrationModule {}