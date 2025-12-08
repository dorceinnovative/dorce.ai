export interface TelecomProvider {
  id: string
  name: string
  priority: number
  services: string[]
  commission: number
  status: 'active' | 'inactive' | 'maintenance'
  service: any // The actual service implementation
}

export interface ServiceRequest {
  serviceType: 'airtime' | 'data' | 'electricity' | 'cable' | 'betting'
  network: 'mtn' | 'airtel' | 'glo' | '9mobile' | 'smile'
  amount: number
  phone?: string
  variation?: string
  meterNumber?: string
  meterType?: 'prepaid' | 'postpaid'
  iucNumber?: string
  additionalParams?: Record<string, any>
}

export interface ServiceResponse {
  success: boolean
  provider?: string | null
  transactionId?: string | null
  amount: number
  commission: number
  status: 'success' | 'failed' | 'pending' | 'clarification_needed' | 'invalid_intent' | 'insufficient_balance' | 'error'
  message: string
  timestamp: Date
  error?: string
}

export interface ProviderPricing {
  provider: string
  providerName: string
  commission: number
  pricing: any
  status: 'available' | 'unavailable'
  error?: string
}

export interface TelecomIntent {
  intent: 'airtime_purchase' | 'data_purchase' | 'electricity_purchase' | 'cable_purchase' | 'betting_funding' | 'unknown'
  confidence: number
  entities: {
    network?: string
    amount?: number
    phone?: string
    data_plan?: string
    service_type?: string
    meter_number?: string
    iuc_number?: string
    additional_info?: Record<string, any>
  }
  suggestions?: string[]
  needsClarification?: boolean
  clarificationMessage?: string
}

export interface AIConversation {
  id: string
  userId: string
  messages: AIMessage[]
  context: Record<string, any>
  status: 'active' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  intent?: TelecomIntent
  timestamp: Date
}