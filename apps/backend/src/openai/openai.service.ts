import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name)
  private readonly apiKey: string
  private readonly baseUrl = 'https://api.openai.com/v1'

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || ''
  }

  async createCompletion(params: {
    model: string
    messages: Array<{ role: string; content: string }>
    temperature?: number
    max_tokens?: number
  }): Promise<OpenAIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      return (await response.json()) as OpenAIResponse
    } catch (error) {
      this.logger.error('OpenAI API call failed:', error)
      throw error
    }
  }
}