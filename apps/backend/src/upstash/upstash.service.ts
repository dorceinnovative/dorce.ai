import { Injectable, Inject } from '@nestjs/common'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  nx?: boolean // Only set if key does not exist
  xx?: boolean // Only set if key exists
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

@Injectable()
export class UpstashService {
  constructor(
    @Inject('UPSTASH_REDIS') 
    private readonly redis: Redis | null,
    @Inject('UPSTASH_RATELIMIT')
    private readonly rateLimiter: Ratelimit | null
  ) {}

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.redis !== null
  }

  /**
   * Get a value by key
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null
    
    try {
      const value = await this.redis.get(key)
      return value as T | null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  /**
   * Set a value with optional TTL
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    if (!this.redis) return false
    
    try {
      if (options?.ttl) {
        await this.redis.setex(key, options.ttl, JSON.stringify(value))
      } else {
        await this.redis.set(key, JSON.stringify(value))
      }
      return true
    } catch (error) {
      console.error('Redis set error:', error)
      return false
    }
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<boolean> {
    if (!this.redis) return false
    
    try {
      const result = await this.redis.del(key)
      return result > 0
    } catch (error) {
      console.error('Redis del error:', error)
      return false
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.redis) return false
    
    try {
      const result = await this.redis.exists(key)
      return result > 0
    } catch (error) {
      console.error('Redis exists error:', error)
      return false
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    if (!this.redis) return 0
    
    try {
      return await this.redis.incr(key)
    } catch (error) {
      console.error('Redis incr error:', error)
      return 0
    }
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number> {
    if (!this.redis) return 0
    
    try {
      return await this.redis.decr(key)
    } catch (error) {
      console.error('Redis decr error:', error)
      return 0
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.redis) return false
    
    try {
      const result = await this.redis.expire(key, seconds)
      return result > 0
    } catch (error) {
      console.error('Redis expire error:', error)
      return false
    }
  }

  /**
   * Get TTL (time to live) for a key
   */
  async ttl(key: string): Promise<number> {
    if (!this.redis) return -2
    
    try {
      return await this.redis.ttl(key)
    } catch (error) {
      console.error('Redis ttl error:', error)
      return -2
    }
  }

  /**
   * Rate limiting check
   */
  async checkRateLimit(
    identifier: string, 
    limit?: number, 
    window?: string
  ): Promise<RateLimitResult> {
    if (!this.rateLimiter) {
      return { success: true, limit: 0, remaining: 0, reset: 0 }
    }

    try {
      const result = await this.rateLimiter.limit(identifier)
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      }
    } catch (error) {
      console.error('Rate limit error:', error)
      return { success: true, limit: 0, remaining: 0, reset: 0 }
    }
  }

  /**
   * Cache with automatic fallback
   */
  async cacheWithFallback<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600 // 1 hour default
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch fresh data
    const freshData = await fetcher()
    
    // Store in cache (don't await)
    this.set(key, freshData, { ttl }).catch(error => {
      console.error('Failed to cache data:', error)
    })

    return freshData
  }

  /**
   * Clear all keys with a specific prefix
   */
  async clearByPrefix(prefix: string): Promise<number> {
    if (!this.redis) return 0
    
    try {
      // Get all keys with prefix
      const keys = await this.redis.keys(`${prefix}*`)
      if (keys.length === 0) return 0
      
      // Delete all matching keys one by one (Upstash Redis doesn't support multiple keys in del)
      let deleted = 0
      for (const key of keys) {
        const result = await this.redis.del(key)
        deleted += result
      }
      return deleted
    } catch (error) {
      console.error('Redis clearByPrefix error:', error)
      return 0
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<boolean> {
    if (!this.redis) return false
    
    try {
      await this.redis.ping()
      return true
    } catch {
      return false
    }
  }
}