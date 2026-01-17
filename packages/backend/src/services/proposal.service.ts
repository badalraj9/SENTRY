/**
 * Proposal Service
 * Handles decision proposals (pending confirmation)
 */

import { v4 as uuid } from 'uuid';
import { query } from '../db/pool.js';
import type { DecisionProposal, DecisionContext, ProposalStatus } from '@sentry/shared';
import { emitToChat, emitToUser } from '../websocket/handlers.js';

// =============================================================================
// PROPOSAL CRUD
// =============================================================================

export interface CreateProposalInput {
  chatId: string;
  intentId?: string | null;
  statement: string;
  rationale?: string | null;
  confidence: number;
  context: DecisionContext;
  proposedBy?: 'system' | 'user';
}

export async function createProposal(input: CreateProposalInput): Promise<DecisionProposal> {
  const id = uuid();

  const { rows } = await query<DecisionProposal>(
    `INSERT INTO decision_proposals (id, chat_id, intent_id, statement, rationale, confidence, context, proposed_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, chat_id as "chatId", intent_id as "intentId", statement, rationale,
               confidence, context, proposed_by as "proposedBy", created_at as "createdAt", status`,
    [
      id,
      input.chatId,
      input.intentId || null,
      input.statement,
      input.rationale || null,
      input.confidence,
      JSON.stringify(input.context),
      input.proposedBy || 'system',
    ]
  );

  const proposal = rows[0];

  // Notify chat participants
  await emitToChat(input.chatId, 'proposal.new', proposal);

  return proposal;
}

export async function getProposalById(id: string): Promise<DecisionProposal | null> {
  const { rows } = await query<DecisionProposal>(
    `SELECT id, chat_id as "chatId", intent_id as "intentId", statement, rationale,
            confidence, context, proposed_by as "proposedBy", created_at as "createdAt", status
     FROM decision_proposals WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function getPendingProposals(chatId: string): Promise<DecisionProposal[]> {
  const { rows } = await query<DecisionProposal>(
    `SELECT id, chat_id as "chatId", intent_id as "intentId", statement, rationale,
            confidence, context, proposed_by as "proposedBy", created_at as "createdAt", status
     FROM decision_proposals
     WHERE chat_id = $1 AND status = 'pending'
     ORDER BY created_at DESC`,
    [chatId]
  );
  return rows;
}

export async function getPendingProposalsForUser(userId: string): Promise<DecisionProposal[]> {
  const { rows } = await query<DecisionProposal>(
    `SELECT dp.id, dp.chat_id as "chatId", dp.intent_id as "intentId", dp.statement, dp.rationale,
            dp.confidence, dp.context, dp.proposed_by as "proposedBy", dp.created_at as "createdAt", dp.status
     FROM decision_proposals dp
     JOIN chat_participants cp ON dp.chat_id = cp.chat_id
     WHERE cp.user_id = $1 AND cp.left_at IS NULL AND dp.status = 'pending'
     ORDER BY dp.created_at DESC`,
    [userId]
  );
  return rows;
}

// =============================================================================
// PROPOSAL ACTIONS
// =============================================================================

export async function approveProposal(id: string): Promise<DecisionProposal | null> {
  const { rows } = await query<DecisionProposal>(
    `UPDATE decision_proposals SET status = 'approved'
     WHERE id = $1 AND status = 'pending'
     RETURNING id, chat_id as "chatId", intent_id as "intentId", statement, rationale,
               confidence, context, proposed_by as "proposedBy", created_at as "createdAt", status`,
    [id]
  );

  const proposal = rows[0];
  if (proposal) {
    await emitToChat(proposal.chatId, 'proposal.approved', proposal);
  }

  return proposal || null;
}

export async function rejectProposal(id: string): Promise<DecisionProposal | null> {
  const { rows } = await query<DecisionProposal>(
    `UPDATE decision_proposals SET status = 'rejected'
     WHERE id = $1 AND status = 'pending'
     RETURNING id, chat_id as "chatId", intent_id as "intentId", statement, rationale,
               confidence, context, proposed_by as "proposedBy", created_at as "createdAt", status`,
    [id]
  );

  const proposal = rows[0];
  if (proposal) {
    await emitToChat(proposal.chatId, 'proposal.rejected', proposal);
  }

  return proposal || null;
}

export async function updateProposalStatement(
  id: string,
  statement: string,
  rationale?: string
): Promise<DecisionProposal | null> {
  const { rows } = await query<DecisionProposal>(
    `UPDATE decision_proposals SET statement = $2, rationale = COALESCE($3, rationale)
     WHERE id = $1 AND status = 'pending'
     RETURNING id, chat_id as "chatId", intent_id as "intentId", statement, rationale,
               confidence, context, proposed_by as "proposedBy", created_at as "createdAt", status`,
    [id, statement, rationale || null]
  );

  return rows[0] || null;
}
