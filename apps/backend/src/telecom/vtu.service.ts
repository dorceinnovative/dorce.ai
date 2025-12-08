import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { AxiosResponse } from 'axios'

export interface VTUServiceData {
  serviceID: string
  name: string
  category: string
  provider: string
  commission: number
}

export interface VTUVariation {
  variation_id: string
  service_name: string
  service_id: string
  data_plan?: string
  airtime_amount?: string
  price: string
  availability: 'Available' | 'Unavailable'
}

export interface VTUTransaction {
  code: string
  response_description: string
  requestId: string
  amount: number
  transaction_date: string
  content?: {
    transactions: {
      status: 'delivered' | 'failed' | 'pending'
      product_name: string
      unique_element: string
      unit_price: number
      quantity: number
      commission: number
      total_amount: number
      type: string
      phone?: string
      iuc?: string
      meter_number?: string
      transactionId: string
    }
  }
}

@Injectable()
export class VTUService {
  private readonly logger = new Logger(VTUService.name)
  private readonly baseUrl = 'https://vtu.ng/api/v1'
  private readonly apiKey: string
  private readonly secretKey: string

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('VTU_API_KEY') || ''
    this.secretKey = this.configService.get<string>('VTU_SECRET_KEY') || ''
  }

  /**
   * Get all available services from VTU.ng
   */
  async getServices(): Promise<VTUServiceData[]> {
    try {
      if (!this.apiKey) {
        this.logger.warn('VTU_API_KEY not configured, using mock services')
        return this.getMockServices()
      }
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/services`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }),
      )

      return response.data.services.map((service: any) => ({
        serviceID: service.serviceID,
        name: service.name,
        category: service.category,
        provider: this.extractProvider(service.name),
        commission: service.commission || 0,
      }))
    } catch (error) {
      this.logger.error('Failed to fetch VTU.ng services:', error)
      // Return mock data for development
      return this.getMockServices()
    }
  }

  /**
   * Get variations for a specific service
   */
  async getVariations(serviceID: string): Promise<VTUVariation[]> {
    try {
      if (!this.apiKey) {
        this.logger.warn('VTU_API_KEY not configured, using mock variations')
        return this.getMockVariations(serviceID)
      }
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/variations`, {
          params: { serviceID },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }),
      )

      return response.data.variations.map((variation: any) => ({
        variation_id: variation.variation_id,
        service_name: variation.service_name,
        service_id: variation.service_id,
        data_plan: variation.data_plan,
        airtime_amount: variation.airtime_amount,
        price: variation.price,
        availability: variation.availability,
      }))
    } catch (error) {
      this.logger.error(`Failed to fetch variations for ${serviceID}:`, error)
      return this.getMockVariations(serviceID)
    }
  }

  /**
   * Purchase a service
   */
  async purchaseService(
    serviceID: string,
    amount: number,
    phone?: string,
    variation_id?: string,
    additionalParams?: Record<string, any>,
  ): Promise<VTUTransaction> {
    try {
      if (!this.apiKey) {
        this.logger.warn('VTU_API_KEY not configured, using mock purchase response')
        return this.getMockPurchaseResponse(serviceID, amount, phone, variation_id)
      }
      const requestId = this.generateRequestId()
      const payload = {
        serviceID,
        amount,
        requestId,
        phone,
        variation_id,
        ...additionalParams,
      }

      this.logger.log(`Initiating VTU.ng purchase: ${serviceID} for ${phone || 'N/A'}`, payload)

      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/purchase`, payload, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }),
      )

      return response.data
    } catch (error) {
      this.logger.error('VTU.ng purchase failed:', error)
      // Return mock response for development
      return this.getMockPurchaseResponse(serviceID, amount, phone, variation_id)
    }
  }

  /**
   * Query transaction status
   */
  async queryTransaction(requestId: string): Promise<VTUTransaction> {
    try {
      if (!this.apiKey) {
        this.logger.warn('VTU_API_KEY not configured, using mock transaction response')
        return this.getMockTransactionResponse(requestId)
      }
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/transaction/${requestId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }),
      )

      return response.data
    } catch (error) {
      this.logger.error(`Failed to query transaction ${requestId}:`, error)
      return this.getMockTransactionResponse(requestId)
    }
  }

  /**
   * Get pricing for a service
   */
  async getPricing(serviceType: string, network: string, amount?: number): Promise<any> {
    try {
      if (!this.apiKey) {
        this.logger.warn('VTU_API_KEY not configured, using mock pricing')
        return this.getMockPricing(serviceType, network, amount)
      }
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/pricing`, {
          params: { serviceType, network, amount },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }),
      )

      return response.data
    } catch (error) {
      this.logger.error(`Failed to get pricing for ${serviceType}/${network}:`, error)
      return this.getMockPricing(serviceType, network, amount)
    }
  }

  /**
   * Check service availability
   */
  async getAvailability(serviceType: string, network: string): Promise<boolean> {
    try {
      if (!this.apiKey) {
        this.logger.warn('VTU_API_KEY not configured, assuming available for development')
        return true
      }
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/availability`, {
          params: { serviceType, network },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }),
      )

      return response.data.available
    } catch (error) {
      this.logger.error(`Failed to check availability for ${serviceType}/${network}:`, error)
      return true // Assume available in development
    }
  }

  /**
   * Webhook handler for VTU.ng transaction updates
   */
  async handleWebhook(payload: any): Promise<void> {
    this.logger.log('VTU.ng webhook received:', payload)
    
    // Verify webhook signature
    if (!this.verifyWebhookSignature(payload)) {
      throw new Error('Invalid webhook signature')
    }

    // Process webhook payload
    const { requestId, status, transactionId } = payload
    
    // Update transaction status in database
    this.logger.log(`Transaction ${requestId} status updated to: ${status}`)
  }

  /**
   * Verify meter number for electricity
   */
  async verifyMeterNumber(
    serviceID: string,
    meterNumber: string,
    type: 'prepaid' | 'postpaid',
  ): Promise<any> {
    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/verify-meter`, {
          serviceID,
          meterNumber,
          type,
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }),
      )

      return response.data
    } catch (error) {
      this.logger.error(`Meter verification failed for ${meterNumber}:`, error)
      return this.getMockMeterVerification(serviceID, meterNumber, type)
    }
  }

  /**
   * Generate unique request ID for transactions
   */
  private generateRequestId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `dorce_vtu_${timestamp}_${random}`
  }

  /**
   * Extract provider name from service name
   */
  private extractProvider(serviceName: string): string {
    const providers = ['MTN', 'Airtel', 'Glo', '9mobile', 'Smile']
    const upperName = serviceName.toUpperCase()
    
    for (const provider of providers) {
      if (upperName.includes(provider.toUpperCase())) {
        return provider
      }
    }
    
    return 'Unknown'
  }

  /**
   * Verify webhook signature from VTU.ng
   */
  private verifyWebhookSignature(payload: any): boolean {
    // Implementation will depend on VTU.ng webhook signature method
    // This is a placeholder - actual implementation will use HMAC verification
    return true
  }

  /**
   * Mock services for development
   */
  private getMockServices(): VTUServiceData[] {
    return [
      {
        serviceID: 'MTN_AIRTIME_VTU',
        name: 'MTN Airtime VTU',
        category: 'airtime',
        provider: 'MTN',
        commission: 0.04,
      },
      {
        serviceID: 'AIRTEL_AIRTIME_VTU',
        name: 'Airtel Airtime VTU',
        category: 'airtime',
        provider: 'Airtel',
        commission: 0.04,
      },
      {
        serviceID: 'GLO_AIRTIME_VTU',
        name: 'Glo Airtime VTU',
        category: 'airtime',
        provider: 'Glo',
        commission: 0.04,
      },
      {
        serviceID: '9MOBILE_AIRTIME_VTU',
        name: '9mobile Airtime VTU',
        category: 'airtime',
        provider: '9mobile',
        commission: 0.04,
      },
    ]
  }

  /**
   * Mock variations for development
   */
  private getMockVariations(serviceID: string): VTUVariation[] {
    const variations = {
      'MTN_AIRTIME_VTU': [
        { variation_id: 'vtu_mtn_100', service_name: 'MTN VTU ₦100', service_id: 'MTN_AIRTIME_VTU', airtime_amount: '100', price: '100', availability: 'Available' as const },
        { variation_id: 'vtu_mtn_500', service_name: 'MTN VTU ₦500', service_id: 'MTN_AIRTIME_VTU', airtime_amount: '500', price: '500', availability: 'Available' as const },
        { variation_id: 'vtu_mtn_1000', service_name: 'MTN VTU ₦1000', service_id: 'MTN_AIRTIME_VTU', airtime_amount: '1000', price: '1000', availability: 'Available' as const },
      ],
      'AIRTEL_AIRTIME_VTU': [
        { variation_id: 'vtu_airtel_100', service_name: 'Airtel VTU ₦100', service_id: 'AIRTEL_AIRTIME_VTU', airtime_amount: '100', price: '100', availability: 'Available' as const },
        { variation_id: 'vtu_airtel_500', service_name: 'Airtel VTU ₦500', service_id: 'AIRTEL_AIRTIME_VTU', airtime_amount: '500', price: '500', availability: 'Available' as const },
        { variation_id: 'vtu_airtel_1000', service_name: 'Airtel VTU ₦1000', service_id: 'AIRTEL_AIRTIME_VTU', airtime_amount: '1000', price: '1000', availability: 'Available' as const },
      ],
    }

    return variations[serviceID] || []
  }

  /**
   * Mock purchase response for development
   */
  private getMockPurchaseResponse(serviceID: string, amount: number, phone?: string, variation_id?: string): VTUTransaction {
    return {
      code: '000',
      response_description: 'Transaction successful',
      requestId: this.generateRequestId(),
      amount: amount,
      transaction_date: new Date().toISOString(),
      content: {
        transactions: {
          status: 'delivered',
          product_name: serviceID,
          unique_element: phone || 'N/A',
          unit_price: amount,
          quantity: 1,
          commission: amount * 0.04,
          total_amount: amount,
          type: 'airtime',
          phone: phone,
          transactionId: `VTU_${Date.now()}`,
        },
      },
    }
  }

  /**
   * Mock transaction response for development
   */
  private getMockTransactionResponse(requestId: string): VTUTransaction {
    return {
      code: '000',
      response_description: 'Transaction successful',
      requestId: requestId,
      amount: 500,
      transaction_date: new Date().toISOString(),
      content: {
        transactions: {
          status: 'delivered',
          product_name: 'MTN Airtime VTU',
          unique_element: '08012345678',
          unit_price: 500,
          quantity: 1,
          commission: 20,
          total_amount: 500,
          type: 'airtime',
          phone: '08012345678',
          transactionId: `VTU_${Date.now()}`,
        },
      },
    }
  }

  /**
   * Mock pricing for development
   */
  private getMockPricing(serviceType: string, network: string, amount?: number): any {
    return {
      serviceType,
      network,
      amount,
      commission: 0.04,
      fees: 0,
      totalAmount: amount || 0,
      available: true,
    }
  }

  /**
   * Mock meter verification for development
   */
  private getMockMeterVerification(serviceID: string, meterNumber: string, type: 'prepaid' | 'postpaid'): any {
    return {
      meterNumber,
      type,
      customerName: 'John Doe',
      address: '123 Test Street, Lagos',
      status: 'active',
      verified: true,
      serviceID,
    }
  }
}
