/**
 * Decision Service
 * Handles confirmed decision records
 */

import { v4 as uuid } from 'uuid';
import { query, withTransaction } from '../db/pool.js';
import type { DecisionRecord, DecisionContext } from '@sentry/shared';
import { emitToChat } from '../websocket/handlers.js';
import * as intentService from './intent.service.js';
import * as proposalService from './proposal.service.js';
import * as neuralStateService from './neural-state.service.js';
import { learningEngine } from '../intelligence/learning.js';
import { incrementProfileStat } from './user.service.js';

// =============================================================================
// DECISION CRUD
// =============================================================================

export interface CreateDecisionInput {
  projectId: string;
  chatId?: string;
  intentId?: string;
  statement: string;
  rationale?: string;
  alternativesConsidered?: string[];
  assumptions?: string[];
  openQuestions?: string[];
  confidence: number;
  context: DecisionContext;
  confirmedBy: string;
  participants?: string[];
}

export async function createDecision(input: CreateDecisionInput): Promise<DecisionRecord> {
  const id = uuid();

  const { rows } = await query<DecisionRecord>(
    `INSERT INTO decision_records (
      id, project_id, chat_id, intent_id, statement, rationale,
      alternatives_considered, assumptions, open_questions,
      confidence, context, confirmed_by, participants
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING id, project_id as "projectId", chat_id as "chatId", intent_id as "intentId",
               statement, rationale, alternatives_considered as "alternativesConsidered",
               assumptions, open_questions as "openQuestions", confidence, context,
               confirmed_by as "confirmedBy", participants, created_at as "createdAt",
               deprecated, deprecated_at as "deprecatedAt", superseded_by as "supersededBy"`,
    [
      id,
      input.projectId,
      input.chatId || null,
      input.intentId || null,
      input.statement,
      input.rationale || null,
      input.alternativesConsidered || [],
      input.assumptions || [],
      input.openQuestions || [],
      input.confidence,
      JSON.stringify(input.context),
      input.confirmedBy,
      input.participants || [input.confirmedBy],
    ]
  );

  const decision = rows[0];

  // Emit to chat if applicable
  if (input.chatId) {
    await emitToChat(input.chatId, 'decision.new', decision);
  }

  // Link to intent if applicable
  if (input.intentId) {
    await intentService.linkDecisionToIntent(input.intentId, id);
  }

  // Update profile stats
  await incrementProfileStat(input.confirmedBy, 'decisions_confirmed');

  return decision;
}

export async function getDecisionById(id: string): Promise<DecisionRecord | null> {
  const { rows } = await query<DecisionRecord>(
    `SELECT id, project_id as "projectId", chat_id as "chatId", intent_id as "intentId",
            statement, rationale, alternatives_considered as "alternativesConsidered",
            assumptions, open_questions as "openQuestions", confidence, context,
            confirmed_by as "confirmedBy", participants, created_at as "createdAt",
            deprecated, deprecated_at as "deprecatedAt", superseded_by as "supersededBy"
     FROM decision_records WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export interface GetDecisionsOptions {
  limit?: number;
  offset?: number;
  includeDeprecated?: boolean;
}

export async function getDecisionsByProject(
  projectId: string,
  options: GetDecisionsOptions = {}
): Promise<DecisionRecord[]> {
  const { limit = 50, offset = 0, includeDeprecated = false } = options;

  const whereClause = includeDeprecated
    ? 'project_id = $1'
    : 'project_id = $1 AND deprecated = false';

  const { rows } = await query<DecisionRecord>(
    `SELECT id, project_id as "projectId", chat_id as "chatId", intent_id as "intentId",
            statement, rationale, alternatives_considered as "alternativesConsidered",
            assumptions, open_questions as "openQuestions", confidence, context,
            confirmed_by as "confirmedBy", participants, created_at as "createdAt",
            deprecated, deprecated_at as "deprecatedAt", superseded_by as "supersededBy"
     FROM decision_records
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [projectId, limit, offset]
  );
  return rows;
}

// =============================================================================
// SEARCH
// =============================================================================

export async function searchDecisions(
  projectId: string,
  searchQuery: string,
  limit = 20
): Promise<DecisionRecord[]> {
  const { rows } = await query<DecisionRecord>(
    `SELECT id, project_id as "projectId", chat_id as "chatId", intent_id as "intentId",
            statement, rationale, alternatives_considered as "alternativesConsidered",
            assumptions, open_questions as "openQuestions", confidence, context,
            confirmed_by as "confirmedBy", participants, created_at as "createdAt",
            deprecated, deprecated_at as "deprecatedAt", superseded_by as "supersededBy",
            ts_rank(to_tsvector('english', statement || ' ' || COALESCE(rationale, '')), 
                    plainto_tsquery('english', $2)) as rank
     FROM decision_records
     WHERE project_id = $1 AND deprecated = false
       AND to_tsvector('english', statement || ' ' || COALESCE(rationale, '')) @@ plainto_tsquery('english', $2)
     ORDER BY rank DESC, created_at DESC
     LIMIT $3`,
    [projectId, searchQuery, limit]
  );
  return rows;
}

// =============================================================================
// DEPRECATION
// =============================================================================

export async function deprecateDecision(
  id: string,
  supersededById?: string
): Promise<DecisionRecord | null> {
  const { rows } = await query<DecisionRecord>(
    `UPDATE decision_records
     SET deprecated = true, deprecated_at = NOW(), superseded_by = $2
     WHERE id = $1
     RETURNING id, project_id as "projectId", chat_id as "chatId", intent_id as "intentId",
               statement, rationale, alternatives_considered as "alternativesConsidered",
               assumptions, open_questions as "openQuestions", confidence, context,
               confirmed_by as "confirmedBy", participants, created_at as "createdAt",
               deprecated, deprecated_at as "deprecatedAt", superseded_by as "supersededBy"`,
    [id, supersededById || null]
  );

  const decision = rows[0];
  if (decision?.chatId) {
    await emitToChat(decision.chatId, 'decision.deprecated', decision);
  }

  return decision || null;
}

// =============================================================================
// CONFIRM FROM PROPOSAL
// =============================================================================

export async function confirmProposal(
  proposalId: string,
  userId: string,
  projectId: string,
  edits?: { statement?: string; rationale?: string }
): Promise<DecisionRecord | null> {
  return withTransaction(async (client) => {
    // Get and approve proposal
    const proposal = await proposalService.getProposalById(proposalId);
    if (!proposal || proposal.status !== 'pending') {
      return null;
    }

    await proposalService.approveProposal(proposalId);

    // Create decision record
    const decision = await createDecision({
      projectId,
      chatId: proposal.chatId,
      intentId: proposal.intentId || undefined,
      statement: edits?.statement || proposal.statement,
      rationale: edits?.rationale || proposal.rationale || undefined,
      confidence: proposal.confidence,
      context: proposal.context,
      confirmedBy: userId,
      participants: proposal.context.participants,
    });

    // Train Neural Hub
    const state = await neuralStateService.getOrCreateNeuralState(userId, projectId);
    const signals = proposal.context.signals || [];
    const updatedState = learningEngine.learn(state, signals, 'confirmed');
    await neuralStateService.updateNeuralState(userId, projectId, updatedState);

    return decision;
  });
}

export async function rejectProposalWithLearning(
  proposalId: string,
  userId: string,
  projectId: string
): Promise<void> {
  const proposal = await proposalService.getProposalById(proposalId);
  if (!proposal || proposal.status !== 'pending') {
    return;
  }

  await proposalService.rejectProposal(proposalId);

  // Train Neural Hub
  const state = await neuralStateService.getOrCreateNeuralState(userId, projectId);
  const signals = proposal.context.signals || [];
  const updatedState = learningEngine.learn(state, signals, 'rejected');
  await neuralStateService.updateNeuralState(userId, projectId, updatedState);
}
