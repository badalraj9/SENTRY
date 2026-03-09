/**
 * SENTRY Semantic Engine - TF-IDF + Cosine Similarity
 * 
 * Zero-latency, offline semantic matching for decision detection.
 * Designed for speed: precomputed IDF, cached vectors, sparse math.
 * 
 * Performance characteristics:
 * - IDF lookup: O(1)
 * - Tokenize: O(n) where n = message length
 * - TF-IDF vectorize: O(m) where m = unique terms (sparse)
 * - Cosine similarity: O(k) where k = overlapping terms (typically << m)
 * - Typical message processing: < 1ms
 */

import { tokenize, stem } from '@sentry/shared';

// =============================================================================
// PRECOMPUTED IDF WEIGHTS
// =============================================================================

const TECH_VOCABULARY = [
  // Auth & Security
  'jwt', 'oauth', 'saml', 'session', 'token', 'auth', 'authentication', 'authorization',
  'password', 'credential', 'encryption', 'hash', 'bcrypt', 'rsa', 'aes', 'https', 'tls',
  'mfa', '2fa', 'otp', 'captcha', 'rate', 'limit', 'throttle', 'cors', 'csrf', 'xss',
  
  // Database
  'sql', 'nosql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
  'query', 'index', 'schema', 'migration', 'replication', 'sharding', 'partition', 'cache',
  'orm', 'prisma', 'sequelize', 'knex', 'pool', 'connection', 'transaction', 'acid',
  
  // API & Communication
  'api', 'rest', 'graphql', 'grpc', 'websocket', 'http', 'https', 'fetch', 'axios',
  'endpoint', 'route', 'controller', 'middleware', 'payload', 'request', 'response',
  'status', 'code', 'error', 'exception', 'timeout', 'retry', 'circuit', 'breaker',
  
  // Frontend
  'react', 'vue', 'angular', 'svelte', 'javascript', 'typescript', 'jsx', 'tsx',
  'component', 'state', 'props', 'hook', 'context', 'redux', 'store', 'virtual', 'dom',
  'css', 'sass', 'tailwind', 'bootstrap', 'responsive', 'mobile', 'desktop', 'browser',
  
  // Backend
  'node', 'express', 'fastify', 'nest', 'python', 'django', 'flask', 'fastapi', 'ruby',
  'rails', 'golang', 'rust', 'java', 'spring', 'kotlin', 'scala', 'php', 'laravel',
  'server', 'service', 'microservice', 'monolith', 'architecture', 'pattern', 'design',
  
  // DevOps & Infrastructure
  'docker', 'kubernetes', 'k8s', 'container', 'pod', 'deployment', 'helm', 'chart',
  'aws', 'gcp', 'azure', 'cloud', 'serverless', 'lambda', 'function', 'compute',
  'ci', 'cd', 'pipeline', 'jenkins', 'github', 'gitlab', 'action', 'deploy', 'release',
  'monitoring', 'logging', 'metrics', 'alert', 'prometheus', 'grafana', 'sentry', 'datadog',
  
  // Testing
  'test', 'testing', 'unit', 'integration', 'e2e', 'jest', 'mocha', 'cypress', 'playwright',
  'mock', 'stub', 'spy', 'coverage', 'assertion', 'expect', 'spec', 'suite',
  
  // Data & Processing
  'data', 'stream', 'batch', 'etl', 'pipeline', 'kafka', 'rabbitmq', 'queue', 'message',
  'event', 'pub', 'sub', 'consumer', 'producer', 'topic', 'partition', 'offset',
  
  // Project & Process
  'project', 'task', 'issue', 'bug', 'feature', 'story', 'sprint', 'backlog', 'kanban',
  'scrum', 'agile', 'review', 'pr', 'merge', 'commit', 'branch', 'release', 'version',
  
  // General Tech
  'algorithm', 'structure', 'performance', 'optimization', 'refactor', 'legacy', 'tech',
  'debt', 'migration', 'upgrade', 'update', 'patch', 'security', 'vulnerability', 'bug',
  'fix', 'implement', 'build', 'compile', 'bundle', 'minify', 'transpile', 'polyfill',
];

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'shall', 'can', 'need', 'dare', 'ought', 'used', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom',
  'their', 'its', 'his', 'her', 'our', 'your', 'my', 'me', 'him', 'them', 'us',
  'not', 'no', 'nor', 'yet', 'so', 'too', 'very', 'just', 'only', 'also', 'then',
  'than', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'under', 'again', 'further', 'once', 'here', 'there', 'when', 'where',
  'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'such', 'any', 'now', 'new', 'old', 'good', 'bad', 'big', 'small',
]);

const DEFAULT_IDF = 1.5;

const PRECOMPUTED_IDF: Map<string, number> = new Map();

function initIDF(): void {
  if (PRECOMPUTED_IDF.size > 0) return;
  
  for (const term of TECH_VOCABULARY) {
    PRECOMPUTED_IDF.set(term, 1.0);
  }
}

initIDF();

function getIDF(term: string): number {
  return PRECOMPUTED_IDF.get(term) ?? DEFAULT_IDF;
}

// =============================================================================
// TYPES
// =============================================================================

export interface SparseVector {
  terms: Map<string, number>;
  magnitude: number;
}

export interface MatchResult {
  similarity: number;
  matchedTerms: string[];
  intentCoverage: number;
  messageCoverage: number;
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

export function tokenizeAndStem(text: string): string[] {
  return tokenize(text).filter(t => !STOPWORDS.has(t)).map(stem);
}

export function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  
  if (tokens.length === 0) return tf;
  
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  
  const count = tokens.length;
  for (const [term, count_] of tf) {
    tf.set(term, count_ / count);
  }
  
  return tf;
}

export function computeTFIDF(tokens: string[]): SparseVector {
  const tf = computeTF(tokens);
  const terms = new Map<string, number>();
  let magnitude = 0;
  
  for (const [term, tfValue] of tf) {
    const idf = getIDF(term);
    const tfidf = tfValue * idf;
    terms.set(term, tfidf);
    magnitude += tfidf * tfidf;
  }
  
  return {
    terms,
    magnitude: Math.sqrt(magnitude),
  };
}

export function cosineSimilarity(vec1: SparseVector, vec2: SparseVector): number {
  if (vec1.terms.size === 0 || vec2.terms.size === 0) return 0;
  if (vec1.magnitude === 0 || vec2.magnitude === 0) return 0;
  
  let dotProduct = 0;
  const smaller = vec1.terms.size < vec2.terms.size ? vec1.terms : vec2.terms;
  const larger = vec1.terms.size < vec2.terms.size ? vec2.terms : vec1.terms;
  
  for (const [term, value] of smaller) {
    const largerValue = larger.get(term);
    if (largerValue !== undefined) {
      dotProduct += value * largerValue;
    }
  }
  
  return dotProduct / (vec1.magnitude * vec2.magnitude);
}

export function computeMatch(
  messageText: string,
  intentText: string
): MatchResult {
  const messageTokens = tokenizeAndStem(messageText);
  const intentTokens = tokenizeAndStem(intentText);
  
  const messageVec = computeTFIDF(messageTokens);
  const intentVec = computeTFIDF(intentTokens);
  
  const similarity = cosineSimilarity(messageVec, intentVec);
  
  const matchedTerms: string[] = [];
  for (const term of messageVec.terms.keys()) {
    if (intentVec.terms.has(term)) {
      matchedTerms.push(term);
    }
  }
  
  const intentCoverage = intentTokens.length > 0 
    ? matchedTerms.length / intentTokens.length 
    : 0;
  
  const messageCoverage = messageTokens.length > 0 
    ? matchedTerms.length / messageTokens.length 
    : 0;
  
  return {
    similarity,
    matchedTerms,
    intentCoverage,
    messageCoverage,
  };
}

// =============================================================================
// SEMANTIC ENGINE WITH CACHING
// =============================================================================

interface CachedIntent {
  statement: string;
  vector: SparseVector;
  createdAt: number;
}

const intentCache = new Map<string, CachedIntent>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCachedIntentVector(intentId: string, statement: string): SparseVector {
  const cached = intentCache.get(intentId);
  
  if (cached && cached.statement === statement) {
    const age = Date.now() - cached.createdAt;
    if (age < CACHE_TTL_MS) {
      return cached.vector;
    }
  }
  
  const tokens = tokenizeAndStem(statement);
  const vector = computeTFIDF(tokens);
  
  intentCache.set(intentId, {
    statement,
    vector,
    createdAt: Date.now(),
  });
  
  return vector;
}

function invalidateIntentCache(intentId?: string): void {
  if (intentId) {
    intentCache.delete(intentId);
  } else {
    intentCache.clear();
  }
}

export function compareWithIntent(
  messageText: string,
  intentId: string,
  intentStatement: string
): MatchResult {
  const messageVec = computeTFIDF(tokenizeAndStem(messageText));
  const intentVec = getCachedIntentVector(intentId, intentStatement);
  
  const similarity = cosineSimilarity(messageVec, intentVec);
  
  const matchedTerms: string[] = [];
  for (const term of messageVec.terms.keys()) {
    if (intentVec.terms.has(term)) {
      matchedTerms.push(term);
    }
  }
  
  const intentTokens = tokenizeAndStem(intentStatement);
  const messageTokens = tokenizeAndStem(messageText);
  
  const intentCoverage = intentTokens.length > 0 
    ? matchedTerms.length / intentTokens.length 
    : 0;
  
  const messageCoverage = messageTokens.length > 0 
    ? matchedTerms.length / messageTokens.length 
    : 0;
  
  return {
    similarity,
    matchedTerms,
    intentCoverage,
    messageCoverage,
  };
}

// =============================================================================
// DECISION DUPLICATE DETECTION
// =============================================================================

const decisionCache = new Map<string, SparseVector>();
const MAX_CACHED_DECISIONS = 100;

export function indexDecision(decisionId: string, statement: string): void {
  if (decisionCache.size >= MAX_CACHED_DECISIONS) {
    const firstKey = decisionCache.keys().next().value;
    if (firstKey) decisionCache.delete(firstKey);
  }
  
  decisionCache.set(decisionId, computeTFIDF(tokenizeAndStem(statement)));
}

export function findSimilarDecisions(
  statement: string,
  threshold = 0.6,
  excludeIds: string[] = []
): Array<{ decisionId: string; similarity: number }> {
  const statementVec = computeTFIDF(tokenizeAndStem(statement));
  const results: Array<{ decisionId: string; similarity: number }> = [];
  
  for (const [decisionId, vector] of decisionCache) {
    if (excludeIds.includes(decisionId)) continue;
    
    const similarity = cosineSimilarity(statementVec, vector);
    if (similarity >= threshold) {
      results.push({ decisionId, similarity });
    }
  }
  
  results.sort((a, b) => b.similarity - a.similarity);
  return results;
}

// =============================================================================
// KEYWORD EXTRACTION
// =============================================================================

export interface KeywordExtractionOptions {
  maxKeywords?: number;
  minTF?: number;
  boostRecent?: number;
}

export function extractKeywords(
  texts: string[],
  options: KeywordExtractionOptions = {}
): Array<{ term: string; score: number }> {
  const { maxKeywords = 10, minTF = 0.01 } = options;
  
  const globalTF = new Map<string, number>();
  const docCount = texts.length;
  
  for (const text of texts) {
    const tokens = tokenizeAndStem(text);
    const uniqueTokens = new Set(tokens);
    
    for (const token of uniqueTokens) {
      globalTF.set(token, (globalTF.get(token) ?? 0) + 1);
    }
  }
  
  const scores: Array<{ term: string; score: number }> = [];
  
  for (const [term, count] of globalTF) {
    const tf = count / docCount;
    if (tf < minTF) continue;
    
    const idf = getIDF(term);
    const score = tf * idf;
    
    scores.push({ term, score });
  }
  
  scores.sort((a, b) => b.score - a.score);
  
  return scores.slice(0, maxKeywords);
}

// =============================================================================
// EXPORTS
// =============================================================================

export const semanticEngine = {
  computeMatch,
  compareWithIntent,
  indexDecision,
  findSimilarDecisions,
  extractKeywords,
  tokenizeAndStem,
  invalidateIntentCache,
  
  stats: {
    getIDFCacheSize: () => PRECOMPUTED_IDF.size,
    getIntentCacheSize: () => intentCache.size,
    getDecisionCacheSize: () => decisionCache.size,
  },
};
