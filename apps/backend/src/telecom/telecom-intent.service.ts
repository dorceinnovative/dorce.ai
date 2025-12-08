import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OpenAIService } from '../openai/openai.service'
import { TelecomIntent, ServiceRequest } from './telecom.types'

@Injectable()
export class TelecomIntentService {
  private readonly logger = new Logger(TelecomIntentService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly openAIService: OpenAIService,
  ) {}

  /**
   * Parse user message to extract telecom service intent
   * Examples:
   * - "I want to buy 2GB MTN data for 08012345678"
   * - "Please recharge my phone with 500 naira airtime"
   * - "I need to pay my IKEDC electricity bill"
   * - "Buy Airtel data plan 1GB for my sister"
   */
  async parseTelecomIntent(message: string, context?: Record<string, any>): Promise<TelecomIntent> {
    this.logger.log(`Parsing telecom intent: "${message}"`)

    const prompt = this.buildIntentPrompt(message, context)
    
    try {
      const response = await this.openAIService.createCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1, // Low temperature for consistent parsing
        max_tokens: 300,
      })

      const intentData = JSON.parse(response.choices[0].message.content)
      
      return this.validateAndEnhanceIntent(intentData, message, context)
    } catch (error) {
      this.logger.error('Failed to parse telecom intent:', error)
      
      // Fallback to rule-based parsing
      return this.fallbackIntentParsing(message, context)
    }
  }

  /**
   * Build comprehensive prompt for intent recognition
   */
  private buildIntentPrompt(message: string, context?: Record<string, any>): string {
    return `
You are an AI assistant that parses telecom service requests from Nigerian users. 
Analyze the following message and extract the user's intent for telecom services.

User Message: "${message}"

Context: ${context ? JSON.stringify(context) : 'No additional context'}

Available Services:
- Airtime: MTN, Airtel, Glo, 9mobile
- Data: MTN Data, Airtel Data, Glo Data, 9mobile Data
- Electricity: IKEDC, EKEDC, AEDC, IBEDC, PHEDC, KEDCO, JED
- Cable TV: DSTV, GOTV, Startimes, Showmax
- Betting: Bet9ja, BetKing, BetWay, 1xBet

Respond with a JSON object containing:
{
  "intent": "airtime_purchase" | "data_purchase" | "electricity_purchase" | "cable_purchase" | "betting_funding" | "unknown",
  "confidence": 0.0-1.0,
  "entities": {
    "network": "mtn" | "airtel" | "glo" | "9mobile" | null,
    "amount": number | null,
    "phone": string | null,
    "data_plan": string | null,
    "service_type": string | null,
    "meter_number": string | null,
    "iuc_number": string | null,
    "additional_info": {}
  },
  "suggestions": ["suggestion1", "suggestion2"],
  "needsClarification": boolean,
  "clarificationMessage": string | null
}

Examples:
- "I want to buy MTN airtime" → {"intent": "airtime_purchase", "entities": {"network": "mtn"}}
- "Buy 2GB data for 08012345678" → {"intent": "data_purchase", "entities": {"data_plan": "2GB", "phone": "08012345678"}}
- "Recharge my phone with 500" → {"intent": "airtime_purchase", "entities": {"amount": 500}}
- "Pay electricity bill" → {"intent": "electricity_purchase", "entities": {}}

Be precise with entity extraction. If information is missing or unclear, set "needsClarification" to true.
`
  }

  /**
   * Validate and enhance the parsed intent
   */
  private validateAndEnhanceIntent(intentData: any, message: string, context?: Record<string, any>): TelecomIntent {
    // Validate required fields
    const validatedIntent: TelecomIntent = {
      intent: this.validateIntent(intentData.intent) as any,
      confidence: Math.max(0, Math.min(1, intentData.confidence || 0)),
      entities: this.validateEntities(intentData.entities || {}),
      suggestions: intentData.suggestions || [],
      needsClarification: intentData.needsClarification || false,
    }

    // Add clarification message if needed
    if (validatedIntent.needsClarification) {
      validatedIntent.clarificationMessage = this.generateClarificationMessage(validatedIntent, message)
    }

    // Enhance with context if available
    let enhancedIntent = validatedIntent
    if (context) {
      enhancedIntent = this.enhanceWithContext(validatedIntent, context)
    }

    return enhancedIntent
  }

  /**
   * Validate intent type
   */
  private validateIntent(intent: string): string {
    const validIntents = ['airtime_purchase', 'data_purchase', 'electricity_purchase', 'cable_purchase', 'betting_funding', 'unknown']
    return validIntents.includes(intent) ? intent : 'unknown'
  }

  /**
   * Validate and normalize entities
   */
  private validateEntities(entities: Record<string, any>): Record<string, any> {
    const validated: Record<string, any> = {}

    // Validate network
    if (entities.network) {
      const network = entities.network.toLowerCase()
      const validNetworks = ['mtn', 'airtel', 'glo', '9mobile']
      if (validNetworks.includes(network)) {
        validated.network = network
      }
    }

    // Validate amount
    if (entities.amount) {
      const amount = parseFloat(entities.amount)
      if (!isNaN(amount) && amount > 0) {
        validated.amount = amount
      }
    }

    // Validate phone number
    if (entities.phone) {
      const phone = this.normalizePhoneNumber(entities.phone)
      if (phone) {
        validated.phone = phone
      }
    }

    // Validate data plan
    if (entities.data_plan) {
      validated.data_plan = entities.data_plan.toString().trim()
    }

    // Copy other entities as-is
    Object.keys(entities).forEach(key => {
      if (!(key in validated)) {
        validated[key] = entities[key]
      }
    })

    return validated
  }

  /**
   * Normalize Nigerian phone numbers
   */
  private normalizePhoneNumber(phone: string): string | null {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // Handle different formats
    if (digits.length === 11 && digits.startsWith('0')) {
      return '234' + digits.substring(1)
    } else if (digits.length === 10) {
      return '234' + digits
    } else if (digits.length === 13 && digits.startsWith('234')) {
      return digits
    }
    
    return null
  }

  /**
   * Generate clarification message for incomplete intents
   */
  private generateClarificationMessage(intent: TelecomIntent, originalMessage: string): string {
    const { intent: intentType, entities } = intent
    
    switch (intentType) {
      case 'airtime_purchase':
        if (!entities.network) {
          return 'Which network would you like to buy airtime for? (MTN, Airtel, Glo, or 9mobile)'
        }
        if (!entities.amount) {
          return 'How much airtime would you like to buy? (e.g., 100, 500, 1000)'
        }
        if (!entities.phone) {
          return 'What phone number should I recharge?'
        }
        break
        
      case 'data_purchase':
        if (!entities.network) {
          return 'Which network would you like to buy data for? (MTN, Airtel, Glo, or 9mobile)'
        }
        if (!entities.data_plan && !entities.amount) {
          return 'What data plan would you like? (e.g., 1GB, 2GB, or monthly plan)'
        }
        if (!entities.phone) {
          return 'What phone number should I buy data for?'
        }
        break
        
      case 'electricity_purchase':
        if (!entities.meter_number) {
          return 'What is your meter number?'
        }
        if (!entities.amount) {
          return 'How much electricity units would you like to buy?'
        }
        break
    }
    
    return 'Could you please provide more details about what you need?'
  }

  /**
   * Enhance intent with conversation context
   */
  private enhanceWithContext(intent: TelecomIntent, context: Record<string, any>): TelecomIntent {
    // Use previous conversation context to fill missing information
    if (context.previousIntent) {
      // If this is a follow-up, use previous context
      if (!intent.entities.network && context.previousIntent.entities?.network) {
        intent.entities.network = context.previousIntent.entities.network
      }
      if (!intent.entities.phone && context.previousIntent.entities?.phone) {
        intent.entities.phone = context.previousIntent.entities.phone
      }
    }

    // Use user profile context
    if (context.userProfile) {
      if (!intent.entities.phone && context.userProfile.phone) {
        intent.entities.phone = context.userProfile.phone
      }
      if (!intent.entities.network && context.userProfile.preferredNetwork) {
        intent.entities.network = context.userProfile.preferredNetwork
      }
    }

    return intent
  }

  /**
   * Fallback rule-based parsing when AI fails
   */
  private fallbackIntentParsing(message: string, context?: Record<string, any>): TelecomIntent {
    const lowerMessage = message.toLowerCase()
    
    // Basic keyword matching
    const intent: TelecomIntent = {
      intent: 'unknown',
      confidence: 0.5,
      entities: {},
      suggestions: [],
      needsClarification: true,
    }

    // Detect service type
    if (lowerMessage.includes('airtime') || lowerMessage.includes('recharge')) {
      intent.intent = 'airtime_purchase'
    } else if (lowerMessage.includes('data') || lowerMessage.includes('mb') || lowerMessage.includes('gb')) {
      intent.intent = 'data_purchase'
    } else if (lowerMessage.includes('electricity') || lowerMessage.includes('meter') || lowerMessage.includes('power')) {
      intent.intent = 'electricity_purchase'
    } else if (lowerMessage.includes('dstv') || lowerMessage.includes('gotv') || lowerMessage.includes('cable')) {
      intent.intent = 'cable_purchase'
    } else if (lowerMessage.includes('bet') || lowerMessage.includes('bet9ja') || lowerMessage.includes('betking')) {
      intent.intent = 'betting_funding'
    }

    // Extract network
    const networks = ['mtn', 'airtel', 'glo', '9mobile']
    for (const network of networks) {
      if (lowerMessage.includes(network)) {
        intent.entities.network = network
        break
      }
    }

    // Extract amount (look for numbers followed by currency or standalone)
    const amountMatch = lowerMessage.match(/(\d+)(?:\s*(?:naira|₦|#))?/)
    if (amountMatch) {
      intent.entities.amount = parseInt(amountMatch[1])
    }

    // Extract phone number (basic pattern)
    const phoneMatch = lowerMessage.match(/(?:0|234)?[7-9][01]\d{8}/)
    if (phoneMatch) {
      const normalizedPhone = this.normalizePhoneNumber(phoneMatch[0])
      if (normalizedPhone) {
        intent.entities.phone = normalizedPhone
      }
    }

    // Extract data plan
    const dataPlanMatch = lowerMessage.match(/(\d+(?:\.\d+)?)\s*(gb|mb)/i)
    if (dataPlanMatch) {
      intent.entities.data_plan = dataPlanMatch[0]
    }

    return intent
  }

  /**
   * Convert parsed intent to service request
   */
  convertIntentToServiceRequest(intent: TelecomIntent): ServiceRequest | null {
    if (intent.intent === 'unknown' || intent.needsClarification) {
      return null
    }

    const { entities } = intent

    switch (intent.intent) {
      case 'airtime_purchase':
        if (!entities.network || !entities.amount) {
          return null
        }
        return {
          serviceType: 'airtime',
          network: entities.network as any,
          amount: entities.amount,
          phone: entities.phone,
        }

      case 'data_purchase':
        if (!entities.network) {
          return null
        }
        return {
          serviceType: 'data',
          network: entities.network as any,
          amount: entities.amount || 0, // Will be determined by data plan
          phone: entities.phone,
          variation: entities.data_plan,
        }

      case 'electricity_purchase':
        return {
          serviceType: 'electricity',
          network: 'mtn', // Default network for electricity (will be mapped to proper service)
          amount: entities.amount || 0,
          meterNumber: entities.meter_number,
        }

      default:
        return null
    }
  }

  /**
   * Generate natural language response for successful transactions
   */
  generateSuccessResponse(intent: TelecomIntent, transaction: any): string {
    const { entities } = intent
    
    switch (intent.intent) {
      case 'airtime_purchase':
        return `✅ Successfully purchased ₦${entities.amount} ${entities.network?.toUpperCase()} airtime${entities.phone ? ` for ${entities.phone}` : ''}!`
        
      case 'data_purchase':
        return `✅ Successfully purchased ${entities.data_plan || 'data bundle'} for ${entities.network?.toUpperCase()}${entities.phone ? ` (${entities.phone})` : ''}!`
        
      case 'electricity_purchase':
        return `✅ Successfully purchased electricity units${entities.meter_number ? ` for meter ${entities.meter_number}` : ''}!`
        
      default:
        return '✅ Transaction completed successfully!'
    }
  }
}