import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'
import { UpstashService } from '../upstash/upstash.service'
import { JwtSecretService } from '../auth/jwt-secret.service'

export interface OpenRouterModel {
  id: string
  name: string
  description: string
  context_length: number
  pricing: {
    prompt: string
    completion: string
  }
}

export interface OpenRouterCompletionRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stream?: boolean
}

export interface OpenRouterCompletionResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
    index: number
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

@Injectable()
export class OpenRouterService {
  private readonly axiosInstance: AxiosInstance
  private readonly apiKey: string
  private readonly baseURL = 'https://openrouter.ai/api/v1'
  private readonly cachePrefix = 'openrouter:'

  constructor(
    private configService: ConfigService,
    private upstashService: UpstashService,
    private jwtSecretService: JwtSecretService
  ) {
    this.apiKey = this.configService.get<string>('OPENROUTER_API_KEY') || ''
    
    if (!this.apiKey) {
      console.warn('OPENROUTER_API_KEY not configured - OpenRouter service will be disabled')
      return
    }

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': this.configService.get<string>('FRONTEND_URL', 'https://dorce.ai'),
        'X-Title': 'Dorce.ai',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })
  }

  /**
   * Get available models from OpenRouter with caching
   */
  async getModels(): Promise<OpenRouterModel[]> {
    if (!this.apiKey) {
      return []
    }
    
    const cacheKey = `${this.cachePrefix}models`
    
    // Try to get from cache first
    const cachedModels = await this.upstashService.get<OpenRouterModel[]>(cacheKey)
    if (cachedModels) {
      return cachedModels
    }
    
    try {
      const response = await this.axiosInstance.get('/models')
      const models = response.data.data
      
      // Cache for 1 hour
      await this.upstashService.set(cacheKey, models, { ttl: 3600 })
      
      return models
    } catch (error) {
      throw new Error(`Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a chat completion
   */
  async createCompletion(
    request: OpenRouterCompletionRequest
  ): Promise<OpenRouterCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured')
    }
    
    try {
      const response = await this.axiosInstance.post('/chat/completions', request)
      return response.data
    } catch (error) {
      throw new Error(`OpenRouter API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a streaming chat completion
   */
  async createStreamingCompletion(
    request: OpenRouterCompletionRequest
  ): Promise<ReadableStream> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured')
    }
    
    try {
      const response = await this.axiosInstance.post('/chat/completions', {
        ...request,
        stream: true,
      }, {
        responseType: 'stream',
      })
      return response.data
    } catch (error) {
      throw new Error(`OpenRouter streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate text using a specific model
   */
  async generateText(
    prompt: string,
    model: string = 'openai/gpt-3.5-turbo',
    options?: Partial<OpenRouterCompletionRequest>
  ): Promise<string> {
    const response = await this.createCompletion({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
      ...options,
    })
    return response.choices[0]?.message?.content || ''
  }

  /**
   * Generate system response with context
   */
  async generateSystemResponse(
    systemPrompt: string,
    userMessage: string,
    model: string = 'openai/gpt-4',
    options?: Partial<OpenRouterCompletionRequest>
  ): Promise<string> {
    const response = await this.createCompletion({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      ...options,
    })
    return response.choices[0]?.message?.content || ''
  }

  /**
   * Calculate token usage cost
   */
  calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    // Pricing per 1K tokens (as of latest update)
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'openai/gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 },
      'openai/gpt-4': { prompt: 0.03, completion: 0.06 },
      'openai/gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
      'anthropic/claude-3-haiku': { prompt: 0.00025, completion: 0.00125 },
      'anthropic/claude-3-sonnet': { prompt: 0.003, completion: 0.015 },
      'anthropic/claude-3-opus': { prompt: 0.015, completion: 0.075 },
      'google/gemini-pro': { prompt: 0.0005, completion: 0.0015 },
      'meta/llama-2-70b-chat': { prompt: 0.0007, completion: 0.0009 },
      'meta/llama-3-70b-instruct': { prompt: 0.0007, completion: 0.0009 },
      'mistralai/mistral-7b-instruct': { prompt: 0.0002, completion: 0.0002 },
      'mistralai/mixtral-8x7b-instruct': { prompt: 0.0006, completion: 0.0006 },
    }

    const modelPricing = pricing[model] || pricing['openai/gpt-3.5-turbo']
    const promptCost = (promptTokens / 1000) * modelPricing.prompt
    const completionCost = (completionTokens / 1000) * modelPricing.completion
    
    return promptCost + completionCost
  }

  /**
   * Get health status of OpenRouter API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.axiosInstance.get('/models', { timeout: 5000 })
      return true
    } catch {
      return false
    }
  }
}