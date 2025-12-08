import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { createClient } from '@supabase/supabase-js'
import { SupabaseService } from './supabase.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [ConfigModule, AuthModule],
  providers: [
    {
      provide: 'SUPABASE_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const supabaseUrl = configService.get<string>('SUPABASE_URL')
        const supabaseKey = configService.get<string>('SUPABASE_ANON_KEY')
        const serviceRoleKey = configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase URL and Anon Key are required')
        }
        
        return createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
          global: {
            headers: {
              'X-Client-Info': 'dorce-ai-backend/1.0.0',
            },
          },
        })
      },
    },
    {
      provide: 'SUPABASE_ADMIN_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const supabaseUrl = configService.get<string>('SUPABASE_URL')
        const serviceRoleKey = configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')
        
        if (!supabaseUrl || !serviceRoleKey) {
          throw new Error('Supabase URL and Service Role Key are required for admin operations')
        }
        
        return createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
          global: {
            headers: {
              'X-Client-Info': 'dorce-ai-backend/1.0.0-admin',
            },
          },
        })
      },
    },
    SupabaseService,
  ],
  exports: ['SUPABASE_CLIENT', SupabaseService],
})
export class SupabaseModule {}