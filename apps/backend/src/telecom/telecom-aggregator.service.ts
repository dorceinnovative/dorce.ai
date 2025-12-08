import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { VTPassService } from './vtpass.service'
import { BillsPayService } from './billspay.service'
import { VTUService } from './vtu.service'
import { TelecomProvider, ServiceRequest, ServiceResponse } from './telecom.types'

@Injectable()
export class TelecomAggregatorService {
  private readonly logger = new Logger(TelecomAggregatorService.name)
  private providers: Map<string, TelecomProvider> = new Map()

  constructor(
    private readonly configService: ConfigService,
    private readonly vtPassService: VTPassService,
    private readonly billsPayService: BillsPayService,
    private readonly vtuService: VTUService,
  ) {
    this.initializeProviders()
  }

  /**
   * Initialize all telecom providers
   */
  private initializeProviders(): void {
    const enableVTPass = this.configService.get<string>('TELECOM_ENABLE_VTPASS') !== 'false'
    const enableBillsPay = this.configService.get<string>('TELECOM_ENABLE_BILLSPAY') !== 'false'
    const enableVTU = this.configService.get<string>('TELECOM_ENABLE_VTU') !== 'false'

    const order = (this.configService.get<string>('TELECOM_PROVIDER_ORDER') || 'vtpass,billspay,vtu')
      .split(',')
      .map(s => s.trim())

    const priorityMap: Record<string, number> = {}
    order.forEach((id, idx) => { priorityMap[id] = idx + 1 })

    if (enableVTPass) {
      this.providers.set('vtpass', {
        id: 'vtpass',
        name: 'VTPass',
        priority: priorityMap['vtpass'] ?? 1,
        services: ['airtime', 'data', 'electricity', 'cable', 'betting'],
        commission: 0.035,
        status: 'active',
        service: this.vtPassService,
      })
    }

    if (enableBillsPay) {
      this.providers.set('billspay', {
        id: 'billspay',
        name: 'BillsPay',
        priority: priorityMap['billspay'] ?? 2,
        services: ['airtime', 'data', 'electricity'],
        commission: 0.03,
        status: 'active',
        service: this.billsPayService,
      })
    }

    if (enableVTU) {
      this.providers.set('vtu', {
        id: 'vtu',
        name: 'VTU.ng',
        priority: priorityMap['vtu'] ?? 3,
        services: ['airtime', 'data'],
        commission: 0.04,
        status: 'active',
        service: this.vtuService,
      })
    }
  }

  /**
   * Purchase telecom service with intelligent provider routing
   */
  async purchaseService(request: ServiceRequest): Promise<ServiceResponse> {
    const { serviceType, network, amount, phone, variation } = request
    
    this.logger.log(`Processing ${serviceType} request for ${network}: ${amount} to ${phone}`)

    try {
      // Get available providers for this service
      const availableProviders = this.getAvailableProviders(serviceType, network)
      
      if (availableProviders.length === 0) {
        throw new Error(`No providers available for ${serviceType} on ${network}`)
      }

      // Try providers in order of priority
      for (const provider of availableProviders) {
        try {
          this.logger.log(`Trying provider: ${provider.name}`)
          
          const result = await this.purchaseFromProvider(provider, request)
          
          // Log successful transaction
          this.logTransaction(request, provider, result, 'success')
          
          return {
            success: true,
            provider: provider.id,
            transactionId: result.transactionId,
            amount: result.amount,
            commission: result.commission,
            status: result.status,
            message: `Successfully purchased ${serviceType} via ${provider.name}`,
            timestamp: new Date(),
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          this.logger.warn(`Provider ${provider.name} failed: ${errorMessage}`)
          
          // Log failed attempt
          this.logTransaction(request, provider, null, 'failed', errorMessage)
          
          // Continue to next provider
          continue
        }
      }

      // All providers failed
      throw new Error('All providers failed to process transaction')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Service purchase failed: ${errorMessage}`)
      
      return {
        success: false,
        provider: null,
        transactionId: null,
        amount: 0,
        commission: 0,
        status: 'failed',
        message: errorMessage,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Get real-time pricing across all providers
   */
  async getPricing(serviceType: string, network: string, amount?: number): Promise<any[]> {
    const providers = this.getAvailableProviders(serviceType, network)
    const pricing: any[] = []

    for (const provider of providers) {
      try {
        const providerPricing = await provider.service.getPricing(serviceType, network, amount)
        pricing.push({
          provider: provider.id,
          providerName: provider.name,
          commission: provider.commission,
          pricing: providerPricing,
          status: 'available',
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        pricing.push({
          provider: provider.id,
          providerName: provider.name,
          status: 'unavailable',
          error: errorMessage,
        })
      }
    }

    return pricing
  }

  /**
   * Get service availability across providers
   */
  async getAvailability(serviceType: string, network: string): Promise<any> {
    const providers = this.getAvailableProviders(serviceType, network)
    const availability: any[] = []

    for (const provider of providers) {
      try {
        const isAvailable = await provider.service.getAvailability(serviceType, network)
        availability.push({
          provider: provider.id,
          providerName: provider.name,
          available: isAvailable,
          lastChecked: new Date(),
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        availability.push({
          provider: provider.id,
          providerName: provider.name,
          available: false,
          error: errorMessage,
        })
      }
    }

    return {
      serviceType,
      network,
      availability,
      overallStatus: availability.some(a => a.available) ? 'available' : 'unavailable',
    }
  }

  /**
   * Query transaction status across providers
   */
  async queryTransaction(transactionId: string, providerId?: string): Promise<any> {
    if (providerId) {
      const provider = this.providers.get(providerId)
      if (!provider) {
        throw new Error(`Provider ${providerId} not found`)
      }
      return provider.service.queryTransaction(transactionId)
    }

    // Query all providers to find transaction
    for (const [id, provider] of this.providers) {
      try {
        const result = await provider.service.queryTransaction(transactionId)
        if (result) {
          return {
            ...result,
            provider: id,
            providerName: provider.name,
          }
        }
      } catch (error) {
        // Transaction not found in this provider, continue
        continue
      }
    }

    throw new Error(`Transaction ${transactionId} not found in any provider`)
  }

  /**
   * Get available providers for a service
   */
  private getAvailableProviders(serviceType: string, network?: string): TelecomProvider[] {
    const providers: TelecomProvider[] = []
    
    for (const [id, provider] of this.providers) {
      if (provider.status === 'active' && provider.services.includes(serviceType)) {
        providers.push(provider)
      }
    }

    // Sort by priority (1 = highest priority)
    return providers.sort((a, b) => a.priority - b.priority)
  }

  /**
   * Purchase from specific provider
   */
  private async purchaseFromProvider(provider: TelecomProvider, request: ServiceRequest): Promise<any> {
    const { serviceType, network, amount, phone, variation } = request
    
    // Map service type to provider-specific service ID
    const serviceId = this.mapServiceToProviderId(serviceType, network, provider.id)
    
    return await provider.service.purchaseService(
      serviceId,
      amount,
      phone,
      variation,
      {
        network,
        serviceType,
      },
    )
  }

  /**
   * Map service type to provider-specific service ID
   */
  private mapServiceToProviderId(serviceType: string, network: string, providerId: string): string {
    const mappings = {
      vtpass: {
        airtime: {
          mtn: 'mtn',
          airtel: 'airtel',
          glo: 'glo',
          '9mobile': '9mobile',
        },
        data: {
          mtn: 'mtn-data',
          airtel: 'airtel-data',
          glo: 'glo-data',
          '9mobile': '9mobile-data',
        },
        electricity: {
          ikeja: 'ikeja-electric',
          eko: 'eko-electric',
          ibadan: 'ibadan-electric',
          abuja: 'abuja-electric',
        },
      },
      billspay: {
        // BillsPay service mappings
        airtime: {
          mtn: 'MTN_AIRTIME',
          airtel: 'AIRTEL_AIRTIME',
          glo: 'GLO_AIRTIME',
          '9mobile': '9MOBILE_AIRTIME',
        },
      },
      vtu: {
        // VTU.ng service mappings
        airtime: {
          mtn: 'mtn_airtime',
          airtel: 'airtel_airtime',
          glo: 'glo_airtime',
          '9mobile': '9mobile_airtime',
        },
      },
    }

    const providerMapping = mappings[providerId]
    if (!providerMapping || !providerMapping[serviceType] || !providerMapping[serviceType][network]) {
      throw new Error(`No service mapping found for ${serviceType} on ${network} for provider ${providerId}`)
    }

    return providerMapping[serviceType][network]
  }

  /**
   * Log transaction for analytics and monitoring
   */
  private logTransaction(
    request: ServiceRequest,
    provider: TelecomProvider,
    result: any,
    status: 'success' | 'failed',
    error?: string,
  ): void {
    const logData = {
      timestamp: new Date(),
      request,
      provider: provider.id,
      providerName: provider.name,
      status,
      result: result ? {
        transactionId: result.transactionId,
        amount: result.amount,
        commission: result.commission,
      } : null,
      error,
    }

    this.logger.log(`Transaction logged: ${JSON.stringify(logData)}`)
    
    // Store in database for analytics (will be implemented)
    // this.analyticsService.logTelecomTransaction(logData)
  }

  /**
   * Verify meter number for electricity
   */
  async verifyMeter(serviceID: string, meterNumber: string, type: 'prepaid' | 'postpaid'): Promise<any> {
    // Find a provider that supports electricity and has verify functionality
    for (const [id, provider] of this.providers) {
      if (provider.services.includes('electricity') && provider.service.verifyMeterNumber) {
        try {
          return await provider.service.verifyMeterNumber(serviceID, meterNumber, type)
        } catch (error) {
          this.logger.warn(`Provider ${provider.name} failed to verify meter: ${error}`)
          continue
        }
      }
    }
    
    throw new Error('No provider available to verify meter number')
  }

  /**
   * Get provider statistics
   */
  async getProviderStats(): Promise<any> {
    const stats: any[] = []
    
    for (const [id, provider] of this.providers) {
      stats.push({
        id,
        name: provider.name,
        status: provider.status,
        priority: provider.priority,
        services: provider.services,
        commission: provider.commission,
        // Add transaction statistics (will be implemented)
        totalTransactions: 0, // Placeholder
        successRate: 0, // Placeholder
        lastTransaction: null, // Placeholder
      })
    }

    return stats
  }
}
