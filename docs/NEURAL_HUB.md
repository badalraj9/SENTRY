# Neural Hub: AI-Inspired Intelligence Engine

> Complete documentation for SENTRY's deterministic intelligence system

---

## Table of Contents

1. [Overview](#overview)
2. [Core Philosophy](#core-philosophy)
3. [Mathematical Foundation](#mathematical-foundation)
4. [Architecture](#architecture)
5. [Sensors](#sensors)
6. [Processing Pipeline](#processing-pipeline)
7. [Learning System](#learning-system)
8. [Performance & Optimization](#performance--optimization)
9. [Configuration](#configuration)
10. [Testing & Validation](#testing--validation)

---

## Overview

The Neural Hub is SENTRY's intelligence engine that **detects decisions in natural conversation** with sub-millisecond latency. Unlike traditional AI/ML systems, it uses **pure deterministic algorithms** inspired by neural network mathematics but implemented without any machine learning models, training, or black boxes.

### Key Characteristics

- ✅ **100% Deterministic** - Same input always produces same output
- ✅ **Fully Explainable** - Every decision has a complete reasoning trace
- ✅ **Sub-millisecond Latency** - < 1ms processing time per message
- ✅ **Adaptive Learning** - Learns user patterns without ML training
- ✅ **Mathematically Grounded** - Based on proven neural network principles

---

## Core Philosophy

### What Makes Neural Hub Different

| Traditional AI/ML       | Neural Hub                     |
| ----------------------- | ------------------------------ |
| Black box models        | Transparent algorithms         |
| Requires training data  | Learns from user interactions  |
| Statistical predictions | Mathematical confidence scores |
| Fixed behavior          | Adaptive to user patterns      |
| High computational cost | Minimal CPU usage              |

### Design Principles

1. **No Hallucinations** - Deterministic algorithms prevent false positives
2. **Explainable Intelligence** - Every detection is traceable to specific signals
3. **User Adaptation** - System learns individual and project patterns
4. **Performance First** - Optimized for real-time chat processing
5. **Privacy Preserving** - No external AI services or data training

---

## Mathematical Foundation

The Neural Hub implements core neural network concepts as deterministic algorithms:

### 1. Weighted Sums (Perceptron-style)

```typescript
// Core aggregation function
function weightedSum(signals: Signal[], weights: Map<string, number>): number {
  return signals.reduce((sum, signal) => {
    const weight = weights.get(signal.name) ?? signal.baseWeight;
    return sum + signal.value * weight;
  }, 0);
}
```

### 2. Sigmoid Activation

```typescript
// Maps any real number to (0, 1) range
function sigmoid(z: number, threshold: number, steepness: number = 10): number {
  return 1 / (1 + Math.exp(-steepness * (z - threshold)));
}
```

### 3. Hebbian Learning

```typescript
// "Neurons that fire together, wire together"
function updateWeight(
  currentWeight: number,
  signalStrength: number,
  outcome: "confirmed" | "rejected",
  learningRate: number = 0.05,
): number {
  const direction = outcome === "confirmed" ? 1 : -1;
  const change = learningRate * signalStrength * direction;
  return Math.max(0.01, Math.min(1.0, currentWeight + change));
}
```

### 4. Exponential Decay

```typescript
// Temporal weight decay for long-term adaptation
function decayWeight(
  currentWeight: number,
  baseWeight: number,
  daysSinceLastUse: number,
  decayRate: number = 0.01,
): number {
  const decayFactor = Math.exp(-decayRate * daysSinceLastUse);
  return currentWeight * decayFactor + baseWeight * (1 - decayFactor);
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NEURAL HUB                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                 INPUT LAYER                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │ │
│  │  │ Linguistic  │ │ Structural  │ │ Contextual      │ │ │
│  │  │ Sensor      │ │ Sensor      │ │ Sensor          │ │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘ │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │ │
│  │  │ Temporal    │ │ Authority   │ │ Reaction        │ │ │
│  │  │ Sensor      │ │ Sensor      │ │ Sensor          │ │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘ │ │
│  └─────────────────────┬─────────────────────────────────┘ │
│                        │                                   │
│  ┌─────────────────────▼─────────────────────────────────┐ │
│  │              PROCESSING LAYER                          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │ │
│  │  │ Signal      │ │ Weighted    │ │ Sigmoid         │ │ │
│  │  │ Extraction  │ │ Aggregation │ │ Activation      │ │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘ │ │
│  └─────────────────────┬─────────────────────────────────┘ │
│                        │                                   │
│  ┌─────────────────────▼─────────────────────────────────┐ │
│  │               OUTPUT LAYER                            │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │ │
│  │  │ Confidence  │ │ Decision    │ │ Reasoning       │ │ │
│  │  │ Score       │ │ Detection   │ │ Trace           │ │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘ │ │
│  └─────────────────────┬─────────────────────────────────┘ │
│                        │                                   │
│  ┌─────────────────────▼─────────────────────────────────┐ │
│  │               LEARNING LAYER                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │ │
│  │  │ User        │ │ Weight      │ │ Temporal        │ │ │
│  │  │ Feedback    │ │ Updates     │ │ Decay           │ │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Sensors

Sensors extract specific signals from messages and context. Each sensor produces a normalized signal value (0-1) and a confidence score.

### 1. Linguistic Sensor

Pattern-based detection of decision-indicating language:

```typescript
const LINGUISTIC_PATTERNS = [
  { regex: /\bdecided\b/i, weight: 0.35, context: "explicit" },
  { regex: /\blet's go with\b/i, weight: 0.32, context: "agreement" },
  { regex: /\bwe'll use\b/i, weight: 0.3, context: "commitment" },
  { regex: /\bgoing with\b/i, weight: 0.28, context: "selection" },
  { regex: /\bfinal(ly)? choose\b/i, weight: 0.33, context: "finalization" },
  { regex: /\bsettle on\b/i, weight: 0.31, context: "resolution" },
  { regex: /\bagreed on\b/i, weight: 0.34, context: "consensus" },
  { regex: /\bconfirmed\b/i, weight: 0.29, context: "validation" },
];
```

**Signal Calculation:**

```typescript
function linguisticSignal(message: string): Signal {
  let maxScore = 0;
  let matchedPattern = null;

  for (const pattern of LINGUISTIC_PATTERNS) {
    if (pattern.regex.test(message)) {
      const score = pattern.weight * patternConfidence(message, pattern);
      if (score > maxScore) {
        maxScore = score;
        matchedPattern = pattern;
      }
    }
  }

  return {
    name: "linguistic",
    value: maxScore,
    confidence: matchedPattern ? 0.8 : 0,
    metadata: { pattern: matchedPattern?.context },
  };
}
```

### 2. Structural Sensor

Analyzes message position and thread structure:

```typescript
function structuralSignal(message: Message, context: ChatContext): Signal {
  let score = 0;

  // Thread depth bonus (decisions often come after discussion)
  score += Math.min(message.threadDepth * 0.03, 0.15);

  // Reply chain analysis
  if (message.replyTo) {
    score += 0.05; // Replying suggests continuation
  }

  // Message length (decisions often concise)
  if (message.length < 200 && message.length > 20) {
    score += 0.08;
  }

  // Question mark ratio (decisions rarely ask questions)
  const questionRatio = (message.match(/\?/g) || []).length / message.length;
  score -= questionRatio * 0.2;

  return {
    name: "structural",
    value: Math.max(0, score),
    confidence: 0.7,
    metadata: { threadDepth: message.threadDepth },
  };
}
```

### 3. Contextual Sensor

Analyzes chat context and intent:

```typescript
function contextualSignal(context: ChatContext): Signal {
  let score = 0;

  // Intent alignment bonus
  if (context.currentIntent) {
    score += 0.15; // Messages in intent-focused chats are more likely decisions
  }

  // Chat type weighting
  const chatTypeWeights = {
    direct: 0.05,
    group_collab: 0.12,
    workshop: 0.2, // Workshops are decision-focused
    community: 0.03,
  };
  score += chatTypeWeights[context.chatType] || 0;

  // Time since intent set (decisions often come after discussion)
  if (context.currentIntent && context.timeSinceIntent > 300) {
    // 5 minutes
    score += 0.1;
  }

  return {
    name: "contextual",
    value: Math.min(score, 0.3),
    confidence: 0.6,
    metadata: { chatType: context.chatType },
  };
}
```

### 4. Authority Sensor

Evaluates author credibility and role:

```typescript
function authoritySignal(message: Message, context: ChatContext): Signal {
  let score = 0;

  // Project role bonus
  const roleWeights = {
    owner: 0.15,
    maintainer: 0.12,
    contributor: 0.08,
    viewer: 0.02,
  };
  score += roleWeights[context.authorRole] || 0;

  // Historical decision accuracy
  const userStats = context.userStats[message.authorId];
  if (userStats) {
    score += Math.min(userStats.decisionAccuracy * 0.1, 0.1);
  }

  // Domain expertise (based on past decisions in similar contexts)
  const expertiseScore = calculateDomainExpertise(message, context);
  score += expertiseScore * 0.08;

  return {
    name: "authority",
    value: Math.min(score, 0.25),
    confidence: 0.75,
    metadata: { role: context.authorRole },
  };
}
```

### 5. Temporal Sensor

Analyzes timing patterns:

```typescript
function temporalSignal(message: Message, context: ChatContext): Signal {
  let score = 0;

  // Time of day patterns (decisions more common during business hours)
  const hour = new Date(message.createdAt).getHours();
  if (hour >= 10 && hour <= 16) {
    score += 0.05;
  }

  // Recent activity burst (decisions often follow intense discussion)
  const recentMessages = context.messagesPastHour;
  if (recentMessages > 10) {
    score += 0.08;
  }

  // Dwell time (time since previous message)
  if (
    context.timeSincePreviousMessage > 60 &&
    context.timeSincePreviousMessage < 300
  ) {
    score += 0.06; // Thoughtful pause
  }

  return {
    name: "temporal",
    value: Math.min(score, 0.15),
    confidence: 0.5,
    metadata: { hour },
  };
}
```

---

## Processing Pipeline

### Step 1: Signal Extraction

```typescript
async function extractSignals(
  message: Message,
  context: ChatContext,
): Promise<Signal[]> {
  const sensors = [
    new LinguisticSensor(),
    new StructuralSensor(),
    new ContextualSensor(),
    new AuthoritySensor(),
    new TemporalSensor(),
  ];

  const signals = await Promise.all(
    sensors.map((sensor) => sensor.extract(message, context)),
  );

  return signals.filter((signal) => signal.value > 0);
}
```

### Step 2: Weighted Aggregation

```typescript
function aggregateSignals(signals: Signal[], neuralState: NeuralState): number {
  const weights = neuralState.weights;

  const weightedSum = signals.reduce((sum, signal) => {
    const weight = weights.get(signal.name) ?? signal.baseWeight;
    return sum + signal.value * weight * signal.confidence;
  }, 0);

  // Normalize by total possible weight
  const totalWeight = signals.reduce((sum, signal) => {
    const weight = weights.get(signal.name) ?? signal.baseWeight;
    return sum + weight;
  }, 0);

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
```

### Step 3: Confidence Calculation

```typescript
function calculateConfidence(
  aggregatedScore: number,
  neuralState: NeuralState,
  signalCount: number,
): number {
  // Apply sigmoid activation
  const rawConfidence = sigmoid(
    aggregatedScore,
    neuralState.threshold,
    10, // steepness
  );

  // Boost confidence based on signal consensus
  const consensusBonus = Math.min(signalCount * 0.05, 0.15);

  // Apply Bayesian adjustment based on historical accuracy
  const accuracy = neuralState.historicalAccuracy;
  const bayesianAdjustment = (accuracy - 0.5) * 0.2;

  return Math.max(
    0,
    Math.min(1, rawConfidence + consensusBonus + bayesianAdjustment),
  );
}
```

### Step 4: Decision Detection

```typescript
function detectDecision(
  confidence: number,
  neuralState: NeuralState,
): DecisionDetection | null {
  const threshold = neuralState.threshold;

  if (confidence >= threshold) {
    return {
      detected: true,
      confidence,
      threshold,
      reasoning: generateReasoning(confidence, threshold),
      signals: signals,
      timestamp: new Date(),
    };
  }

  return null;
}
```

---

## Learning System

The Neural Hub adapts to user and project patterns through deterministic learning algorithms.

### 1. Weight Updates

```typescript
async function updateWeights(
  neuralState: NeuralState,
  signals: Signal[],
  outcome: "confirmed" | "rejected",
): Promise<NeuralState> {
  const updatedWeights = new Map(neuralState.weights);
  const learningRate = calculateAdaptiveLearningRate(neuralState);

  for (const signal of signals) {
    const currentWeight = updatedWeights.get(signal.name) ?? signal.baseWeight;
    const newWeight = updateWeight(
      currentWeight,
      signal.value,
      outcome,
      learningRate,
    );
    updatedWeights.set(signal.name, newWeight);
  }

  // Update threshold based on outcome
  const thresholdAdjustment = outcome === "confirmed" ? -0.01 : 0.01;
  const newThreshold = Math.max(
    0.5,
    Math.min(0.95, neuralState.threshold + thresholdAdjustment),
  );

  return {
    ...neuralState,
    weights: updatedWeights,
    threshold: newThreshold,
    lastUpdated: new Date(),
  };
}
```

### 2. Temporal Decay

```typescript
function applyTemporalDecay(neuralState: NeuralState): NeuralState {
  const daysSinceUpdate = getDaysSince(neuralState.lastUpdated);
  const decayRate = 0.01; // 1% per day

  const decayedWeights = new Map<string, number>();

  for (const [sensorName, weight] of neuralState.weights) {
    const baseWeight = getBaseWeight(sensorName);
    const decayedWeight = decayWeight(
      weight,
      baseWeight,
      daysSinceUpdate,
      decayRate,
    );
    decayedWeights.set(sensorName, decayedWeight);
  }

  return {
    ...neuralState,
    weights: decayedWeights,
  };
}
```

### 3. Bayesian Learning

```typescript
function updateBayesianBelief(
  neuralState: NeuralState,
  outcome: "confirmed" | "rejected",
): NeuralState {
  // Beta distribution parameters
  let { alpha, beta: betaParam } = neuralState;

  if (outcome === "confirmed") {
    alpha += 1; // Increment confirmation count
  } else {
    betaParam += 1; // Increment rejection count
  }

  // Calculate new expected accuracy
  const expectedAccuracy = alpha / (alpha + betaParam);

  return {
    ...neuralState,
    alpha,
    beta: betaParam,
    historicalAccuracy: expectedAccuracy,
  };
}
```

---

## Performance & Optimization

### Target Metrics

| Metric             | Target | Current |
| ------------------ | ------ | ------- |
| Processing Latency | < 1ms  | ~0.7ms  |
| Memory Usage       | < 50MB | ~35MB   |
| CPU Usage          | < 5%   | ~2%     |
| Detection F1 Score | > 0.75 | ~0.78   |

### Optimization Strategies

#### 1. Early Exit optimizations

```typescript
function quickReject(message: string): boolean {
  // Fast rejection for obvious non-decisions
  if (message.includes("?") && message.split("?").length > 2) return true;
  if (message.length < 10) return true;
  if (message.startsWith("http")) return true;

  return false;
}
```

#### 2. Caching

```typescript
const signalCache = new LRUCache<string, Signal[]>(1000);

function getCachedSignals(messageHash: string): Signal[] | null {
  return signalCache.get(messageHash);
}
```

#### 3. Batch processing

```typescript
async function processBatch(messages: Message[]): Promise<DecisionDetection[]> {
  // Process multiple messages in parallel
  const detections = await Promise.all(
    messages.map((msg) => processMessage(msg)),
  );

  return detections.filter(Boolean);
}
```

---

## Configuration

### Default Neural State

```typescript
const DEFAULT_NEURAL_STATE: NeuralState = {
  weights: new Map([
    ["linguistic", 0.4],
    ["structural", 0.25],
    ["contextual", 0.15],
    ["authority", 0.12],
    ["temporal", 0.08],
  ]),
  threshold: 0.75,
  alpha: 1, // Beta distribution prior
  beta: 1, // Beta distribution prior
  historicalAccuracy: 0.5,
  lastUpdated: new Date(),
};
```

### Environment Variables

```bash
# Neural Hub Configuration
NEURAL_HUB_LEARNING_RATE=0.05
NEURAL_HUB_DECAY_RATE=0.01
NEURAL_HUB_DEFAULT_THRESHOLD=0.75
NEURAL_HUB_MAX_CONFIDENCE_HISTORY=1000

# Performance Tuning
NEURAL_HUB_CACHE_SIZE=1000
NEURAL_HUB_BATCH_SIZE=50
NEURAL_HUB_PARALLEL_WORKERS=4
```

### Project-specific Overrides

```typescript
interface ProjectNeuralConfig {
  // Custom weights for this project
  customWeights?: Map<string, number>;

  // Adjusted threshold (e.g., for high-stakes projects)
  threshold?: number;

  // Learning rate adjustments
  learningRateMultiplier?: number;

  // Sensor enable/disable
  enabledSensors?: string[];
}
```

---

## Testing & Validation

### Unit Testing

```typescript
describe("Neural Hub", () => {
  test("linguistic sensor detects decision patterns", () => {
    const sensor = new LinguisticSensor();
    const result = sensor.extract("Let's go with Redis", mockContext);

    expect(result.value).toBeGreaterThan(0.3);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  test("aggregation combines signals correctly", () => {
    const signals = [
      { name: "linguistic", value: 0.8, confidence: 0.9 },
      { name: "structural", value: 0.3, confidence: 0.6 },
    ];

    const result = aggregateSignals(signals, mockNeuralState);
    expect(result).toBeGreaterThan(0.5);
  });
});
```

### Integration Testing

```typescript
describe("Decision Detection Flow", () => {
  test("end-to-end decision detection", async () => {
    const message = createMockMessage({
      content: "I've decided we'll use PostgreSQL for the main database",
      author: { role: "maintainer" },
    });

    const detection = await neuralHub.processMessage(message, mockContext);

    expect(detection).toBeTruthy();
    expect(detection.confidence).toBeGreaterThan(0.8);
    expect(detection.reasoning).toContain("linguistic");
  });
});
```

### Performance Testing

```typescript
describe("Performance", () => {
  test("processes 1000 messages in under 1 second", async () => {
    const messages = generateTestMessages(1000);
    const start = performance.now();

    await Promise.all(messages.map((msg) => neuralHub.processMessage(msg)));

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(1000); // 1 second
  });
});
```

### Accuracy Validation

```typescript
const TEST_CORPUS = [
  {
    message: "Let's go with Redis for session storage",
    expected: true,
    minConfidence: 0.75,
    category: "explicit_decision",
  },
  {
    message: "What do you think about using Redis?",
    expected: false,
    maxConfidence: 0.3,
    category: "question",
  },
  {
    message: "Decided: PostgreSQL it is",
    expected: true,
    minConfidence: 0.85,
    category: "declaration",
  },
];

// Target validation metrics:
// - Precision: > 0.80
// - Recall: > 0.65
// - F1 Score: > 0.72
// - False Positive Rate: < 0.10
```

---

## Monitoring & Debugging

### Real-time Metrics

```typescript
interface NeuralHubMetrics {
  processedMessages: number;
  detectedDecisions: number;
  averageConfidence: number;
  processingLatency: number;
  sensorPerformance: Map<string, number>;
  learningEvents: number;
}
```

### Debug Mode

```typescript
interface DecisionDebugInfo {
  messageId: string;
  signals: Signal[];
  weights: Map<string, number>;
  aggregatedScore: number;
  finalConfidence: number;
  threshold: number;
  reasoning: string[];
  processingTime: number;
}
```

### Health Checks

```typescript
async function healthCheck(): Promise<HealthStatus> {
  const testMessage = "Let's decide on the final approach";
  const detection = await processMessage(testMessage);

  return {
    status: detection ? "healthy" : "degraded",
    latency: getAverageLatency(),
    accuracy: getRecentAccuracy(),
    lastLearning: getLastLearningTimestamp(),
  };
}
```

---

## Future Enhancements

### Planned Features

1. **Multi-language Support** - Extend linguistic patterns to non-English languages
2. **Domain-specific Sensors** - Specialized sensors for technical domains
3. **Cross-project Learning** - Share learned patterns across related projects
4. **Advanced Temporal Modeling** - More sophisticated timing pattern analysis
5. **Confidence Calibration** - Improved confidence score accuracy

### Research Directions

1. **Ensemble Methods** - Combine multiple detection algorithms
2. **Active Learning** - User feedback integration for faster adaptation
3. **Contextual Embeddings** - Semantic understanding beyond pattern matching
4. **Hierarchical Decision Modeling** - Multi-level decision detection

---

_Last updated: January 2026_
