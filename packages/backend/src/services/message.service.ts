/**
 * Message Service
 * Handles message CRUD and reactions with Neural Hub integration
 */

import { v4 as uuid } from 'uuid';
import { query } from '../db/pool.js';
import type { Message, MessageReaction, ChatType, ChatIntent } from '@sentry/shared';
import { neuralHub, type ProcessingContext } from '../intelligence/neural-hub.js';
import { emitToChat } from '../websocket/handlers.js';
import * as proposalService from './proposal.service.js';
import * as chatService from './chat.service.js';
import * as intentService from './intent.service.js';
import * as neuralStateService from './neural-state.service.js';
import * as projectService from './project.service.js';

// =============================================================================
// MESSAGE CRUD
// =============================================================================

export interface CreateMessageInput {
  chatId: string;
  userId: string;
  content: string;
  replyTo?: string;
}

export async function createMessage(input: CreateMessageInput): Promise<Message> {
  const id = uuid();

  const { rows } = await query<Message>(
    `INSERT INTO messages (id, chat_id, user_id, content, reply_to)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, chat_id as "chatId", user_id as "userId", content,
               reply_to as "replyTo", created_at as "createdAt",
               edited_at as "editedAt", deleted`,
    [id, input.chatId, input.userId, input.content, input.replyTo || null]
  );

  const message = rows[0];

  // Broadcast to chat
  await emitToChat(input.chatId, 'message.new', message);

  // Process through Neural Hub (async, non-blocking)
  processMessageWithNeuralHub(message).catch(err => {
    console.error('Neural Hub processing error:', err);
  });

  return message;
}

export async function getMessageById(id: string): Promise<Message | null> {
  const { rows } = await query<Message>(
    `SELECT id, chat_id as "chatId", user_id as "userId", content,
            reply_to as "replyTo", created_at as "createdAt",
            edited_at as "editedAt", deleted
     FROM messages WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export interface GetMessagesOptions {
  limit?: number;
  before?: Date;
  after?: Date;
}

export async function getMessagesByChat(
  chatId: string,
  options: GetMessagesOptions = {}
): Promise<Message[]> {
  const { limit = 50, before, after } = options;
  
  let whereClause = 'chat_id = $1 AND deleted = false';
  const params: unknown[] = [chatId];
  let paramIndex = 2;

  if (before) {
    whereClause += ` AND created_at < $${paramIndex++}`;
    params.push(before);
  }
  if (after) {
    whereClause += ` AND created_at > $${paramIndex++}`;
    params.push(after);
  }

  params.push(limit);

  const { rows } = await query<Message>(
    `SELECT id, chat_id as "chatId", user_id as "userId", content,
            reply_to as "replyTo", created_at as "createdAt",
            edited_at as "editedAt", deleted
     FROM messages
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex}`,
    params
  );
  
  return rows.reverse(); // Return in chronological order
}

export async function updateMessage(id: string, content: string): Promise<Message | null> {
  const { rows } = await query<Message>(
    `UPDATE messages SET content = $2, edited_at = NOW()
     WHERE id = $1 AND deleted = false
     RETURNING id, chat_id as "chatId", user_id as "userId", content,
               reply_to as "replyTo", created_at as "createdAt",
               edited_at as "editedAt", deleted`,
    [id, content]
  );

  const message = rows[0];
  if (message) {
    await emitToChat(message.chatId, 'message.edit', message);
  }
  return message || null;
}

export async function deleteMessage(id: string): Promise<void> {
  const { rows } = await query<{ chatId: string }>(
    `UPDATE messages SET deleted = true
     WHERE id = $1
     RETURNING chat_id as "chatId"`,
    [id]
  );

  if (rows[0]) {
    await emitToChat(rows[0].chatId, 'message.delete', { id });
  }
}

// =============================================================================
// REACTIONS
// =============================================================================

export async function addReaction(
  messageId: string,
  userId: string,
  reaction: string
): Promise<MessageReaction> {
  const { rows } = await query<MessageReaction>(
    `INSERT INTO message_reactions (message_id, user_id, reaction)
     VALUES ($1, $2, $3)
     ON CONFLICT (message_id, user_id, reaction) DO NOTHING
     RETURNING message_id as "messageId", user_id as "userId", reaction, created_at as "createdAt"`,
    [messageId, userId, reaction]
  );

  const msg = await getMessageById(messageId);
  if (msg) {
    await emitToChat(msg.chatId, 'message.reaction', {
      messageId,
      userId,
      reaction,
      action: 'add',
    });
  }

  return rows[0];
}

export async function removeReaction(
  messageId: string,
  userId: string,
  reaction: string
): Promise<void> {
  await query(
    `DELETE FROM message_reactions
     WHERE message_id = $1 AND user_id = $2 AND reaction = $3`,
    [messageId, userId, reaction]
  );

  const msg = await getMessageById(messageId);
  if (msg) {
    await emitToChat(msg.chatId, 'message.reaction', {
      messageId,
      userId,
      reaction,
      action: 'remove',
    });
  }
}

export async function getMessageReactions(messageId: string): Promise<MessageReaction[]> {
  const { rows } = await query<MessageReaction>(
    `SELECT message_id as "messageId", user_id as "userId", reaction, created_at as "createdAt"
     FROM message_reactions WHERE message_id = $1`,
    [messageId]
  );
  return rows;
}

// =============================================================================
// NEURAL HUB INTEGRATION
// =============================================================================

async function processMessageWithNeuralHub(message: Message): Promise<void> {
  // Get chat info
  const chat = await chatService.getChatById(message.chatId);
  if (!chat || !chat.projectId) return; // Only process project chats

  // Get context
  const ctx = await buildProcessingContext(message, chat);
  
  // Get neural state
  const state = await neuralStateService.getOrCreateNeuralState(message.userId, chat.projectId);

  // Process through Neural Hub
  const result = neuralHub.process(message, ctx, state);

  // If decision detected, create proposal
  if (result.shouldPropose) {
    await proposalService.createProposal({
      chatId: message.chatId,
      statement: extractDecisionStatement(message.content),
      rationale: null,
      confidence: result.confidence,
      context: {
        messageIds: [message.id],
        participants: [message.userId],
        signals: result.contributingSignals,
      },
      intentId: ctx.activeIntent?.id,
    });
  }
}

async function buildProcessingContext(
  message: Message,
  chat: { id: string; type: ChatType; projectId: string | null }
): Promise<ProcessingContext> {
  // Get thread depth
  let threadDepth = 0;
  if (message.replyTo) {
    threadDepth = await getThreadDepth(message.replyTo);
  }

  // Get participant count
  const participantCount = await chatService.getParticipantCount(chat.id);

  // Get active intent
  const activeIntent = await intentService.getActiveIntent(chat.id);

  // Check if author is maintainer
  let isAuthorMaintainer = false;
  if (chat.projectId) {
    const role = await projectService.getMemberRole(chat.projectId, message.userId);
    isAuthorMaintainer = role === 'maintainer';
  }

  // Get message rates (simplified)
  const recentMsgRate = await getRecentMessageRate(chat.id, 5); // Last 5 minutes
  const avgMsgRate = await getAverageMessageRate(chat.id);

  // Get reaction/reply counts for this message (0 for new messages)
  const reactionCount = 0;
  const replyCount = 0;

  return {
    chatType: chat.type as ChatType,
    isAuthorMaintainer,
    participantCount,
    threadDepth,
    reactionCount,
    replyCount,
    recentMsgRate,
    avgMsgRate,
    activeIntent,
  };
}

async function getThreadDepth(messageId: string, depth = 0): Promise<number> {
  const { rows } = await query<{ replyTo: string | null }>(
    `SELECT reply_to as "replyTo" FROM messages WHERE id = $1`,
    [messageId]
  );

  if (!rows[0]?.replyTo) {
    return depth;
  }

  return getThreadDepth(rows[0].replyTo, depth + 1);
}

async function getRecentMessageRate(chatId: string, minutes: number): Promise<number> {
  const { rows } = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM messages
     WHERE chat_id = $1 AND created_at > NOW() - INTERVAL '${minutes} minutes'`,
    [chatId]
  );
  return parseInt(rows[0]?.count || '0', 10) / minutes;
}

async function getAverageMessageRate(chatId: string): Promise<number> {
  const { rows } = await query<{ rate: string }>(
    `SELECT COUNT(*)::float / GREATEST(1, EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) / 60) as rate
     FROM messages WHERE chat_id = $1`,
    [chatId]
  );
  return parseFloat(rows[0]?.rate || '0');
}

function extractDecisionStatement(content: string): string {
  // Simple extraction - take the main sentence
  // In a real implementation, this would use more sophisticated NLP
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  return sentences[0]?.trim() || content.slice(0, 200);
}
