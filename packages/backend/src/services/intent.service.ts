/**
 * Intent Service
 * Handles intent checkpoints for chats
 */

import { v4 as uuid } from 'uuid';
import { query } from '../db/pool.js';
import type { ChatIntent, IntentStatus } from '@sentry/shared';
import { emitToChat } from '../websocket/handlers.js';

// =============================================================================
// INTENT CRUD
// =============================================================================

export interface CreateIntentInput {
  chatId: string;
  statement: string;
  createdBy: string;
}

export async function createIntent(input: CreateIntentInput): Promise<ChatIntent> {
  const id = uuid();

  // Check for existing active intent
  const existing = await getActiveIntent(input.chatId);
  if (existing) {
    throw new Error('Chat already has an active intent. Close it first.');
  }

  const { rows } = await query<ChatIntent>(
    `INSERT INTO chat_intents (id, chat_id, statement, status, created_by)
     VALUES ($1, $2, $3, 'active', $4)
     RETURNING id, chat_id as "chatId", statement, status, created_by as "createdBy",
               created_at as "createdAt", resolved_at as "resolvedAt", linked_decisions as "linkedDecisions"`,
    [id, input.chatId, input.statement, input.createdBy]
  );

  const intent = rows[0];

  await emitToChat(input.chatId, 'intent.set', intent);

  return intent;
}

export async function getIntentById(id: string): Promise<ChatIntent | null> {
  const { rows } = await query<ChatIntent>(
    `SELECT id, chat_id as "chatId", statement, status, created_by as "createdBy",
            created_at as "createdAt", resolved_at as "resolvedAt", linked_decisions as "linkedDecisions"
     FROM chat_intents WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function getActiveIntent(chatId: string): Promise<ChatIntent | null> {
  const { rows } = await query<ChatIntent>(
    `SELECT id, chat_id as "chatId", statement, status, created_by as "createdBy",
            created_at as "createdAt", resolved_at as "resolvedAt", linked_decisions as "linkedDecisions"
     FROM chat_intents WHERE chat_id = $1 AND status = 'active'`,
    [chatId]
  );
  return rows[0] || null;
}

export async function getIntentsByChat(chatId: string): Promise<ChatIntent[]> {
  const { rows } = await query<ChatIntent>(
    `SELECT id, chat_id as "chatId", statement, status, created_by as "createdBy",
            created_at as "createdAt", resolved_at as "resolvedAt", linked_decisions as "linkedDecisions"
     FROM chat_intents WHERE chat_id = $1
     ORDER BY created_at DESC`,
    [chatId]
  );
  return rows;
}

// =============================================================================
// INTENT LIFECYCLE
// =============================================================================

export async function resolveIntent(
  id: string,
  decisionIds: string[] = []
): Promise<ChatIntent | null> {
  const { rows } = await query<ChatIntent>(
    `UPDATE chat_intents
     SET status = 'resolved', resolved_at = NOW(), linked_decisions = $2
     WHERE id = $1 AND status = 'active'
     RETURNING id, chat_id as "chatId", statement, status, created_by as "createdBy",
               created_at as "createdAt", resolved_at as "resolvedAt", linked_decisions as "linkedDecisions"`,
    [id, decisionIds]
  );

  const intent = rows[0];
  if (intent) {
    await emitToChat(intent.chatId, 'intent.resolved', intent);
  }

  return intent || null;
}

export async function abandonIntent(id: string): Promise<ChatIntent | null> {
  const { rows } = await query<ChatIntent>(
    `UPDATE chat_intents
     SET status = 'abandoned', resolved_at = NOW()
     WHERE id = $1 AND status = 'active'
     RETURNING id, chat_id as "chatId", statement, status, created_by as "createdBy",
               created_at as "createdAt", resolved_at as "resolvedAt", linked_decisions as "linkedDecisions"`,
    [id]
  );

  const intent = rows[0];
  if (intent) {
    await emitToChat(intent.chatId, 'intent.abandoned', intent);
  }

  return intent || null;
}

export async function linkDecisionToIntent(
  intentId: string,
  decisionId: string
): Promise<void> {
  await query(
    `UPDATE chat_intents
     SET linked_decisions = array_append(linked_decisions, $2)
     WHERE id = $1`,
    [intentId, decisionId]
  );
}

// =============================================================================
// HELPERS
// =============================================================================

export async function updateIntentStatement(
  id: string,
  statement: string
): Promise<ChatIntent | null> {
  const { rows } = await query<ChatIntent>(
    `UPDATE chat_intents SET statement = $2
     WHERE id = $1 AND status = 'active'
     RETURNING id, chat_id as "chatId", statement, status, created_by as "createdBy",
               created_at as "createdAt", resolved_at as "resolvedAt", linked_decisions as "linkedDecisions"`,
    [id, statement]
  );

  const intent = rows[0];
  if (intent) {
    await emitToChat(intent.chatId, 'intent.set', intent);
  }

  return intent || null;
}
