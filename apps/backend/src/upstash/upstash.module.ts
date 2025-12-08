import { Module, Global } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { UpstashService } from './upstash.service'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'UPSTASH_REDIS',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('UPSTASH_REDIS_REST_URL')
        const token = configService.get<string>('UPSTASH_REDIS_REST_TOKEN')
        
        if (!url || !token) {
          console.warn('Upstash Redis credentials not found, falling back to local Redis')
          return null
        }
        
        return new Redis({
          url,
          token,
        })
      },
    },
    {
      provide: 'UPSTASH_RATELIMIT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('UPSTASH_REDIS_REST_URL')
        const token = configService.get<string>('UPSTASH_REDIS_REST_TOKEN')
        
        if (!url || !token) {
          console.warn('Upstash Redis credentials not found, rate limiting disabled')
          return null
        }
        
        return new Ratelimit({
          redis: new Redis({ url, token }),
          limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
          analytics: true,
        })
      },
    },
    UpstashService,
  ],
  exports: ['UPSTASH_REDIS', 'UPSTASH_RATELIMIT', UpstashService],
})
export class UpstashModule {}