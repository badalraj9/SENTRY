/**
 * Neural State Service
 * Manages per-user-per-project neural states
 */

import { query } from '../db/pool.js';
import type { NeuralState } from '@sentry/shared';
import { 
  getNeuralStateCache, 
  setNeuralStateCache, 
  invalidateNeuralStateCache 
} from '../db/redis.js';
import { neuralHub } from '../intelligence/neural-hub.js';
import { daysBetween } from '@sentry/shared';
import { learningEngine } from '../intelligence/learning.js';

// =============================================================================
// CRUD
// =============================================================================

export async function getNeuralState(
  userId: string,
  projectId: string
): Promise<NeuralState | null> {
  // Check cache first
  const cached = await getNeuralStateCache(userId, projectId);
  if (cached) {
    return cached as NeuralState;
  }

  // Query database
  const { rows } = await query<NeuralState>(
    `SELECT user_id as "userId", project_id as "projectId", weights, threshold,
            alpha, beta, updated_at as "updatedAt"
     FROM neural_states WHERE user_id = $1 AND project_id = $2`,
    [userId, projectId]
  );

  const state = rows[0] || null;
  
  // Cache if found
  if (state) {
    await setNeuralStateCache(userId, projectId, state);
  }

  return state;
}

export async function getOrCreateNeuralState(
  userId: string,
  projectId: string
): Promise<NeuralState> {
  let state = await getNeuralState(userId, projectId);

  if (!state) {
    // Create default state
    state = neuralHub.getDefaultState(userId, projectId);
    
    await query(
      `INSERT INTO neural_states (user_id, project_id, weights, threshold, alpha, beta)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, project_id) DO NOTHING`,
      [userId, projectId, JSON.stringify(state.weights), state.threshold, state.alpha, state.beta]
    );

    // Re-fetch to get database defaults
    state = await getNeuralState(userId, projectId) || state;
  }

  // Apply temporal decay if needed
  const daysSinceUpdate = daysBetween(new Date(state.updatedAt), new Date());
  if (daysSinceUpdate > 1) {
    state = learningEngine.applyDecay(state, daysSinceUpdate);
    await updateNeuralState(userId, projectId, state);
  }

  return state;
}

export async function updateNeuralState(
  userId: string,
  projectId: string,
  state: NeuralState
): Promise<void> {
  await query(
    `UPDATE neural_states
     SET weights = $3, threshold = $4, alpha = $5, beta = $6, updated_at = NOW()
     WHERE user_id = $1 AND project_id = $2`,
    [userId, projectId, JSON.stringify(state.weights), state.threshold, state.alpha, state.beta]
  );

  // Invalidate cache
  await invalidateNeuralStateCache(userId, projectId);

  // Update cache with new state
  await setNeuralStateCache(userId, projectId, { ...state, updatedAt: new Date() });
}

// =============================================================================
// LEARNING EVENTS
// =============================================================================

export async function logLearningEvent(
  userId: string,
  projectId: string,
  proposalId: string | null,
  outcome: 'confirmed' | 'rejected',
  signals: unknown[],
  weightDeltas: Record<string, number>,
  thresholdBefore: number,
  thresholdAfter: number
): Promise<void> {
  await query(
    `INSERT INTO learning_events 
     (user_id, project_id, proposal_id, outcome, contributing_signals, weight_deltas, threshold_before, threshold_after)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      userId,
      projectId,
      proposalId,
      outcome,
      JSON.stringify(signals),
      JSON.stringify(weightDeltas),
      thresholdBefore,
      thresholdAfter,
    ]
  );
}

// =============================================================================
// ANALYTICS
// =============================================================================

export async function getUserAcceptanceRate(userId: string): Promise<number> {
  const { rows } = await query<{ alpha: number; beta: number }>(
    `SELECT SUM(alpha) as alpha, SUM(beta) as beta
     FROM neural_states WHERE user_id = $1`,
    [userId]
  );

  if (!rows[0] || (rows[0].alpha + rows[0].beta) === 0) {
    return 0.5; // Default
  }

  return rows[0].alpha / (rows[0].alpha + rows[0].beta);
}

export async function getProjectDetectionStats(projectId: string): Promise<{
  totalProposals: number;
  confirmedCount: number;
  rejectedCount: number;
  confirmationRate: number;
}> {
  const { rows } = await query<{ confirmed: string; rejected: string }>(
    `SELECT 
       SUM(CASE WHEN outcome = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
       SUM(CASE WHEN outcome = 'rejected' THEN 1 ELSE 0 END) as rejected
     FROM learning_events WHERE project_id = $1`,
    [projectId]
  );

  const confirmed = parseInt(rows[0]?.confirmed || '0', 10);
  const rejected = parseInt(rows[0]?.rejected || '0', 10);
  const total = confirmed + rejected;

  return {
    totalProposals: total,
    confirmedCount: confirmed,
    rejectedCount: rejected,
    confirmationRate: total > 0 ? confirmed / total : 0,
  };
}
