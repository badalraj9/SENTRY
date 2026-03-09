/**
 * SENTRY Neural Hub - Detection Engine (Enhanced)
 * 
 * Pure algorithmic intelligence using AI-inspired mathematics.
 * No ML models. Every decision is 100% traceable and explainable.
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────────────────┐
 * │                    NEURAL HUB                           │
 * │                                                         │
 * │  INPUT         PROCESSING        OUTPUT       FEEDBACK  │
 * │  ─────         ──────────        ──────       ────────  │
 * │                                                         │
 * │  [Sensors] → [Σ weighted] → [σ(x)] → [Decision] → [Δw] │
 * │      │            │            │          │         │   │
 * │      ▼            ▼            ▼          ▼         ▼   │
 * │  Features    Aggregation   Activation   Emit    Learn   │
 * │                                                         │
 * └─────────────────────────────────────────────────────────┘
 */

import type {
  Signal,
  SignalType,
  ProcessResult,
  NeuralState,
  Message,
  ChatType,
  ChatIntent,
} from '@sentry/shared';

import {
  DECISION_PATTERNS,
  QUICK_DECISION_PATTERN,
  STRUCTURAL_WEIGHTS,
  CHAT_TYPE_WEIGHTS,
  INTENT_ALIGNMENT_MAX,
  DEFAULT_THRESHOLD,
} from '@sentry/shared';

import {
  sigmoid,
  jaccardSimilarity,
  tokenize,
  betaMean,
  betaVariance,
} from '@sentry/shared';

import { semanticEngine } from './semantic-engine.js';

// =============================================================================
// ENHANCED TYPES
// =============================================================================

export interface ProcessingContext {
  chatType: ChatType;
  isAuthorMaintainer: boolean;
  participantCount: number;
  threadDepth: number;
  reactionCount: number;
  replyCount: number;
  recentMsgRate: number;
  avgMsgRate: number;
  activeIntent: ChatIntent | null;
  messageTimestamp: Date;
  discussionStartTime: Date | null;
}

/**
 * Detailed explanation of how the decision was made
 */
export interface ReasoningTrace {
  // Input summary
  messageSnippet: string;
  chatType: ChatType;
  hasActiveIntent: boolean;
  
  // Sensor outputs with explanations
  signals: SignalExplanation[];
  
  // Processing steps
  aggregatedScore: number;
  thresholdUsed: number;
  confidenceBeforeUncertainty: number;
  uncertaintyFactor: number;
  
  // Final output
  finalConfidence: number;
  decision: 'propose' | 'silence';
  decisionRationale: string;
}

export interface SignalExplanation {
  name: string;
  type: SignalType;
  rawValue: number;
  weight: number;
  contribution: number;  // value × weight
  explanation: string;
}

export interface EnhancedProcessResult extends ProcessResult {
  reasoning: ReasoningTrace;
  uncertaintyLevel: 'low' | 'medium' | 'high';
}

// =============================================================================
// SENSORS
// =============================================================================

/**
 * Linguistic Sensor - Pattern matching for decision language
 * Precompiled patterns for O(1) lookup
 */
export class LinguisticSensor {
  private static compiledPatterns = DECISION_PATTERNS.map(p => ({
    ...p,
    compiled: new RegExp(p.pattern),
  }));

  extract(content: string): Signal[] {
    const signals: Signal[] = [];

    for (const pattern of LinguisticSensor.compiledPatterns) {
      if (pattern.compiled.test(content)) {
        signals.push({
          name: pattern.name,
          type: 'linguistic' as SignalType,
          value: 1.0,
          baseWeight: pattern.baseWeight,
        });
      }
    }

    return signals;
  }

  /**
   * Quick check for early exit optimization
   */
  hasDecisionMarkers(content: string): boolean {
    return QUICK_DECISION_PATTERN.test(content);
  }

  /**
   * Get human-readable explanation for a pattern match
   */
  explain(signalName: string): string {
    const explanations: Record<string, string> = {
      'decided': 'Contains explicit decision language ("decided")',
      'lets_go_with': 'Contains commitment phrase ("let\'s go with")',
      'will_use': 'Contains future commitment ("we\'ll use")',
      'final': 'Contains closure signal ("final/finalized")',
      'settled_on': 'Contains resolution phrase ("settled on")',
      'going_with': 'Contains selection phrase ("going with/forward")',
      'agreed': 'Contains consensus marker ("agreed")',
      'pick': 'Contains selection verb ("pick/picked")',
      'choose': 'Contains selection verb ("choose/chose")',
    };
    return explanations[signalName] || `Matched pattern: ${signalName}`;
  }
}

/**
 * Structural Sensor - Thread and interaction analysis
 */
export class StructuralSensor {
  extract(ctx: ProcessingContext): Signal[] {
    const signals: Signal[] = [];

    // Thread depth signal
    // Formula: min(depth × 0.03, 0.15)
    // Deeper threads suggest more deliberation
    const depthValue = Math.min(
      ctx.threadDepth * STRUCTURAL_WEIGHTS.threadDepth.multiplier,
      STRUCTURAL_WEIGHTS.threadDepth.max
    );
    signals.push({
      name: 'thread_depth',
      type: 'structural',
      value: depthValue,
      baseWeight: 1.0,
    });

    // Maintainer authority signal
    // Maintainers have decision authority
    if (ctx.isAuthorMaintainer) {
      signals.push({
        name: 'maintainer_author',
        type: 'structural',
        value: STRUCTURAL_WEIGHTS.maintainerAuthor.bonus,
        baseWeight: 1.0,
      });
    }

    // Acknowledgment ratio signal
    // More reactions/replies = more consensus
    // Formula: min((reactions + replies) / participants × 0.05, 0.10)
    const ackRatio = (ctx.reactionCount + ctx.replyCount) / Math.max(1, ctx.participantCount);
    const ackValue = Math.min(
      ackRatio * STRUCTURAL_WEIGHTS.acknowledgmentRatio.multiplier,
      STRUCTURAL_WEIGHTS.acknowledgmentRatio.max
    );
    signals.push({
      name: 'acknowledgment_ratio',
      type: 'structural',
      value: ackValue,
      baseWeight: 1.0,
    });

    // Debate burst signal (activity spike detection)
    // High recent activity suggests active decision-making
    // Formula: min(recentRate / avgRate / 3, 0.08)
    if (ctx.avgMsgRate > 0) {
      const burstFactor = ctx.recentMsgRate / ctx.avgMsgRate;
      const burstValue = Math.min(
        burstFactor / STRUCTURAL_WEIGHTS.debateBurst.divisor,
        STRUCTURAL_WEIGHTS.debateBurst.max
      );
      signals.push({
        name: 'debate_burst',
        type: 'structural',
        value: burstValue,
        baseWeight: 1.0,
      });
    }

    return signals;
  }

  explain(signalName: string, value: number): string {
    const explanations: Record<string, (v: number) => string> = {
      'thread_depth': (v) => `Thread has ${Math.round(v / 0.03)} levels of replies (more depth = more deliberation)`,
      'maintainer_author': () => 'Message author is a project maintainer (has decision authority)',
      'acknowledgment_ratio': (v) => `${Math.round(v * 20)}% acknowledgment from participants`,
      'debate_burst': (v) => `Activity is ${Math.round(v * 3 * 100)}% higher than average (active discussion)`,
    };
    return explanations[signalName]?.(value) || `Structural signal: ${signalName}`;
  }
}

/**
 * Contextual Sensor - Intent and chat type analysis
 */
export class ContextualSensor {
  extract(content: string, ctx: ProcessingContext): Signal[] {
    const signals: Signal[] = [];

    // Chat type signal
    // Workshops are decision-oriented, direct chats less so
    const chatTypeWeight = CHAT_TYPE_WEIGHTS[ctx.chatType] ?? 0.05;
    signals.push({
      name: 'chat_type',
      type: 'contextual',
      value: chatTypeWeight,
      baseWeight: 1.0,
    });

    // Intent alignment signal
    // If there's an active intent and message relates to it
    if (ctx.activeIntent) {
      const similarity = this.computeIntentAlignment(content, ctx.activeIntent.statement);
      const intentValue = similarity * INTENT_ALIGNMENT_MAX;
      signals.push({
        name: 'intent_alignment',
        type: 'contextual',
        value: intentValue,
        baseWeight: 1.0,
      });
    }

    return signals;
  }

  /**
   * Compute semantic alignment with active intent
   * Uses TF-IDF + cosine similarity for better matching
   */
  private computeIntentAlignment(content: string, intentStatement: string): number {
    const result = semanticEngine.computeMatch(content, intentStatement);
    return result.similarity;
  }

  explain(signalName: string, value: number, ctx: ProcessingContext): string {
    if (signalName === 'chat_type') {
      const typeDesc: Record<string, string> = {
        'workshop': 'Workshop chat (high decision focus)',
        'group_collab': 'Group collaboration chat (medium decision focus)',
        'direct': 'Direct message (lower decision focus)',
        'community': 'Community chat (general discussion)',
      };
      return typeDesc[ctx.chatType] || `Chat type: ${ctx.chatType}`;
    }
    if (signalName === 'intent_alignment') {
      const pct = Math.round(value / INTENT_ALIGNMENT_MAX * 100);
      return `${pct}% alignment with active intent: "${ctx.activeIntent?.statement?.slice(0, 50)}..."`;
    }
    return `Contextual signal: ${signalName}`;
  }
}

/**
 * Temporal Sensor - Time-based patterns
 * Analyzes when decisions are more likely to be made
 */
export class TemporalSensor {
  extract(ctx: ProcessingContext): Signal[] {
    const signals: Signal[] = [];
    const now = ctx.messageTimestamp;
    const hour = now.getHours();

    // Time of day signal
    // Core working hours (9-17) have higher decision weight
    // Early morning/late night decisions are less common
    let timeWeight = 0;
    if (hour >= 9 && hour < 17) {
      timeWeight = 0.05; // Core hours bonus
    } else if (hour >= 7 && hour < 21) {
      timeWeight = 0.02; // Extended hours
    }
    // Night hours get no bonus

    if (timeWeight > 0) {
      signals.push({
        name: 'working_hours',
        type: 'temporal',
        value: timeWeight,
        baseWeight: 1.0,
      });
    }

    // Discussion recency signal
    // Recent active discussion = higher decision likelihood
    if (ctx.discussionStartTime) {
      const durationMinutes = (now.getTime() - ctx.discussionStartTime.getTime()) / (1000 * 60);
      
      // Sweet spot: 10-60 minutes of discussion is ideal for decisions
      let recencyWeight = 0;
      if (durationMinutes >= 10 && durationMinutes <= 60) {
        recencyWeight = 0.05;
      } else if (durationMinutes >= 5 && durationMinutes <= 120) {
        recencyWeight = 0.02;
      }

      if (recencyWeight > 0) {
        signals.push({
          name: 'discussion_maturity',
          type: 'temporal',
          value: recencyWeight,
          baseWeight: 1.0,
        });
      }
    }

    return signals;
  }

  explain(signalName: string, value: number): string {
    if (signalName === 'working_hours') {
      return value >= 0.05 
        ? 'Message sent during core working hours (9 AM - 5 PM)' 
        : 'Message sent during extended working hours';
    }
    if (signalName === 'discussion_maturity') {
      return value >= 0.05
        ? 'Discussion has reached decision-ready maturity (10-60 min)'
        : 'Discussion is in progress';
    }
    return `Temporal signal: ${signalName}`;
  }
}

// =============================================================================
// SYNAPTIC PROCESSOR
// =============================================================================

export class SynapticProcessor {
  /**
   * Aggregate signals using learned weights
   * Formula: z = Σ(signal.value × weight)
   */
  aggregate(signals: Signal[], weights: Record<string, number>): number {
    let sum = 0;

    for (const signal of signals) {
      const weight = weights[signal.name] ?? signal.baseWeight;
      sum += signal.value * weight;
    }

    return sum;
  }

  /**
   * Apply sigmoid activation with adjustable steepness
   * σ(z) = 1 / (1 + e^(-k(z - θ)))
   * 
   * @param aggregated - The sum of weighted signals
   * @param threshold - The decision threshold (default 0.75)
   * @param steepness - How sharp the transition is (default 10)
   */
  activate(aggregated: number, threshold: number, steepness = 10): number {
    return sigmoid(aggregated, threshold, steepness);
  }

  /**
   * Softmax for multi-class classification (e.g., intent type classification)
   * softmax(zᵢ) = e^zᵢ / Σe^zⱼ
   */
  softmax(scores: number[]): number[] {
    const maxScore = Math.max(...scores);
    const expScores = scores.map(z => Math.exp(z - maxScore)); // Subtract max for numerical stability
    const sumExp = expScores.reduce((a, b) => a + b, 0);
    return expScores.map(e => e / sumExp);
  }

  /**
   * Calculate uncertainty adjustment based on Beta distribution
   * High variance = uncertain, be more conservative
   * Low variance = confident, trust the score
   */
  applyUncertainty(confidence: number, state: NeuralState): { adjusted: number; factor: number } {
    const variance = betaVariance(state.alpha, state.beta);
    
    // High variance (>0.1) = pull confidence toward 0.5 (uncertainty)
    // Low variance (<0.05) = trust the confidence
    const uncertaintyFactor = Math.min(variance * 5, 0.3); // Max 30% pull
    const adjusted = confidence * (1 - uncertaintyFactor) + 0.5 * uncertaintyFactor;
    
    return { adjusted, factor: uncertaintyFactor };
  }
}

// =============================================================================
// NEURAL HUB - MAIN ORCHESTRATOR
// =============================================================================

export class NeuralHub {
  private linguisticSensor = new LinguisticSensor();
  private structuralSensor = new StructuralSensor();
  private contextualSensor = new ContextualSensor();
  private temporalSensor = new TemporalSensor();
  private processor = new SynapticProcessor();

  /**
   * Process a message and determine if it contains a decision
   * Returns full reasoning trace for explainability
   * 
   * Pipeline:
   * 1. Early exit if no decision markers (Tier 1)
   * 2. Extract signals from all sensors (Tier 2)
   * 3. Aggregate with learned weights (Tier 3)
   * 4. Apply activation function (Tier 4)
   * 5. Apply uncertainty adjustment (Tier 5)
   * 6. Determine if should propose (Tier 6)
   * 7. Generate reasoning trace
   */
  process(
    message: Pick<Message, 'content'>,
    ctx: ProcessingContext,
    state: NeuralState
  ): EnhancedProcessResult {
    // Tier 1: Quick linguistic check (early exit optimization)
    if (!this.linguisticSensor.hasDecisionMarkers(message.content)) {
      return this.createSilentResult(message, ctx, 'No decision language detected');
    }

    // Tier 2: Full signal extraction from all sensors
    const linguisticSignals = this.linguisticSensor.extract(message.content);
    const structuralSignals = this.structuralSensor.extract(ctx);
    const contextualSignals = this.contextualSensor.extract(message.content, ctx);
    const temporalSignals = this.temporalSensor.extract(ctx);

    const allSignals: Signal[] = [
      ...linguisticSignals,
      ...structuralSignals,
      ...contextualSignals,
      ...temporalSignals,
    ];

    // Tier 3: Aggregation with learned weights
    const aggregated = this.processor.aggregate(allSignals, state.weights);

    // Tier 4: Apply adaptive threshold
    const effectiveThreshold = this.getEffectiveThreshold(state);
    const rawConfidence = this.processor.activate(aggregated, effectiveThreshold);

    // Tier 5: Apply uncertainty adjustment
    const { adjusted: finalConfidence, factor: uncertaintyFactor } = 
      this.processor.applyUncertainty(rawConfidence, state);

    // Tier 6: Decision
    const shouldPropose = finalConfidence >= 0.5;

    // Tier 7: Build reasoning trace
    const signalExplanations = this.buildSignalExplanations(allSignals, state, ctx);
    
    const reasoning: ReasoningTrace = {
      messageSnippet: message.content.slice(0, 100) + (message.content.length > 100 ? '...' : ''),
      chatType: ctx.chatType,
      hasActiveIntent: !!ctx.activeIntent,
      signals: signalExplanations,
      aggregatedScore: aggregated,
      thresholdUsed: effectiveThreshold,
      confidenceBeforeUncertainty: rawConfidence,
      uncertaintyFactor,
      finalConfidence,
      decision: shouldPropose ? 'propose' : 'silence',
      decisionRationale: this.generateRationale(shouldPropose, finalConfidence, signalExplanations),
    };

    // Sort contributing signals by contribution
    const contributingSignals = allSignals
      .filter(s => s.value > 0)
      .sort((a, b) => {
        const weightA = state.weights[a.name] ?? a.baseWeight;
        const weightB = state.weights[b.name] ?? b.baseWeight;
        return (b.value * weightB) - (a.value * weightA);
      });

    return {
      confidence: finalConfidence,
      shouldPropose,
      contributingSignals,
      aggregatedScore: aggregated,
      reasoning,
      uncertaintyLevel: this.getUncertaintyLevel(state),
    };
  }

  /**
   * Get effective threshold based on user's acceptance rate
   * Adapts to user behavior: conservative if rejecting often, relaxed if confirming often
   */
  private getEffectiveThreshold(state: NeuralState): number {
    const acceptanceRate = betaMean(state.alpha, state.beta);
    
    // If user accepts frequently (>70%): can lower threshold slightly
    // If user rejects frequently (<30%): should raise threshold
    const adjustment = (0.5 - acceptanceRate) * 0.15;
    
    return Math.max(0.60, Math.min(0.90, state.threshold + adjustment));
  }

  /**
   * Build detailed explanations for each signal
   */
  private buildSignalExplanations(
    signals: Signal[],
    state: NeuralState,
    ctx: ProcessingContext
  ): SignalExplanation[] {
    return signals.map(signal => {
      const weight = state.weights[signal.name] ?? signal.baseWeight;
      const contribution = signal.value * weight;

      let explanation = '';
      switch (signal.type) {
        case 'linguistic':
          explanation = this.linguisticSensor.explain(signal.name);
          break;
        case 'structural':
          explanation = this.structuralSensor.explain(signal.name, signal.value);
          break;
        case 'contextual':
          explanation = this.contextualSensor.explain(signal.name, signal.value, ctx);
          break;
        case 'temporal':
          explanation = this.temporalSensor.explain(signal.name, signal.value);
          break;
      }

      return {
        name: signal.name,
        type: signal.type,
        rawValue: signal.value,
        weight,
        contribution,
        explanation,
      };
    }).sort((a, b) => b.contribution - a.contribution);
  }

  /**
   * Generate human-readable rationale for the decision
   */
  private generateRationale(
    shouldPropose: boolean,
    confidence: number,
    signals: SignalExplanation[]
  ): string {
    const topSignals = signals.slice(0, 3);
    const pct = Math.round(confidence * 100);

    if (shouldPropose) {
      const reasons = topSignals.map(s => s.explanation).join('; ');
      return `Proposing decision (${pct}% confidence). Key factors: ${reasons}`;
    } else {
      if (confidence > 0.3) {
        return `Not enough evidence to propose (${pct}% confidence). Would need stronger signals.`;
      } else {
        return `Low decision likelihood (${pct}% confidence). Message appears to be discussion, not conclusion.`;
      }
    }
  }

  /**
   * Determine uncertainty level based on Beta distribution
   */
  private getUncertaintyLevel(state: NeuralState): 'low' | 'medium' | 'high' {
    const totalObservations = state.alpha + state.beta - 2; // Subtract prior
    
    if (totalObservations < 5) return 'high';
    if (totalObservations < 20) return 'medium';
    return 'low';
  }

  /**
   * Create result for silent (no proposal) outcome
   */
  private createSilentResult(
    message: Pick<Message, 'content'>,
    ctx: ProcessingContext,
    reason: string
  ): EnhancedProcessResult {
    return {
      confidence: 0,
      shouldPropose: false,
      contributingSignals: [],
      aggregatedScore: 0,
      uncertaintyLevel: 'high',
      reasoning: {
        messageSnippet: message.content.slice(0, 100),
        chatType: ctx.chatType,
        hasActiveIntent: !!ctx.activeIntent,
        signals: [],
        aggregatedScore: 0,
        thresholdUsed: DEFAULT_THRESHOLD,
        confidenceBeforeUncertainty: 0,
        uncertaintyFactor: 0,
        finalConfidence: 0,
        decision: 'silence',
        decisionRationale: reason,
      },
    };
  }

  /**
   * Get default neural state for new user/project
   */
  getDefaultState(userId: string, projectId: string): NeuralState {
    return {
      userId,
      projectId,
      weights: {},
      threshold: DEFAULT_THRESHOLD,
      alpha: 1,  // Prior: 1 confirmation
      beta: 1,   // Prior: 1 rejection (uninformative prior)
      updatedAt: new Date(),
    };
  }

  /**
   * Get a summary of the current neural state for debugging/display
   */
  describeSt(state: NeuralState): {
    acceptanceRate: number;
    totalInteractions: number;
    customizedWeights: number;
    uncertaintyLevel: 'low' | 'medium' | 'high';
  } {
    return {
      acceptanceRate: betaMean(state.alpha, state.beta),
      totalInteractions: state.alpha + state.beta - 2,
      customizedWeights: Object.keys(state.weights).length,
      uncertaintyLevel: this.getUncertaintyLevel(state),
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const neuralHub = new NeuralHub();
