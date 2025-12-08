import { Module, forwardRef } from '@nestjs/common';
import { QuantumNeuralCore } from './quantum-neural-core.service';
import { QuantumUserProfiler } from './quantum-user-profiler.service';
import { PredictiveIntelligenceEngine } from './predictive-intelligence-engine.service';
import { AdaptiveInterfaceEngine } from './adaptive-interface-engine.service';
import { ConsciousnessStreamProcessor } from './consciousness-stream-processor.service';
import { NeuralMarketplace } from './neural-marketplace.service';
import { QuantumFinancialEngineService } from './quantum-financial-engine.service';
import { EvolutionAlgorithmService } from './evolution-algorithm.service';
import { AfricaOptimizationService } from './africa-optimization.service';
import { NeuralCACEnhancementService } from './neural-cac-enhancement.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    QuantumNeuralCore,
    QuantumUserProfiler,
    PredictiveIntelligenceEngine,
    AdaptiveInterfaceEngine,
    ConsciousnessStreamProcessor,
    NeuralMarketplace,
    QuantumFinancialEngineService,
    EvolutionAlgorithmService,
    AfricaOptimizationService,
    NeuralCACEnhancementService,
  ],
  exports: [
    QuantumNeuralCore,
    QuantumUserProfiler,
    PredictiveIntelligenceEngine,
    AdaptiveInterfaceEngine,
    ConsciousnessStreamProcessor,
    NeuralMarketplace,
    QuantumFinancialEngineService,
    EvolutionAlgorithmService,
    AfricaOptimizationService,
    NeuralCACEnhancementService,
  ],
})
export class NeuralCoreModule {}
