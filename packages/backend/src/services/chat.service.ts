/**
 * Chat Service
 * Handles chat CRUD and participants
 */

import { v4 as uuid } from 'uuid';
import { query, withTransaction } from '../db/pool.js';
import type { Chat, ChatType, ChatParticipant } from '@sentry/shared';

// =============================================================================
// CHAT CRUD
// =============================================================================

export interface CreateChatInput {
  type: ChatType;
  projectId?: string;
  name?: string;
  visibility?: 'private' | 'invite_only' | 'public';
  creatorId: string;
}

export async function createChat(input: CreateChatInput): Promise<Chat> {
  const id = uuid();

  return withTransaction(async (client) => {
    const { rows } = await client.query<Chat>(
      `INSERT INTO chats (id, type, project_id, name, visibility)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, type, project_id as "projectId", name, visibility,
                 created_at as "createdAt", archived`,
      [id, input.type, input.projectId || null, input.name || null, input.visibility || 'private']
    );

    // Add creator as participant
    await client.query(
      `INSERT INTO chat_participants (chat_id, user_id)
       VALUES ($1, $2)`,
      [id, input.creatorId]
    );

    return rows[0];
  });
}

export async function getChatById(id: string): Promise<Chat | null> {
  const { rows } = await query<Chat>(
    `SELECT id, type, project_id as "projectId", name, visibility,
            created_at as "createdAt", archived
     FROM chats WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function getChatsByUser(userId: string): Promise<Chat[]> {
  const { rows } = await query<Chat>(
    `SELECT c.id, c.type, c.project_id as "projectId", c.name, c.visibility,
            c.created_at as "createdAt", c.archived
     FROM chats c
     JOIN chat_participants cp ON c.id = cp.chat_id
     WHERE cp.user_id = $1 AND cp.left_at IS NULL AND c.archived = false
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function getChatsByProject(projectId: string): Promise<Chat[]> {
  const { rows } = await query<Chat>(
    `SELECT id, type, project_id as "projectId", name, visibility,
            created_at as "createdAt", archived
     FROM chats WHERE project_id = $1 AND archived = false
     ORDER BY created_at DESC`,
    [projectId]
  );
  return rows;
}

export async function archiveChat(id: string): Promise<void> {
  await query(`UPDATE chats SET archived = true WHERE id = $1`, [id]);
}

// =============================================================================
// PARTICIPANTS
// =============================================================================

export async function getChatParticipants(chatId: string): Promise<ChatParticipant[]> {
  const { rows } = await query<ChatParticipant>(
    `SELECT chat_id as "chatId", user_id as "userId", joined_at as "joinedAt", left_at as "leftAt"
     FROM chat_participants WHERE chat_id = $1 AND left_at IS NULL`,
    [chatId]
  );
  return rows;
}

export async function addChatParticipant(chatId: string, userId: string): Promise<ChatParticipant> {
  const { rows } = await query<ChatParticipant>(
    `INSERT INTO chat_participants (chat_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (chat_id, user_id) DO UPDATE SET left_at = NULL
     RETURNING chat_id as "chatId", user_id as "userId", joined_at as "joinedAt", left_at as "leftAt"`,
    [chatId, userId]
  );
  return rows[0];
}

export async function removeChatParticipant(chatId: string, userId: string): Promise<void> {
  await query(
    `UPDATE chat_participants SET left_at = NOW() WHERE chat_id = $1 AND user_id = $2`,
    [chatId, userId]
  );
}

export async function isParticipant(chatId: string, userId: string): Promise<boolean> {
  const { rows } = await query(
    `SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [chatId, userId]
  );
  return rows.length > 0;
}

export async function getParticipantCount(chatId: string): Promise<number> {
  const { rows } = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM chat_participants WHERE chat_id = $1 AND left_at IS NULL`,
    [chatId]
  );
  return parseInt(rows[0]?.count || '0', 10);
}

// =============================================================================
// DIRECT CHAT HELPERS
// =============================================================================

export async function findOrCreateDirectChat(
  userId1: string,
  userId2: string
): Promise<Chat> {
  // Find existing direct chat between these two users
  const { rows: existing } = await query<Chat>(
    `SELECT c.id, c.type, c.project_id as "projectId", c.name, c.visibility,
            c.created_at as "createdAt", c.archived
     FROM chats c
     JOIN chat_participants cp1 ON c.id = cp1.chat_id
     JOIN chat_participants cp2 ON c.id = cp2.chat_id
     WHERE c.type = 'direct'
       AND cp1.user_id = $1 AND cp1.left_at IS NULL
       AND cp2.user_id = $2 AND cp2.left_at IS NULL
       AND c.archived = false`,
    [userId1, userId2]
  );

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new direct chat
  return withTransaction(async (client) => {
    const id = uuid();
    const { rows } = await client.query<Chat>(
      `INSERT INTO chats (id, type, visibility)
       VALUES ($1, 'direct', 'private')
       RETURNING id, type, project_id as "projectId", name, visibility,
                 created_at as "createdAt", archived`,
      [id]
    );

    await client.query(
      `INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2), ($1, $3)`,
      [id, userId1, userId2]
    );

    return rows[0];
  });
}
