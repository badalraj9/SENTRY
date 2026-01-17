/**
 * Neural Hub Unit Tests
 * 
 * Tests for the detection engine, learning, and sensors
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  NeuralHub,
  LinguisticSensor,
  StructuralSensor,
  ContextualSensor,
  TemporalSensor,
  ProcessingContext,
} from '../src/intelligence/neural-hub.js';
import { LearningEngine } from '../src/intelligence/learning.js';
import type { NeuralState, Signal } from '@sentry/shared';

// =============================================================================
// TEST FIXTURES
// =============================================================================

function createDefaultContext(overrides: Partial<ProcessingContext> = {}): ProcessingContext {
  return {
    chatType: 'group_collab',
    isAuthorMaintainer: false,
    participantCount: 3,
    threadDepth: 0,
    reactionCount: 0,
    replyCount: 0,
    recentMsgRate: 1,
    avgMsgRate: 1,
    activeIntent: null,
    messageTimestamp: new Date(),
    discussionStartTime: null,
    ...overrides,
  };
}

function createDefaultState(overrides: Partial<NeuralState> = {}): NeuralState {
  return {
    userId: 'test-user',
    projectId: 'test-project',
    weights: {},
    threshold: 0.75,
    alpha: 1,
    beta: 1,
    updatedAt: new Date(),
    ...overrides,
  };
}

// =============================================================================
// LINGUISTIC SENSOR TESTS
// =============================================================================

describe('LinguisticSensor', () => {
  const sensor = new LinguisticSensor();

  describe('hasDecisionMarkers', () => {
    it('returns true for messages with decision language', () => {
      expect(sensor.hasDecisionMarkers("We've decided to use PostgreSQL")).toBe(true);
      expect(sensor.hasDecisionMarkers("Let's go with React")).toBe(true);
      expect(sensor.hasDecisionMarkers("We'll use TypeScript")).toBe(true);
      expect(sensor.hasDecisionMarkers("It's final")).toBe(true);
      expect(sensor.hasDecisionMarkers("We agreed on this approach")).toBe(true);
    });

    it('returns false for regular discussion messages', () => {
      expect(sensor.hasDecisionMarkers("What do you think about PostgreSQL?")).toBe(false);
      expect(sensor.hasDecisionMarkers("I prefer React but not sure")).toBe(false);
      expect(sensor.hasDecisionMarkers("We should discuss this more")).toBe(false);
    });
  });

  describe('extract', () => {
    it('extracts matching patterns with weights', () => {
      const signals = sensor.extract("We've decided to use PostgreSQL");
      
      expect(signals.length).toBeGreaterThan(0);
      expect(signals.some(s => s.name === 'decided')).toBe(true);
      
      const decidedSignal = signals.find(s => s.name === 'decided');
      expect(decidedSignal?.baseWeight).toBe(0.35);
    });

    it('extracts multiple patterns when present', () => {
      const signals = sensor.extract("We've decided and agreed to go with this final solution");
      
      expect(signals.some(s => s.name === 'decided')).toBe(true);
      expect(signals.some(s => s.name === 'agreed')).toBe(true);
      expect(signals.some(s => s.name === 'final')).toBe(true);
    });

    it('returns empty array for non-decision messages', () => {
      const signals = sensor.extract("What database should we use?");
      expect(signals.length).toBe(0);
    });
  });
});

// =============================================================================
// STRUCTURAL SENSOR TESTS
// =============================================================================

describe('StructuralSensor', () => {
  const sensor = new StructuralSensor();

  it('adds thread depth signal', () => {
    const ctx = createDefaultContext({ threadDepth: 5 });
    const signals = sensor.extract(ctx);

    const depthSignal = signals.find(s => s.name === 'thread_depth');
    expect(depthSignal).toBeDefined();
    expect(depthSignal!.value).toBe(0.15); // min(5 * 0.03, 0.15)
  });

  it('adds maintainer bonus when author is maintainer', () => {
    const ctx = createDefaultContext({ isAuthorMaintainer: true });
    const signals = sensor.extract(ctx);

    const maintainerSignal = signals.find(s => s.name === 'maintainer_author');
    expect(maintainerSignal).toBeDefined();
    expect(maintainerSignal!.value).toBe(0.12);
  });

  it('calculates acknowledgment ratio correctly', () => {
    const ctx = createDefaultContext({
      reactionCount: 5,
      replyCount: 3,
      participantCount: 4,
    });
    const signals = sensor.extract(ctx);

    const ackSignal = signals.find(s => s.name === 'acknowledgment_ratio');
    expect(ackSignal).toBeDefined();
    // (5 + 3) / 4 * 0.05 = 0.10 (capped at max)
    expect(ackSignal!.value).toBe(0.10);
  });

  it('detects debate burst', () => {
    const ctx = createDefaultContext({
      recentMsgRate: 6,
      avgMsgRate: 2,
    });
    const signals = sensor.extract(ctx);

    const burstSignal = signals.find(s => s.name === 'debate_burst');
    expect(burstSignal).toBeDefined();
    // 6/2/3 = 1 → capped at 0.08
    expect(burstSignal!.value).toBeLessThanOrEqual(0.08);
  });
});

// =============================================================================
// CONTEXTUAL SENSOR TESTS
// =============================================================================

describe('ContextualSensor', () => {
  const sensor = new ContextualSensor();

  it('adds chat type weight for workshops', () => {
    const ctx = createDefaultContext({ chatType: 'workshop' });
    const signals = sensor.extract("some content", ctx);

    const typeSignal = signals.find(s => s.name === 'chat_type');
    expect(typeSignal).toBeDefined();
    expect(typeSignal!.value).toBe(0.15);
  });

  it('adds intent alignment when active intent exists', () => {
    const ctx = createDefaultContext({
      activeIntent: {
        id: 'test',
        chatId: 'chat',
        statement: 'Choose a database technology',
        status: 'active',
        createdBy: 'user',
        createdAt: new Date(),
      },
    });
    
    const signals = sensor.extract("Let's use PostgreSQL as our database", ctx);

    const intentSignal = signals.find(s => s.name === 'intent_alignment');
    expect(intentSignal).toBeDefined();
    expect(intentSignal!.value).toBeGreaterThan(0);
  });
});

// =============================================================================
// TEMPORAL SENSOR TESTS
// =============================================================================

describe('TemporalSensor', () => {
  const sensor = new TemporalSensor();

  it('adds working hours bonus during core hours', () => {
    const coreHoursDate = new Date();
    coreHoursDate.setHours(14, 0, 0, 0); // 2 PM

    const ctx = createDefaultContext({ messageTimestamp: coreHoursDate });
    const signals = sensor.extract(ctx);

    const timeSignal = signals.find(s => s.name === 'working_hours');
    expect(timeSignal).toBeDefined();
    expect(timeSignal!.value).toBe(0.05);
  });

  it('adds discussion maturity for mature discussions', () => {
    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const ctx = createDefaultContext({
      messageTimestamp: now,
      discussionStartTime: thirtyMinAgo,
    });
    const signals = sensor.extract(ctx);

    const maturitySignal = signals.find(s => s.name === 'discussion_maturity');
    expect(maturitySignal).toBeDefined();
    expect(maturitySignal!.value).toBe(0.05);
  });
});

// =============================================================================
// NEURAL HUB INTEGRATION TESTS
// =============================================================================

describe('NeuralHub', () => {
  const hub = new NeuralHub();

  describe('process', () => {
    it('returns low confidence for non-decision messages', () => {
      const result = hub.process(
        { content: "What do you think about this?" },
        createDefaultContext(),
        createDefaultState()
      );

      expect(result.confidence).toBe(0);
      expect(result.shouldPropose).toBe(false);
    });

    it('returns high confidence for strong decision messages', () => {
      const ctx = createDefaultContext({
        chatType: 'workshop',
        isAuthorMaintainer: true,
        threadDepth: 3,
      });

      const result = hub.process(
        { content: "We've decided to use PostgreSQL for the main database." },
        ctx,
        createDefaultState()
      );

      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.shouldPropose).toBe(true);
      expect(result.reasoning.decision).toBe('propose');
    });

    it('provides full reasoning trace', () => {
      const result = hub.process(
        { content: "Let's go with React for the frontend." },
        createDefaultContext({ chatType: 'group_collab' }),
        createDefaultState()
      );

      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.signals.length).toBeGreaterThan(0);
      expect(result.reasoning.aggregatedScore).toBeGreaterThan(0);
      expect(result.reasoning.decisionRationale).toBeTruthy();
    });

    it('uses learned weights when available', () => {
      const state = createDefaultState({
        weights: {
          'decided': 0.8,  // Boosted weight
          'lets_go_with': 0.9,
        },
      });

      const result = hub.process(
        { content: "Let's go with this approach." },
        createDefaultContext(),
        state
      );

      // Higher weights should increase confidence
      expect(result.aggregatedScore).toBeGreaterThan(0.5);
    });
  });

  describe('uncertainty handling', () => {
    it('applies uncertainty factor for new users', () => {
      const newUserState = createDefaultState({ alpha: 1, beta: 1 });
      
      const result = hub.process(
        { content: "We've decided on PostgreSQL." },
        createDefaultContext({ isAuthorMaintainer: true }),
        newUserState
      );

      expect(result.uncertaintyLevel).toBe('high');
      expect(result.reasoning.uncertaintyFactor).toBeGreaterThan(0);
    });

    it('has low uncertainty for experienced users', () => {
      const experiencedState = createDefaultState({ alpha: 30, beta: 10 });
      
      const result = hub.process(
        { content: "We've decided on PostgreSQL." },
        createDefaultContext({ isAuthorMaintainer: true }),
        experiencedState
      );

      expect(result.uncertaintyLevel).toBe('low');
    });
  });
});

// =============================================================================
// LEARNING ENGINE TESTS
// =============================================================================

describe('LearningEngine', () => {
  const engine = new LearningEngine();

  describe('learn', () => {
    it('strengthens weights on confirmed proposals', () => {
      const state = createDefaultState({
        weights: { 'decided': 0.35 },
      });
      
      const signals: Signal[] = [
        { name: 'decided', type: 'linguistic', value: 1.0, baseWeight: 0.35 },
      ];

      const newState = engine.learn(state, signals, 'confirmed');

      expect(newState.weights['decided']).toBeGreaterThan(0.35);
      expect(newState.alpha).toBe(2); // +1 confirmation
      expect(newState.beta).toBe(1);  // unchanged
    });

    it('weakens weights on rejected proposals', () => {
      const state = createDefaultState({
        weights: { 'decided': 0.35 },
      });
      
      const signals: Signal[] = [
        { name: 'decided', type: 'linguistic', value: 1.0, baseWeight: 0.35 },
      ];

      const newState = engine.learn(state, signals, 'rejected');

      expect(newState.weights['decided']).toBeLessThan(0.35);
      expect(newState.alpha).toBe(1);  // unchanged
      expect(newState.beta).toBe(2);   // +1 rejection
    });

    it('raises threshold on rejection', () => {
      const state = createDefaultState({ threshold: 0.75 });
      
      const newState = engine.learn(state, [], 'rejected');

      expect(newState.threshold).toBe(0.77); // +0.02
    });

    it('lowers threshold slightly on confirmation with high threshold', () => {
      const state = createDefaultState({ threshold: 0.85 });
      
      const newState = engine.learn(state, [], 'confirmed');

      expect(newState.threshold).toBe(0.84); // -0.01
    });
  });

  describe('applyDecay', () => {
    it('does not decay recently updated states', () => {
      const state = createDefaultState({
        weights: { 'decided': 0.8 },
      });

      const decayed = engine.applyDecay(state, 0.5); // Half a day

      expect(decayed.weights['decided']).toBe(0.8);
    });

    it('decays weights toward baseline over time', () => {
      const state = createDefaultState({
        weights: { 'decided': 0.9 },
      });

      const decayed = engine.applyDecay(state, 30); // 30 days

      expect(decayed.weights['decided']).toBeLessThan(0.9);
      expect(decayed.weights['decided']).toBeGreaterThan(0.5); // BASE_WEIGHT
    });
  });

  describe('meta-learning', () => {
    it('learns faster when uncertain', () => {
      const uncertainState = createDefaultState({ alpha: 1, beta: 1 });
      const signals: Signal[] = [
        { name: 'test', type: 'linguistic', value: 1.0, baseWeight: 0.5 },
      ];

      const result1 = engine.learn(uncertainState, signals, 'confirmed');
      const delta1 = result1.weights['test']! - 0.5;

      const confidentState = createDefaultState({ alpha: 30, beta: 10 });
      const result2 = engine.learn(confidentState, signals, 'confirmed');
      const delta2 = result2.weights['test']! - 0.5;

      // Uncertain state should have larger weight change
      expect(Math.abs(delta1)).toBeGreaterThan(Math.abs(delta2));
    });
  });

  describe('acceptance rate', () => {
    it('calculates correct acceptance rate', () => {
      const state = createDefaultState({ alpha: 7, beta: 3 }); // 70% acceptance
      
      const rate = engine.getAcceptanceRate(state);
      
      expect(rate).toBe(0.7);
    });

    it('calculates adaptive threshold', () => {
      const highAcceptState = createDefaultState({
        alpha: 8,
        beta: 2,
        threshold: 0.75,
      });

      const threshold = engine.getAdaptiveThreshold(highAcceptState);
      
      // High acceptance → lower threshold
      expect(threshold).toBeLessThan(0.75);
    });
  });
});
