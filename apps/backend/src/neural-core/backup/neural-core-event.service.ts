import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface NeuralCoreEvent {
  type: 'user_intent_detected' | 'consciousness_update' | 'evolution_triggered' | 'pattern_recognized' | 'interface_adaptation';
  userId: string;
  data: any;
  timestamp: Date;
}

export interface UserIntentEvent extends NeuralCoreEvent {
  type: 'user_intent_detected';
  data: {
    intent: string;
    confidence: number;
    context: any;
    predictedActions: string[];
  };
}

export interface ConsciousnessUpdateEvent extends NeuralCoreEvent {
  type: 'consciousness_update';
  data: {
    awarenessLevel: number;
    emotionalState: string;
    cognitiveLoad: number;
    interactionContext: string;
  };
}

export interface EvolutionTriggeredEvent extends NeuralCoreEvent {
  type: 'evolution_triggered';
  data: {
    algorithmId: string;
    improvementPotential: number;
    systemImpact: number;
    learningVector: any;
  };
}

export interface PatternRecognizedEvent extends NeuralCoreEvent {
  type: 'pattern_recognized';
  data: {
    patternType: string;
    pattern: any;
    confidence: number;
    recommendations: string[];
  };
}

export interface InterfaceAdaptationEvent extends NeuralCoreEvent {
  type: 'interface_adaptation';
  data: {
    adaptationType: string;
    userPreferences: any;
    interfaceChanges: any;
    adaptationScore: number;
  };
}

@Injectable()
export class NeuralCoreEventService {
  private readonly logger = new Logger(NeuralCoreEventService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  emitUserIntent(userId: string, intent: string, confidence: number, context: any, predictedActions: string[]) {
    const event: UserIntentEvent = {
      type: 'user_intent_detected',
      userId,
      data: {
        intent,
        confidence,
        context,
        predictedActions,
      },
      timestamp: new Date(),
    };
    this.eventEmitter.emit('neural.user_intent', event);
    this.logger.log(`User intent detected for ${userId}: ${intent} (${confidence}%)`);
  }

  emitConsciousnessUpdate(userId: string, awarenessLevel: number, emotionalState: string, cognitiveLoad: number, interactionContext: string) {
    const event: ConsciousnessUpdateEvent = {
      type: 'consciousness_update',
      userId,
      data: {
        awarenessLevel,
        emotionalState,
        cognitiveLoad,
        interactionContext,
      },
      timestamp: new Date(),
    };
    this.eventEmitter.emit('neural.consciousness_update', event);
    this.logger.log(`Consciousness update for ${userId}: awareness=${awarenessLevel}, emotional=${emotionalState}`);
  }

  emitEvolutionTriggered(userId: string, algorithmId: string, improvementPotential: number, systemImpact: number, learningVector: any) {
    const event: EvolutionTriggeredEvent = {
      type: 'evolution_triggered',
      userId,
      data: {
        algorithmId,
        improvementPotential,
        systemImpact,
        learningVector,
      },
      timestamp: new Date(),
    };
    this.eventEmitter.emit('neural.evolution_triggered', event);
    this.logger.log(`Evolution triggered for algorithm ${algorithmId}: potential=${improvementPotential}%`);
  }

  emitPatternRecognized(userId: string, patternType: string, pattern: any, confidence: number, recommendations: string[]) {
    const event: PatternRecognizedEvent = {
      type: 'pattern_recognized',
      userId,
      data: {
        patternType,
        pattern,
        confidence,
        recommendations,
      },
      timestamp: new Date(),
    };
    this.eventEmitter.emit('neural.pattern_recognized', event);
    this.logger.log(`Pattern recognized for ${userId}: ${patternType} (${confidence}%)`);
  }

  emitInterfaceAdaptation(userId: string, adaptationType: string, userPreferences: any, interfaceChanges: any, adaptationScore: number) {
    const event: InterfaceAdaptationEvent = {
      type: 'interface_adaptation',
      userId,
      data: {
        adaptationType,
        userPreferences,
        interfaceChanges,
        adaptationScore,
      },
      timestamp: new Date(),
    };
    this.eventEmitter.emit('neural.interface_adaptation', event);
    this.logger.log(`Interface adaptation for ${userId}: ${adaptationType} (score=${adaptationScore})`);
  }

  // Generic event emitter for any neural core event
  emitEvent(event: NeuralCoreEvent) {
    this.eventEmitter.emit(`neural.${event.type}`, event);
  }

  // Listen for events (used by other services)
  onUserIntent(callback: (event: UserIntentEvent) => void) {
    this.eventEmitter.on('neural.user_intent', callback);
  }

  onConsciousnessUpdate(callback: (event: ConsciousnessUpdateEvent) => void) {
    this.eventEmitter.on('neural.consciousness_update', callback);
  }

  onEvolutionTriggered(callback: (event: EvolutionTriggeredEvent) => void) {
    this.eventEmitter.on('neural.evolution_triggered', callback);
  }

  onPatternRecognized(callback: (event: PatternRecognizedEvent) => void) {
    this.eventEmitter.on('neural.pattern_recognized', callback);
  }

  onInterfaceAdaptation(callback: (event: InterfaceAdaptationEvent) => void) {
    this.eventEmitter.on('neural.interface_adaptation', callback);
  }
}