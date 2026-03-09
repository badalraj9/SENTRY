/**
 * User Service
 * Handles user CRUD, profiles, and preferences
 */

import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";
import { query, withTransaction } from "../db/pool.js";
import type { User, UserProfile, AssistantPreferences } from "@sentry/shared";

// =============================================================================
// USER CRUD
// =============================================================================

export interface CreateUserInput {
  handle: string;
  email: string;
  password: string;
  displayName?: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const id = uuid();
  const passwordHash = await bcrypt.hash(input.password, 12);

  return withTransaction(async (client) => {
    // Create user
    const { rows } = await client.query<User>(
      `INSERT INTO users (id, handle, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, handle, display_name as "displayName", email, bio, visibility, created_at as "createdAt", last_active as "lastActive"`,
      [id, input.handle, input.email, passwordHash, input.displayName || null],
    );

    // Create profile
    await client.query(`INSERT INTO user_profiles (user_id) VALUES ($1)`, [id]);

    // Create assistant preferences
    await client.query(
      `INSERT INTO assistant_preferences (user_id) VALUES ($1)`,
      [id],
    );

    return rows[0];
  });
}

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await query<User>(
    `SELECT id, handle, display_name as "displayName", email, bio, visibility, 
            created_at as "createdAt", last_active as "lastActive"
     FROM users WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

export async function getUserByHandle(handle: string): Promise<User | null> {
  const { rows } = await query<User>(
    `SELECT id, handle, display_name as "displayName", email, bio, visibility,
            created_at as "createdAt", last_active as "lastActive"
     FROM users WHERE handle = $1`,
    [handle],
  );
  return rows[0] || null;
}

export async function searchUsers(searchQuery: string): Promise<User[]> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      searchQuery,
    );
  const { rows } = await query<User>(
    `SELECT id, handle, display_name as "displayName", email, bio, visibility,
            created_at as "createdAt", last_active as "lastActive"
     FROM users 
     WHERE handle ILIKE $1 OR display_name ILIKE $1 ${isUuid ? "OR id = $2" : ""}
     LIMIT 20`,
    isUuid ? [`%${searchQuery}%`, searchQuery] : [`%${searchQuery}%`],
  );
  return rows;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  console.log("DEBUG: getUserByEmail called with:", email);
  const { rows } = await query<User>(
    `SELECT id, handle, display_name as "displayName", email, bio, visibility,
            created_at as "createdAt", last_active as "lastActive"
     FROM users WHERE email = $1`,
    [email],
  );
  console.log("DEBUG: getUserByEmail result:", rows);
  return rows[0] || null;
}

export interface UpdateUserInput {
  displayName?: string;
  bio?: string;
  visibility?: "public" | "limited" | "private";
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<User | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.displayName !== undefined) {
    updates.push(`display_name = $${paramIndex++}`);
    values.push(input.displayName);
  }
  if (input.bio !== undefined) {
    updates.push(`bio = $${paramIndex++}`);
    values.push(input.bio);
  }
  if (input.visibility !== undefined) {
    updates.push(`visibility = $${paramIndex++}`);
    values.push(input.visibility);
  }

  if (updates.length === 0) {
    return getUserById(id);
  }

  values.push(id);
  const { rows } = await query<User>(
    `UPDATE users SET ${updates.join(", ")}
     WHERE id = $${paramIndex}
     RETURNING id, handle, display_name as "displayName", email, bio, visibility,
               created_at as "createdAt", last_active as "lastActive"`,
    values,
  );

  return rows[0] || null;
}

export async function updateLastActive(id: string): Promise<void> {
  await query("UPDATE users SET last_active = NOW() WHERE id = $1", [id]);
}

// =============================================================================
// AUTHENTICATION
// =============================================================================

export async function validateCredentials(
  identifier?: string,
  password?: string,
): Promise<User | null> {
  if (!identifier || !password) return null;
  
  // Check if identifier is email or handle
  const isEmail = identifier.includes('@');
  const queryStr = isEmail
    ? "SELECT id, handle, display_name as \"displayName\", email, bio, visibility, created_at as \"createdAt\", last_active as \"lastActive\", password_hash FROM users WHERE email = $1"
    : "SELECT id, handle, display_name as \"displayName\", email, bio, visibility, created_at as \"createdAt\", last_active as \"lastActive\", password_hash FROM users WHERE handle = $1";

  const { rows } = await query<User & { password_hash: string }>(queryStr, [identifier]);

  if (rows.length === 0) {
    return null;
  }

  const user = rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    return null;
  }

  // Don't return password hash
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

// =============================================================================
// PROFILE
// =============================================================================

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const { rows } = await query<UserProfile>(
    `SELECT user_id as "userId", workshops_participated as "workshopsParticipated",
            decisions_confirmed as "decisionsConfirmed", discussions_started as "discussionsStarted",
            trust_score as "trustScore", updated_at as "updatedAt"
     FROM user_profiles WHERE user_id = $1`,
    [userId],
  );
  return rows[0] || null;
}

export async function incrementProfileStat(
  userId: string,
  stat:
    | "workshops_participated"
    | "decisions_confirmed"
    | "discussions_started",
): Promise<void> {
  await query(
    `UPDATE user_profiles SET ${stat} = ${stat} + 1, updated_at = NOW()
     WHERE user_id = $1`,
    [userId],
  );
}

// =============================================================================
// ASSISTANT PREFERENCES
// =============================================================================

export async function getAssistantPreferences(
  userId: string,
): Promise<AssistantPreferences | null> {
  const { rows } = await query<AssistantPreferences>(
    `SELECT user_id as "userId", prefers_concise_summaries as "prefersConciseSummaries",
            capture_decisions_early as "captureDecisionsEarly",
            ignore_brainstorming_prompts as "ignoreBrainstormingPrompts",
            assistant_verbosity as "assistantVerbosity", updated_at as "updatedAt"
     FROM assistant_preferences WHERE user_id = $1`,
    [userId],
  );
  return rows[0] || null;
}

export interface UpdatePreferencesInput {
  prefersConciseSummaries?: boolean;
  captureDecisionsEarly?: boolean;
  ignoreBrainstormingPrompts?: boolean;
  assistantVerbosity?: "quiet" | "balanced" | "verbose";
}

export async function updateAssistantPreferences(
  userId: string,
  input: UpdatePreferencesInput,
): Promise<AssistantPreferences | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.prefersConciseSummaries !== undefined) {
    updates.push(`prefers_concise_summaries = $${paramIndex++}`);
    values.push(input.prefersConciseSummaries);
  }
  if (input.captureDecisionsEarly !== undefined) {
    updates.push(`capture_decisions_early = $${paramIndex++}`);
    values.push(input.captureDecisionsEarly);
  }
  if (input.ignoreBrainstormingPrompts !== undefined) {
    updates.push(`ignore_brainstorming_prompts = $${paramIndex++}`);
    values.push(input.ignoreBrainstormingPrompts);
  }
  if (input.assistantVerbosity !== undefined) {
    updates.push(`assistant_verbosity = $${paramIndex++}`);
    values.push(input.assistantVerbosity);
  }

  if (updates.length === 0) {
    return getAssistantPreferences(userId);
  }

  updates.push(`updated_at = NOW()`);
  values.push(userId);

  const { rows } = await query<AssistantPreferences>(
    `UPDATE assistant_preferences SET ${updates.join(", ")}
     WHERE user_id = $${paramIndex}
     RETURNING user_id as "userId", prefers_concise_summaries as "prefersConciseSummaries",
               capture_decisions_early as "captureDecisionsEarly",
               ignore_brainstorming_prompts as "ignoreBrainstormingPrompts",
               assistant_verbosity as "assistantVerbosity", updated_at as "updatedAt"`,
    values,
  );

  return rows[0] || null;
}
