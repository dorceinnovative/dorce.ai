import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface VTPassServiceData {
  serviceID: string
  name: string
  category: string
  provider: string
  commission: number
}

export interface VTPassVariation {
  variation_id: string
  service_name: string
  service_id: string
  data_plan: string
  amount: number
  validity: string
}

export interface VTPassTransaction {
  code: string
  content: {
    transactions: {
      status: string
      product_name: string
      unique_element: string
      unit_price: number
      commission: number
      email: string
      phone: string
      name: string
      amount: number
      requestId: string
      transactionId: string
    }
  }
}

@Injectable()
export class VTPassService {
  private readonly logger = new Logger(VTPassService.name)
  private readonly baseUrl = 'https://sandbox.vtpass.com/api'
  private readonly apiKey: string
  private readonly secretKey: string
  private readonly publicKey: string

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('VTPASS_API_KEY') || 'demo-key'
    this.secretKey = this.configService.get<string>('VTPASS_SECRET_KEY') || 'demo-secret'
    this.publicKey = this.configService.get<string>('VTPASS_PUBLIC_KEY') || 'demo-public'
  }

  /**
   * Get all available services from VTPass
   */
  async getServices(): Promise<VTPassServiceData[]> {
    try {
      // Use mock data for development
      this.logger.log('Using mock VTPass services data')
      return this.getMockServices()
    } catch (error) {
      this.logger.error('Failed to fetch VTPass services:', error)
      throw new Error('Failed to fetch services from VTPass')
    }
  }

  /**
   * Get service variations (e.g., data plans)
   */
  async getVariations(serviceID: string): Promise<VTPassVariation[]> {
    try {
      // Use mock data for development
      this.logger.log(`Using mock VTPass variations for ${serviceID}`)
      return this.getMockVariations(serviceID)
    } catch (error) {
      this.logger.error(`Failed to fetch variations for ${serviceID}:`, error)
      throw new Error(`Failed to fetch variations for ${serviceID}`)
    }
  }

  /**
   * Purchase a service
   */
  async purchaseService(
    serviceID: string,
    amount: number,
    phone: string,
    variation?: string,
    metadata?: any,
  ): Promise<any> {
    try {
      // Use mock response for development
      this.logger.log(`Using mock VTPass purchase response for ${serviceID}`)
      return {
        code: '000',
        content: {
          transactions: {
            status: 'delivered',
            product_name: serviceID,
            unique_element: phone,
            unit_price: amount,
            commission: 50,
            email: 'user@example.com',
            phone: phone,
            name: 'Test User',
            amount: amount,
            requestId: `VT${Date.now()}`,
            transactionId: `VT${Date.now()}`,
          }
        }
      }
    } catch (error) {
      this.logger.error('VTPass purchase failed:', error)
      throw new Error(`Failed to purchase ${serviceID}: ${(error as any).message}`)
    }
  }

  /**
   * Query transaction status
   */
  async queryTransaction(requestId: string): Promise<VTPassTransaction> {
    try {
      // Use mock response for development
      this.logger.log(`Using mock VTPass transaction query for ${requestId}`)
      return {
        code: '000',
        content: {
          transactions: {
            status: 'delivered',
            product_name: 'mtn',
            unique_element: '08012345678',
            unit_price: 1000,
            commission: 50,
            email: 'user@example.com',
            phone: '08012345678',
            name: 'Test User',
            amount: 1000,
            requestId: requestId,
            transactionId: `VT${Date.now()}`,
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to query transaction ${requestId}:`, error)
      throw new Error(`Failed to query transaction ${requestId}`)
    }
  }

  /**
   * Verify meter number for electricity
   */
  async verifyMeterNumber(serviceID: string, meterNumber: string, type: 'prepaid' | 'postpaid'): Promise<any> {
    try {
      // Use mock response for development
      this.logger.log(`Using mock VTPass meter verification for ${meterNumber}`)
      return {
        code: '000',
        content: {
          Customer_Name: 'JOHN DOE',
          Address: '123 TEST STREET, LAGOS',
          Meter_Number: meterNumber,
          Customer_Phone: '08012345678',
          Customer_Email: 'john.doe@example.com',
          Customer_Arrears: '0.00',
        }
      }
    } catch (error) {
      this.logger.error(`Failed to verify meter ${meterNumber}:`, error)
      throw new Error(`Failed to verify meter ${meterNumber}`)
    }
  }

  /**
   * Handle webhook from VTPass
   */
  async handleWebhook(payload: any): Promise<void> {
    this.logger.log('VTPass webhook received:', payload)
    // Process webhook payload
    // This would typically update transaction status in database
  }

  /**
   * Get pricing for a service
   */
  async getPricing(serviceID: string, amount?: number): Promise<any> {
    const variations = await this.getVariations(serviceID)
    return {
      serviceID,
      variations,
      commission: 0.035, // 3.5% commission
    }
  }

  /**
   * Check service availability
   */
  async getAvailability(serviceID: string): Promise<boolean> {
    return true // Mock availability
  }

  /**
   * Extract provider from service name
   */
  private extractProvider(serviceName: string): string {
    const name = serviceName.toLowerCase()
    if (name.includes('mtn')) return 'mtn'
    if (name.includes('airtel')) return 'airtel'
    if (name.includes('glo')) return 'glo'
    if (name.includes('9mobile')) return '9mobile'
    return 'unknown'
  }

  /**
   * Mock services data
   */
  private getMockServices(): VTPassServiceData[] {
    return [
      {
        serviceID: 'mtn',
        name: 'MTN Airtime',
        category: 'airtime',
        provider: 'mtn',
        commission: 0.035,
      },
      {
        serviceID: 'airtel',
        name: 'Airtel Airtime',
        category: 'airtime',
        provider: 'airtel',
        commission: 0.035,
      },
      {
        serviceID: 'glo',
        name: 'GLO Airtime',
        category: 'airtime',
        provider: 'glo',
        commission: 0.035,
      },
      {
        serviceID: '9mobile',
        name: '9Mobile Airtime',
        category: 'airtime',
        provider: '9mobile',
        commission: 0.035,
      },
      {
        serviceID: 'mtn-data',
        name: 'MTN Data',
        category: 'data',
        provider: 'mtn',
        commission: 0.035,
      },
      {
        serviceID: 'airtel-data',
        name: 'Airtel Data',
        category: 'data',
        provider: 'airtel',
        commission: 0.035,
      },
      {
        serviceID: 'glo-data',
        name: 'GLO Data',
        category: 'data',
        provider: 'glo',
        commission: 0.035,
      },
      {
        serviceID: '9mobile-data',
        name: '9Mobile Data',
        category: 'data',
        provider: '9mobile',
        commission: 0.035,
      },
      {
        serviceID: 'ikeja-electric',
        name: 'IKEDC Electricity',
        category: 'electricity',
        provider: 'ikeja',
        commission: 0.03,
      },
      {
        serviceID: 'eko-electric',
        name: 'EKEDC Electricity',
        category: 'electricity',
        provider: 'eko',
        commission: 0.03,
      },
    ]
  }

  /**
   * Mock variations data
   */
  private getMockVariations(serviceID: string): VTPassVariation[] {
    const variations: { [key: string]: VTPassVariation[] } = {
      'mtn-data': [
        {
          variation_id: 'mtn-1gb',
          service_name: 'MTN 1GB Data',
          service_id: 'mtn-data',
          data_plan: '1GB',
          amount: 1000,
          validity: '30 days',
        },
        {
          variation_id: 'mtn-2gb',
          service_name: 'MTN 2GB Data',
          service_id: 'mtn-data',
          data_plan: '2GB',
          amount: 2000,
          validity: '30 days',
        },
      ],
      'airtel-data': [
        {
          variation_id: 'airtel-1gb',
          service_name: 'Airtel 1GB Data',
          service_id: 'airtel-data',
          data_plan: '1GB',
          amount: 1000,
          validity: '30 days',
        },
      ],
    }

    return variations[serviceID] || []
  }
}