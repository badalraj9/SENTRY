/**
 * Session Service
 * Manages user sessions and API keys for multi-client auth
 */

import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { query } from '../db/pool.js';
import { redis, cacheSet, cacheGet, cacheDel } from '../db/redis.js';

// =============================================================================
// TYPES
// =============================================================================

export interface Session {
  id: string;
  userId: string;
  clientType: 'web' | 'cli' | 'mobile' | 'api';
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
}

// =============================================================================
// HELPERS
// =============================================================================

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateApiKey(): { key: string; prefix: string } {
  const key = `sntry_${crypto.randomBytes(32).toString('hex')}`;
  const prefix = key.slice(0, 12);
  return { key, prefix };
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

export interface CreateSessionInput {
  userId: string;
  clientType: 'web' | 'cli' | 'mobile' | 'api';
  userAgent?: string;
  ipAddress?: string;
  expiresInDays?: number;
}

export async function createSession(input: CreateSessionInput): Promise<{
  session: Session;
  refreshToken: string;
}> {
  const id = uuid();
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays || 30));

  const { rows } = await query<Session>(
    `INSERT INTO user_sessions (id, user_id, refresh_token_hash, client_type, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id as "userId", client_type as "clientType", user_agent as "userAgent",
               ip_address as "ipAddress", created_at as "createdAt", expires_at as "expiresAt",
               last_used_at as "lastUsedAt"`,
    [id, input.userId, refreshTokenHash, input.clientType, input.userAgent || null, input.ipAddress || null, expiresAt]
  );

  // Cache session for fast lookup
  await cacheSet(`session:${id}`, rows[0], 3600); // 1 hour cache

  return { session: rows[0], refreshToken };
}

export async function validateRefreshToken(refreshToken: string): Promise<Session | null> {
  const refreshTokenHash = hashToken(refreshToken);

  const { rows } = await query<Session>(
    `UPDATE user_sessions SET last_used_at = NOW()
     WHERE refresh_token_hash = $1 AND revoked = false AND expires_at > NOW()
     RETURNING id, user_id as "userId", client_type as "clientType", user_agent as "userAgent",
               ip_address as "ipAddress", created_at as "createdAt", expires_at as "expiresAt",
               last_used_at as "lastUsedAt"`,
    [refreshTokenHash]
  );

  return rows[0] || null;
}

export async function getSessionById(id: string): Promise<Session | null> {
  // Check cache first
  const cached = await cacheGet<Session>(`session:${id}`);
  if (cached) return cached;

  const { rows } = await query<Session>(
    `SELECT id, user_id as "userId", client_type as "clientType", user_agent as "userAgent",
            ip_address as "ipAddress", created_at as "createdAt", expires_at as "expiresAt",
            last_used_at as "lastUsedAt"
     FROM user_sessions WHERE id = $1 AND revoked = false AND expires_at > NOW()`,
    [id]
  );

  const session = rows[0] || null;
  if (session) {
    await cacheSet(`session:${id}`, session, 3600);
  }

  return session;
}

export async function getUserSessions(userId: string): Promise<Session[]> {
  const { rows } = await query<Session>(
    `SELECT id, user_id as "userId", client_type as "clientType", user_agent as "userAgent",
            ip_address as "ipAddress", created_at as "createdAt", expires_at as "expiresAt",
            last_used_at as "lastUsedAt"
     FROM user_sessions WHERE user_id = $1 AND revoked = false AND expires_at > NOW()
     ORDER BY last_used_at DESC`,
    [userId]
  );
  return rows;
}

export async function revokeSession(id: string): Promise<void> {
  await query(
    `UPDATE user_sessions SET revoked = true, revoked_at = NOW() WHERE id = $1`,
    [id]
  );
  await cacheDel(`session:${id}`);
}

export async function revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
  if (exceptSessionId) {
    await query(
      `UPDATE user_sessions SET revoked = true, revoked_at = NOW()
       WHERE user_id = $1 AND id != $2 AND revoked = false`,
      [userId, exceptSessionId]
    );
  } else {
    await query(
      `UPDATE user_sessions SET revoked = true, revoked_at = NOW()
       WHERE user_id = $1 AND revoked = false`,
      [userId]
    );
  }

  // Clear all cached sessions for user (simplified - in production, track keys)
}

// =============================================================================
// API KEY MANAGEMENT
// =============================================================================

export interface CreateApiKeyInput {
  userId: string;
  name: string;
  scopes?: string[];
  expiresInDays?: number;
}

export async function createApiKey(input: CreateApiKeyInput): Promise<{
  apiKey: ApiKey;
  key: string;  // Only returned once at creation
}> {
  const id = uuid();
  const { key, prefix } = generateApiKey();
  const keyHash = hashToken(key);
  
  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const { rows } = await query<ApiKey>(
    `INSERT INTO api_keys (id, user_id, name, key_hash, prefix, scopes, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id as "userId", name, prefix, scopes, created_at as "createdAt",
               expires_at as "expiresAt", last_used_at as "lastUsedAt"`,
    [id, input.userId, input.name, keyHash, prefix, input.scopes || [], expiresAt]
  );

  return { apiKey: rows[0], key };
}

export async function validateApiKey(key: string): Promise<ApiKey | null> {
  const keyHash = hashToken(key);

  const { rows } = await query<ApiKey>(
    `UPDATE api_keys SET last_used_at = NOW()
     WHERE key_hash = $1 AND revoked = false AND (expires_at IS NULL OR expires_at > NOW())
     RETURNING id, user_id as "userId", name, prefix, scopes, created_at as "createdAt",
               expires_at as "expiresAt", last_used_at as "lastUsedAt"`,
    [keyHash]
  );

  return rows[0] || null;
}

export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
  const { rows } = await query<ApiKey>(
    `SELECT id, user_id as "userId", name, prefix, scopes, created_at as "createdAt",
            expires_at as "expiresAt", last_used_at as "lastUsedAt"
     FROM api_keys WHERE user_id = $1 AND revoked = false
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function revokeApiKey(id: string, userId: string): Promise<void> {
  await query(
    `UPDATE api_keys SET revoked = true, revoked_at = NOW()
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
}
