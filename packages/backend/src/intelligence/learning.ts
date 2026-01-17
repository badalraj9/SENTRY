/**
 * SENTRY Neural Hub - Learning Engine (Enhanced)
 * 
 * Implements sophisticated learning algorithms:
 * - Hebbian-inspired weight updates ("neurons that fire together, wire together")
 * - Temporal decay (prevent rigidity from old patterns)
 * - Meta-learning (adaptive learning rate based on confidence)
 * - Curiosity signals (encourage exploration when uncertain)
 */

import type { NeuralState, Signal } from '@sentry/shared';
import {
  hebbianUpdate,
  exponentialDecay,
  betaMean,
  betaVariance,
  clamp,
  DEFAULT_LEARNING_RATE,
  DECAY_RATE,
  MIN_THRESHOLD,
  MAX_THRESHOLD,
  BASE_WEIGHT,
} from '@sentry/shared';

// =============================================================================
// LEARNING CONFIGURATION
// =============================================================================

const LEARNING_CONFIG = {
  // Base learning rate (η)
  baseLearningRate: 0.05,
  
  // Learning rate bounds
  minLearningRate: 0.01,
  maxLearningRate: 0.15,
  
  // Threshold adjustment rates
  falsePositiveThresholdBump: 0.02,
  truePositiveThresholdRelax: 0.01,
  
  // Weight bounds
  minWeight: 0.01,
  maxWeight: 1.0,
  baseWeight: 0.5,
  
  // Decay settings
  decayRate: 0.01,
  thresholdDecayDivisor: 2,
  minDecayDays: 1,
  
  // Meta-learning settings
  uncertaintyLearningBoost: 2.0,  // Learn faster when uncertain
  certaintyLearningDampen: 0.5,   // Learn slower when confident
};

// =============================================================================
// LEARNING ENGINE
// =============================================================================

export class LearningEngine {
  /**
   * Update neural state based on user feedback
   * 
   * Implements multi-faceted learning:
   * 1. Hebbian weight updates (reinforce/weaken signals based on outcome)
   * 2. Beta distribution update (track acceptance rate)
   * 3. Threshold adaptation (be more conservative on false positives)
   * 4. Meta-learning (adjust learning rate based on uncertainty)
   */
  learn(
    state: NeuralState,
    contributingSignals: Signal[],
    outcome: 'confirmed' | 'rejected'
  ): NeuralState {
    // 1. Calculate adaptive learning rate (meta-learning)
    const learningRate = this.getAdaptiveLearningRate(state);
    
    // 2. Update weights with Hebbian rule
    const newWeights = this.updateWeights(
      state.weights,
      contributingSignals,
      outcome,
      learningRate
    );

    // 3. Update Beta distribution
    const { alpha: newAlpha, beta: newBeta } = this.updateBetaDistribution(
      state.alpha,
      state.beta,
      outcome
    );

    // 4. Adjust threshold based on outcome
    const newThreshold = this.adjustThreshold(state.threshold, outcome);

    return {
      ...state,
      weights: newWeights,
      threshold: newThreshold,
      alpha: newAlpha,
      beta: newBeta,
      updatedAt: new Date(),
    };
  }

  /**
   * Meta-learning: Adaptive learning rate based on uncertainty
   * 
   * When uncertain (high variance): Learn faster to converge
   * When confident (low variance): Learn slower to maintain stability
   */
  private getAdaptiveLearningRate(state: NeuralState): number {
    const variance = betaVariance(state.alpha, state.beta);
    
    // High variance = uncertain, should learn faster
    // Low variance = confident, should learn slower
    let multiplier = 1.0;
    
    if (variance > 0.1) {
      // High uncertainty: boost learning
      multiplier = LEARNING_CONFIG.uncertaintyLearningBoost;
    } else if (variance < 0.05) {
      // High confidence: dampen learning
      multiplier = LEARNING_CONFIG.certaintyLearningDampen;
    }
    
    const rate = LEARNING_CONFIG.baseLearningRate * multiplier;
    return clamp(rate, LEARNING_CONFIG.minLearningRate, LEARNING_CONFIG.maxLearningRate);
  }

  /**
   * Hebbian weight update with importance weighting
   * 
   * Signals that contributed more to the decision get larger updates
   * Δwᵢ = η × sᵢ × direction × importance
   */
  private updateWeights(
    currentWeights: Record<string, number>,
    signals: Signal[],
    outcome: 'confirmed' | 'rejected',
    learningRate: number
  ): Record<string, number> {
    const newWeights = { ...currentWeights };
    
    // Calculate total signal contribution for importance weighting
    const totalContribution = signals.reduce((sum, s) => sum + Math.abs(s.value), 0);

    for (const signal of signals) {
      if (signal.value > 0) {
        const currentWeight = newWeights[signal.name] ?? signal.baseWeight;
        
        // Importance: how much this signal contributed to the total
        const importance = totalContribution > 0 
          ? signal.value / totalContribution 
          : 1.0;
        
        // Apply Hebbian update with importance weighting
        const effectiveRate = learningRate * (0.5 + importance);
        const newWeight = hebbianUpdate(
          currentWeight,
          signal.value,
          outcome,
          effectiveRate,
          LEARNING_CONFIG.minWeight,
          LEARNING_CONFIG.maxWeight
        );
        
        newWeights[signal.name] = newWeight;
      }
    }

    return newWeights;
  }

  /**
   * Update Beta distribution for Bayesian confidence tracking
   */
  private updateBetaDistribution(
    alpha: number,
    beta: number,
    outcome: 'confirmed' | 'rejected'
  ): { alpha: number; beta: number } {
    if (outcome === 'confirmed') {
      return { alpha: alpha + 1, beta };
    } else {
      return { alpha, beta: beta + 1 };
    }
  }

  /**
   * Adjust threshold based on outcome
   * 
   * False positive (rejected): Raise threshold to be more conservative
   * True positive with high threshold: Can relax slightly
   */
  private adjustThreshold(currentThreshold: number, outcome: 'confirmed' | 'rejected'): number {
    if (outcome === 'rejected') {
      // False positive: user didn't want this proposal, be more conservative
      return Math.min(MAX_THRESHOLD, currentThreshold + LEARNING_CONFIG.falsePositiveThresholdBump);
    } else if (currentThreshold > 0.70) {
      // True positive with high threshold: can afford to relax
      return Math.max(MIN_THRESHOLD + 0.05, currentThreshold - LEARNING_CONFIG.truePositiveThresholdRelax);
    }
    
    return currentThreshold;
  }

  /**
   * Apply temporal decay to neural state
   * 
   * Weights drift toward baseline over time:
   * w(t) = w₀ × e^(-λt) + base × (1 - e^(-λt))
   * 
   * This prevents the system from becoming too rigid
   * based on old patterns that may no longer be relevant.
   */
  applyDecay(state: NeuralState, daysSinceUpdate: number): NeuralState {
    // Don't decay if recently updated
    if (daysSinceUpdate < LEARNING_CONFIG.minDecayDays) {
      return state;
    }

    const decayedWeights: Record<string, number> = {};

    for (const [name, weight] of Object.entries(state.weights)) {
      const decayed = exponentialDecay(
        weight,
        LEARNING_CONFIG.baseWeight,
        daysSinceUpdate,
        LEARNING_CONFIG.decayRate
      );
      decayedWeights[name] = decayed;
    }

    // Also slightly decay threshold toward default
    const decayedThreshold = exponentialDecay(
      state.threshold,
      0.75, // Default threshold
      daysSinceUpdate,
      LEARNING_CONFIG.decayRate / LEARNING_CONFIG.thresholdDecayDivisor
    );

    return {
      ...state,
      weights: decayedWeights,
      threshold: decayedThreshold,
      updatedAt: new Date(),
    };
  }

  /**
   * Get acceptance rate from Beta distribution
   * E[acceptance] = α / (α + β)
   */
  getAcceptanceRate(state: NeuralState): number {
    return betaMean(state.alpha, state.beta);
  }

  /**
   * Get uncertainty (variance) from Beta distribution
   * High variance = uncertain about user preferences
   * Low variance = confident about user preferences
   */
  getUncertainty(state: NeuralState): number {
    return betaVariance(state.alpha, state.beta);
  }

  /**
   * Calculate adaptive threshold based on user's acceptance rate
   * 
   * If user confirms frequently (>70%): lower threshold (they want more proposals)
   * If user rejects frequently (<30%): raise threshold (they want fewer)
   */
  getAdaptiveThreshold(state: NeuralState): number {
    const acceptanceRate = this.getAcceptanceRate(state);
    
    // Formula: threshold × (1 + (0.5 - acceptanceRate) × 0.3)
    const adjustment = (0.5 - acceptanceRate) * 0.3;
    return clamp(state.threshold * (1 + adjustment), MIN_THRESHOLD, MAX_THRESHOLD);
  }

  /**
   * Generate a learning report for debugging/explainability
   */
  generateLearningReport(
    stateBefore: NeuralState,
    stateAfter: NeuralState,
    signals: Signal[],
    outcome: 'confirmed' | 'rejected'
  ): LearningReport {
    const weightChanges: WeightChange[] = [];

    for (const signal of signals) {
      const before = stateBefore.weights[signal.name] ?? signal.baseWeight;
      const after = stateAfter.weights[signal.name] ?? signal.baseWeight;
      
      if (Math.abs(after - before) > 0.001) {
        weightChanges.push({
          signalName: signal.name,
          before,
          after,
          delta: after - before,
          direction: outcome === 'confirmed' ? 'strengthened' : 'weakened',
        });
      }
    }

    return {
      outcome,
      acceptanceRateBefore: this.getAcceptanceRate(stateBefore),
      acceptanceRateAfter: this.getAcceptanceRate(stateAfter),
      thresholdBefore: stateBefore.threshold,
      thresholdAfter: stateAfter.threshold,
      learningRateUsed: this.getAdaptiveLearningRate(stateBefore),
      weightChanges,
      totalSignalsProcessed: signals.length,
    };
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface WeightChange {
  signalName: string;
  before: number;
  after: number;
  delta: number;
  direction: 'strengthened' | 'weakened';
}

export interface LearningReport {
  outcome: 'confirmed' | 'rejected';
  acceptanceRateBefore: number;
  acceptanceRateAfter: number;
  thresholdBefore: number;
  thresholdAfter: number;
  learningRateUsed: number;
  weightChanges: WeightChange[];
  totalSignalsProcessed: number;
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const learningEngine = new LearningEngine();
