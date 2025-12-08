import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { OpenAIService } from '../openai/openai.service';

export interface DICAgent {
  id: string;
  name: string;
  specialty: string;
  isActive: boolean;
  personality: string;
  capabilities: string[];
  lastActivity: Date;
}

export interface DICContext {
  userId: string;
  appId: string;
  sessionId: string;
  userData: any;
  appData: any;
  systemState: any;
}

export interface DICRequest {
  id: string;
  agentId: string;
  context: DICContext;
  query: string;
  type: 'query' | 'task' | 'analysis' | 'recommendation' | 'automation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: any;
}

export interface DICResponse {
  id: string;
  requestId: string;
  agentId: string;
  response: string;
  actions?: DICAction[];
  confidence: number;
  processingTime: number;
  metadata?: any;
}

export interface DICAction {
  id: string;
  type: 'api_call' | 'database_query' | 'notification' | 'automation' | 'recommendation';
  target: string;
  payload: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

@Injectable()
export class DICService {
  private readonly logger = new Logger(DICService.name);
  
  private agents: Map<string, DICAgent> = new Map();
  private requestQueue: DICRequest[] = [];
  private processingRequests: Map<string, boolean> = new Map();
  private conversationHistory: Map<string, any[]> = new Map();

  constructor(
    private eventEmitter: EventEmitter2,
    private configService: ConfigService,
    private openAIService: OpenAIService,
  ) {
    this.initializeAgents();
  }

  private initializeAgents() {
    const agents: DICAgent[] = [
      {
        id: 'finance-agent',
        name: 'Finance AI',
        specialty: 'Financial analysis, budgeting, investment advice, tax optimization',
        isActive: true,
        personality: 'Professional, analytical, risk-aware, detail-oriented',
        capabilities: ['financial_analysis', 'budgeting', 'investment_advice', 'tax_optimization', 'loan_scoring', 'fraud_detection'],
        lastActivity: new Date(),
      },
      {
        id: 'operations-agent',
        name: 'Operations AI',
        specialty: 'Business operations, process optimization, inventory management',
        isActive: true,
        personality: 'Efficient, systematic, process-driven, improvement-focused',
        capabilities: ['process_optimization', 'inventory_management', 'supply_chain', 'workflow_automation', 'performance_analysis'],
        lastActivity: new Date(),
      },
      {
        id: 'growth-agent',
        name: 'Growth AI',
        specialty: 'Marketing, customer acquisition, business development, scaling strategies',
        isActive: true,
        personality: 'Innovative, ambitious, data-driven, customer-focused',
        capabilities: ['marketing_strategy', 'customer_acquisition', 'business_development', 'scaling_strategies', 'market_analysis'],
        lastActivity: new Date(),
      },
      {
        id: 'farming-agent',
        name: 'Farming AI',
        specialty: 'Agricultural insights, crop management, weather analysis, market pricing',
        isActive: true,
        personality: 'Knowledgeable, practical, weather-aware, market-savvy',
        capabilities: ['crop_management', 'weather_analysis', 'market_pricing', 'pest_control', 'soil_analysis', 'harvest_optimization'],
        lastActivity: new Date(),
      },
      {
        id: 'education-agent',
        name: 'Education AI',
        specialty: 'Learning optimization, curriculum design, student assessment, personalized teaching',
        isActive: true,
        personality: 'Patient, encouraging, adaptive, knowledge-focused',
        capabilities: ['learning_optimization', 'curriculum_design', 'student_assessment', 'personalized_teaching', 'progress_tracking'],
        lastActivity: new Date(),
      },
      {
        id: 'tax-agent',
        name: 'Tax AI',
        specialty: 'Tax compliance, form filling, regulatory guidance, optimization',
        isActive: true,
        personality: 'Compliant, accurate, regulation-aware, optimization-focused',
        capabilities: ['tax_compliance', 'form_filling', 'regulatory_guidance', 'tax_optimization', 'filing_assistance'],
        lastActivity: new Date(),
      },
      {
        id: 'support-agent',
        name: 'Support AI',
        specialty: 'Customer support, troubleshooting, user guidance, issue resolution',
        isActive: true,
        personality: 'Helpful, patient, solution-oriented, user-friendly',
        capabilities: ['customer_support', 'troubleshooting', 'user_guidance', 'issue_resolution', 'faq_assistance'],
        lastActivity: new Date(),
      },
      {
        id: 'compliance-agent',
        name: 'Compliance AI',
        specialty: 'Regulatory compliance, risk assessment, policy enforcement, audit support',
        isActive: true,
        personality: 'Compliant, risk-aware, policy-focused, audit-ready',
        capabilities: ['regulatory_compliance', 'risk_assessment', 'policy_enforcement', 'audit_support', 'kyc_verification'],
        lastActivity: new Date(),
      },
      {
        id: 'marketplace-agent',
        name: 'Marketplace AI',
        specialty: 'E-commerce optimization, vendor support, buyer protection, pricing strategies',
        isActive: true,
        personality: 'Commercial, protective, optimization-focused, vendor-supportive',
        capabilities: ['ecommerce_optimization', 'vendor_support', 'buyer_protection', 'pricing_strategies', 'market_analysis'],
        lastActivity: new Date(),
      },
      {
        id: 'crypto-agent',
        name: 'Crypto AI',
        specialty: 'Cryptocurrency analysis, trading insights, risk assessment, market trends',
        isActive: true,
        personality: 'Analytical, risk-aware, market-focused, security-conscious',
        capabilities: ['crypto_analysis', 'trading_insights', 'risk_assessment', 'market_trends', 'portfolio_optimization'],
        lastActivity: new Date(),
      },
    ];

    agents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  async processRequest(request: Omit<DICRequest, 'id'>): Promise<DICResponse> {
    const fullRequest: DICRequest = {
      ...request,
      id: `dic-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    this.logger.log(`Processing DIC request: ${fullRequest.id} for agent ${fullRequest.agentId}`);

    const startTime = Date.now();
    
    try {
      // Add to conversation history
      this.addToConversationHistory(fullRequest.context.sessionId, {
        type: 'request',
        content: fullRequest.query,
        timestamp: new Date(),
      });

      // Get the appropriate agent
      const agent = this.agents.get(fullRequest.agentId);
      if (!agent || !agent.isActive) {
        throw new Error(`Agent ${fullRequest.agentId} not found or inactive`);
      }

      // Update agent activity
      agent.lastActivity = new Date();

      // Process the request based on type and agent specialty
      const response = await this.generateAgentResponse(fullRequest, agent);
      
      const processingTime = Date.now() - startTime;

      const dicResponse: DICResponse = {
        id: `dic-resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        requestId: fullRequest.id,
        agentId: fullRequest.agentId,
        response: response.text,
        actions: response.actions,
        confidence: response.confidence,
        processingTime,
        metadata: {
          agentName: agent.name,
          specialty: agent.specialty,
          context: fullRequest.context,
        },
      };

      // Add to conversation history
      this.addToConversationHistory(fullRequest.context.sessionId, {
        type: 'response',
        content: dicResponse.response,
        agent: agent.name,
        confidence: dicResponse.confidence,
        timestamp: new Date(),
      });

      // Emit event
      this.eventEmitter.emit('dic.response.generated', dicResponse);

      this.logger.log(`DIC response generated in ${processingTime}ms with confidence ${dicResponse.confidence}`);
      
      return dicResponse;
    } catch (error) {
      this.logger.error(`Error processing DIC request: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async generateAgentResponse(request: DICRequest, agent: DICAgent): Promise<{text: string, actions?: DICAction[], confidence: number}> {
    // Build context for the agent
    const contextPrompt = this.buildAgentContext(request, agent);
    
    try {
      // Use OpenAI to generate response
      const aiResponse = await this.openAIService.createCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: contextPrompt }],
        max_tokens: 1000,
        temperature: 0.7,
      });

      // Parse the response to extract actions and confidence
      const responseText = aiResponse.choices[0]?.message?.content || ''
      const parsedResponse = this.parseAgentResponse(responseText, agent);

      return {
        text: parsedResponse.text,
        actions: parsedResponse.actions,
        confidence: parsedResponse.confidence,
      };
    } catch (error: any) {
      this.logger.error(`Error generating agent response: ${error.message}`);
      
      // Fallback response
      return {
        text: `I understand you're asking about ${agent.specialty}. Let me help you with that. What specific aspect would you like assistance with?`,
        confidence: 0.5,
      };
    }
  }

  private buildAgentContext(request: DICRequest, agent: DICAgent): string {
    const conversationHistory = this.getConversationHistory(request.context.sessionId);
    
    return `
You are ${agent.name}, an AI assistant specializing in ${agent.specialty}.

Your personality: ${agent.personality}

Your capabilities: ${agent.capabilities.join(', ')}

User Context:
- User ID: ${request.context.userId}
- App: ${request.context.appId}
- Session: ${request.context.sessionId}

System State: ${JSON.stringify(request.context.systemState, null, 2)}

Recent Conversation History:
${conversationHistory.slice(-5).map((msg, index) => `${index + 1}. ${msg.type}: ${msg.content}`).join('\n')}

Current Request:
Type: ${request.type}
Priority: ${request.priority}
Query: ${request.query}

Additional Context: ${JSON.stringify(request.metadata || {}, null, 2)}

Please provide a helpful, accurate response. If you need to take actions, specify them clearly.
`;
  }

  private parseAgentResponse(response: string, agent: DICAgent): {text: string, actions?: DICAction[], confidence: number} {
    // Simple parsing logic - in production, this would be more sophisticated
    const lines = response.split('\n');
    let text = '';
    const actions: DICAction[] = [];
    let confidence = 0.8; // Default confidence

    for (const line of lines) {
      if (line.startsWith('ACTION:')) {
        // Parse action
        const actionData = line.replace('ACTION:', '').trim();
        try {
          const action = JSON.parse(actionData);
          actions.push({
            id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: action.type || 'recommendation',
            target: action.target || 'user',
            payload: action.payload || {},
            priority: action.priority || 'medium',
          });
        } catch (e) {
          this.logger.warn(`Failed to parse action: ${line}`);
        }
      } else if (line.startsWith('CONFIDENCE:')) {
        // Parse confidence
        const confidenceStr = line.replace('CONFIDENCE:', '').trim();
        confidence = parseFloat(confidenceStr) || 0.8;
      } else {
        text += line + '\n';
      }
    }

    return {
      text: text.trim(),
      actions: actions.length > 0 ? actions : undefined,
      confidence,
    };
  }

  private addToConversationHistory(sessionId: string, message: any): void {
    if (!this.conversationHistory.has(sessionId)) {
      this.conversationHistory.set(sessionId, []);
    }
    
    const history = this.conversationHistory.get(sessionId);
    if (history) {
      history.push(message);
      
      // Keep only last 50 messages
      if (history.length > 50) {
        history.shift();
      }
    }
  }

  private getConversationHistory(sessionId: string): any[] {
    return this.conversationHistory.get(sessionId) || [];
  }

  async getAgentRecommendations(context: DICContext): Promise<DICAgent[]> {
    const activeAgents = Array.from(this.agents.values()).filter(agent => agent.isActive);
    
    // Simple recommendation logic based on app context
    const recommendations: DICAgent[] = [];
    
    if (context.appId === 'dorce-marketplace') {
      const marketplaceAgent = this.agents.get('marketplace-agent');
      const financeAgent = this.agents.get('finance-agent');
      if (marketplaceAgent) recommendations.push(marketplaceAgent);
      if (financeAgent) recommendations.push(financeAgent);
    } else if (context.appId === 'dorce-wallet' || context.appId === 'dorce-crypto') {
      const financeAgent = this.agents.get('finance-agent');
      const cryptoAgent = this.agents.get('crypto-agent');
      if (financeAgent) recommendations.push(financeAgent);
      if (cryptoAgent) recommendations.push(cryptoAgent);
    } else if (context.appId === 'dorce-tax') {
      const taxAgent = this.agents.get('tax-agent');
      const complianceAgent = this.agents.get('compliance-agent');
      if (taxAgent) recommendations.push(taxAgent);
      if (complianceAgent) recommendations.push(complianceAgent);
    } else if (context.appId === 'dorce-education') {
      const educationAgent = this.agents.get('education-agent');
      if (educationAgent) recommendations.push(educationAgent);
    } else if (context.appId === 'dorce-farms') {
      const farmingAgent = this.agents.get('farming-agent');
      if (farmingAgent) recommendations.push(farmingAgent);
    } else if (context.appId === 'dorce-community') {
      const supportAgent = this.agents.get('support-agent');
      const complianceAgent = this.agents.get('compliance-agent');
      if (supportAgent) recommendations.push(supportAgent);
      if (complianceAgent) recommendations.push(complianceAgent);
    }
    
    // Always include support agent
    const supportAgent = this.agents.get('support-agent');
    if (supportAgent) recommendations.push(supportAgent);
    
    return recommendations.filter(agent => agent && agent.isActive);
  }

  getActiveAgents(): DICAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.isActive);
  }

  getAgentById(agentId: string): DICAgent | undefined {
    return this.agents.get(agentId);
  }

  async toggleAgent(agentId: string, isActive: boolean): Promise<DICAgent> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    agent.isActive = isActive;
    this.agents.set(agentId, agent);
    
    this.eventEmitter.emit('dic.agent.toggled', { agentId, isActive });
    
    return agent;
  }

  // Analytics and insights
  async getSystemInsights(): Promise<any> {
    const activeAgents = this.getActiveAgents();
    const totalRequests = this.requestQueue.length;
    
    return {
      activeAgents: activeAgents.length,
      totalAgents: this.agents.size,
      pendingRequests: totalRequests,
      conversationSessions: this.conversationHistory.size,
      agentActivity: activeAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        specialty: agent.specialty,
        lastActivity: agent.lastActivity,
      })),
    };
  }
}