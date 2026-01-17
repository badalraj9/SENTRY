/**
 * SENTRY Shared Constants
 */

// =============================================================================
// ROLE CAPABILITIES MAPPING
// =============================================================================

import type { ProjectCapability, ProjectRole } from './types.js';

export const ROLE_CAPABILITIES: Record<ProjectRole, ProjectCapability[]> = {
  maintainer: [
    'project.view', 'project.edit', 'project.delete', 'project.manage_members',
    'chat.view', 'chat.send', 'chat.edit', 'chat.delete',
    'decision.view', 'decision.create', 'decision.approve', 'decision.deprecate',
    'document.view', 'document.edit', 'document.approve', 'document.comment',
    'workshop.create', 'workshop.invite', 'workshop.close',
    'file.view', 'file.upload', 'file.delete',
  ],
  collaborator: [
    'project.view',
    'chat.view', 'chat.send', 'chat.edit',
    'decision.view', 'decision.create',
    'document.view', 'document.edit', 'document.comment',
    'workshop.create',
    'file.view', 'file.upload',
  ],
  observer: [
    'project.view',
    'chat.view',
    'decision.view',
    'document.view',
    'file.view',
  ],
};

// =============================================================================
// NEURAL HUB CONSTANTS
// =============================================================================

export const DEFAULT_THRESHOLD = 0.75;
export const MIN_THRESHOLD = 0.60;
export const MAX_THRESHOLD = 0.90;

export const DEFAULT_LEARNING_RATE = 0.05;
export const DECAY_RATE = 0.01;

export const MIN_WEIGHT = 0.01;
export const MAX_WEIGHT = 1.0;
export const BASE_WEIGHT = 0.5;

// =============================================================================
// LINGUISTIC PATTERNS
// =============================================================================

export interface PatternDefinition {
  name: string;
  pattern: RegExp;
  baseWeight: number;
}

export const DECISION_PATTERNS: PatternDefinition[] = [
  // High confidence markers
  { name: 'decided', pattern: /\b(decided|decision)\b/i, baseWeight: 0.35 },
  { name: 'lets_go_with', pattern: /\blet'?s\s+go\s+with\b/i, baseWeight: 0.32 },
  { name: 'will_use', pattern: /\bwe('ll|\s+will)\s+use\b/i, baseWeight: 0.30 },
  { name: 'final', pattern: /\bfinal(ly|ized)?\b/i, baseWeight: 0.28 },
  
  // Medium confidence markers
  { name: 'settled_on', pattern: /\bsettled\s+on\b/i, baseWeight: 0.25 },
  { name: 'going_with', pattern: /\bgoing\s+(with|forward)\b/i, baseWeight: 0.22 },
  { name: 'agreed', pattern: /\bagreed\b/i, baseWeight: 0.20 },
  
  // Weak markers (need structural support)
  { name: 'pick', pattern: /\bpick(ed|ing)?\b/i, baseWeight: 0.12 },
  { name: 'choose', pattern: /\bchoose|chose\b/i, baseWeight: 0.12 },
];

// Quick pattern for early exit optimization
export const QUICK_DECISION_PATTERN = /\b(decid|let'?s\s+go|we('ll|\s+will)\s+use|final|settled|agreed|going\s+with)\b/i;

// =============================================================================
// STRUCTURAL SIGNAL WEIGHTS
// =============================================================================

export const STRUCTURAL_WEIGHTS = {
  threadDepth: {
    multiplier: 0.03,
    max: 0.15,
  },
  maintainerAuthor: {
    bonus: 0.12,
  },
  acknowledgmentRatio: {
    multiplier: 0.05,
    max: 0.10,
  },
  debateBurst: {
    divisor: 3,
    max: 0.08,
  },
};

// =============================================================================
// CONTEXTUAL SIGNAL WEIGHTS
// =============================================================================

export const CHAT_TYPE_WEIGHTS: Record<string, number> = {
  workshop: 0.15,
  group_collab: 0.10,
  direct: 0.05,
  community: 0.03,
};

export const INTENT_ALIGNMENT_MAX = 0.20;

// =============================================================================
// VALIDATION
// =============================================================================

export const VALIDATION = {
  handle: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
  },
  displayName: {
    maxLength: 100,
  },
  projectName: {
    minLength: 1,
    maxLength: 200,
  },
  messageContent: {
    maxLength: 10000,
  },
  intentStatement: {
    maxLength: 500,
  },
  decisionStatement: {
    maxLength: 1000,
  },
};
