/**
 * SENTRY Shared Utilities
 */

// =============================================================================
// MATH UTILITIES
// =============================================================================

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Sigmoid activation function
 * σ(z) = 1 / (1 + e^(-k(z - θ)))
 */
export function sigmoid(z: number, threshold: number, steepness = 10): number {
  return 1 / (1 + Math.exp(-steepness * (z - threshold)));
}

/**
 * Exponential decay function
 * v(t) = v₀ × e^(-λt) + base × (1 - e^(-λt))
 */
export function exponentialDecay(
  currentValue: number,
  baseValue: number,
  daysSinceUpdate: number,
  decayRate = 0.01
): number {
  const factor = Math.exp(-decayRate * daysSinceUpdate);
  return currentValue * factor + baseValue * (1 - factor);
}

/**
 * Hebbian weight update
 * Δw = η × signal × direction
 */
export function hebbianUpdate(
  currentWeight: number,
  signalValue: number,
  outcome: 'confirmed' | 'rejected',
  learningRate = 0.05,
  minWeight = 0.01,
  maxWeight = 1.0
): number {
  const direction = outcome === 'confirmed' ? 1 : -1;
  const delta = learningRate * signalValue * direction;
  return clamp(currentWeight + delta, minWeight, maxWeight);
}

/**
 * Beta distribution mean (for confidence intervals)
 * E[X] = α / (α + β)
 */
export function betaMean(alpha: number, beta: number): number {
  return alpha / (alpha + beta);
}

/**
 * Beta distribution variance
 * Var[X] = αβ / ((α+β)²(α+β+1))
 */
export function betaVariance(alpha: number, beta: number): number {
  const sum = alpha + beta;
  return (alpha * beta) / (sum * sum * (sum + 1));
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Simple tokenizer for text analysis
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1);
}

/**
 * Simple stemmer (Porter-like, simplified)
 */
export function stem(word: string): string {
  let result = word.toLowerCase();
  
  // Remove common suffixes
  const suffixes = ['ing', 'ed', 'ly', 'tion', 'ness', 'ment', 'able', 'ible', 's'];
  for (const suffix of suffixes) {
    if (result.endsWith(suffix) && result.length > suffix.length + 2) {
      result = result.slice(0, -suffix.length);
      break;
    }
  }
  
  return result;
}

/**
 * Jaccard similarity between two sets of tokens
 */
export function jaccardSimilarity(tokens1: string[], tokens2: string[]): number {
  const set1 = new Set(tokens1.map(stem));
  const set2 = new Set(tokens2.map(stem));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

// =============================================================================
// DATE UTILITIES
// =============================================================================

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.abs(date2.getTime() - date1.getTime()) / msPerDay;
}

/**
 * Format relative time (e.g., "3 days ago")
 */
export function relativeTime(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  
  return date.toLocaleDateString();
}

// =============================================================================
// ID UTILITIES
// =============================================================================

/**
 * Generate a simple UUID v4
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
