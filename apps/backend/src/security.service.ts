import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtSecretService } from './auth/jwt-secret.service'

@Injectable()
export class SecurityService implements OnModuleInit {
  constructor(
    private configService: ConfigService,
    private jwtSecretService: JwtSecretService
  ) {}

  onModuleInit() {
    this.validateSecurityConfiguration()
  }

  /**
   * Validate all security configurations
   */
  validateSecurityConfiguration(): void {
    const jwtValidation = this.jwtSecretService.validateSecrets()
    
    if (!jwtValidation.valid) {
      console.warn('JWT Security Issues:', jwtValidation.errors)
    }

    // Check for default/weak secrets
    const secrets = [
      { name: 'JWT_ACCESS_SECRET', value: this.configService.get<string>('JWT_ACCESS_SECRET') },
      { name: 'JWT_REFRESH_SECRET', value: this.configService.get<string>('JWT_REFRESH_SECRET') },
      { name: 'JWT_SECRET', value: this.configService.get<string>('JWT_SECRET') },
    ]

    secrets.forEach(({ name, value }) => {
      if (value && this.isWeakSecret(value)) {
        console.warn(`Weak secret detected for ${name}. Consider using a stronger secret.`)
      }
    })

    // Check for missing API keys
    const apiKeys = [
      'OPENAI_API_KEY',
      'OPENROUTER_API_KEY',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
    ]

    apiKeys.forEach(key => {
      if (!this.configService.get<string>(key)) {
        console.warn(`Missing configuration: ${key}`)
      }
    })
  }

  /**
   * Check if a secret is weak
   */
  private isWeakSecret(secret: string): boolean {
    const weakPatterns = [
      'default',
      'secret',
      'password',
      '123',
      'abc',
      'change-me',
      'development',
      'test',
    ]

    const lowerSecret = secret.toLowerCase()
    return (
      secret.length < 32 ||
      weakPatterns.some(pattern => lowerSecret.includes(pattern)) ||
      /^[a-zA-Z0-9]{8,}$/.test(secret) // Only alphanumeric
    )
  }

  /**
   * Generate secure configuration template
   */
  generateSecureConfig(): Record<string, string> {
    const secrets = this.jwtSecretService.generateSecrets()
    
    return {
      JWT_ACCESS_SECRET: secrets.accessSecret,
      JWT_REFRESH_SECRET: secrets.refreshSecret,
      JWT_SECRET: secrets.accessSecret, // Fallback
      OPENROUTER_API_KEY: this.jwtSecretService.generateApiKey(),
      SUPABASE_ANON_KEY: this.jwtSecretService.generateApiKey(),
      UPSTASH_REDIS_REST_TOKEN: this.jwtSecretService.generateRandomString(64),
    }
  }

  /**
   * Get security recommendations
   */
  getSecurityRecommendations(): string[] {
    const recommendations: string[] = []
    
    const jwtValidation = this.jwtSecretService.validateSecrets()
    if (!jwtValidation.valid) {
      recommendations.push('Fix JWT secret configuration issues')
    }

    if (!this.configService.get<string>('OPENROUTER_API_KEY')) {
      recommendations.push('Configure OpenRouter API key for AI model access')
    }

    if (!this.configService.get<string>('SUPABASE_URL')) {
      recommendations.push('Configure Supabase for enhanced database and auth features')
    }

    if (!this.configService.get<string>('UPSTASH_REDIS_REST_URL')) {
      recommendations.push('Configure Upstash Redis for caching and rate limiting')
    }

    const nodeEnv = this.configService.get<string>('NODE_ENV')
    if (nodeEnv === 'production') {
      recommendations.push('Ensure all secrets are properly configured for production')
      recommendations.push('Enable HTTPS and secure headers')
      recommendations.push('Configure proper CORS settings')
    }

    return recommendations
  }

  /**
   * Check if system is production-ready
   */
  isProductionReady(): boolean {
    const jwtValidation = this.jwtSecretService.validateSecrets()
    
    if (!jwtValidation.valid) {
      return false
    }

    const requiredConfigs = [
      'DATABASE_URL',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
    ]

    return requiredConfigs.every(key => {
      const value = this.configService.get<string>(key)
      return value && !this.isWeakSecret(value)
    })
  }
}