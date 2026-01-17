/**
 * Project Service
 * Handles project CRUD, members, and capabilities
 */

import { v4 as uuid } from 'uuid';
import { query, withTransaction } from '../db/pool.js';
import type { Project, ProjectMember, ProjectRole, ProjectCapability } from '@sentry/shared';
import { ROLE_CAPABILITIES } from '@sentry/shared';

// =============================================================================
// PROJECT CRUD
// =============================================================================

export interface CreateProjectInput {
  name: string;
  description?: string;
  ownerId: string;
  visibility?: 'public' | 'private' | 'invite_only';
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const id = uuid();

  return withTransaction(async (client) => {
    // Create project
    const { rows } = await client.query<Project>(
      `INSERT INTO projects (id, name, description, owner_id, visibility)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, owner_id as "ownerId", visibility,
                 created_at as "createdAt", updated_at as "updatedAt", archived`,
      [id, input.name, input.description || null, input.ownerId, input.visibility || 'private']
    );

    const project = rows[0];

    // Add owner as maintainer
    await client.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, 'maintainer')`,
      [id, input.ownerId]
    );

    // Grant all maintainer capabilities
    for (const cap of ROLE_CAPABILITIES.maintainer) {
      await client.query(
        `INSERT INTO project_capabilities (project_id, user_id, capability)
         VALUES ($1, $2, $3)`,
        [id, input.ownerId, cap]
      );
    }

    return project;
  });
}

export async function getProjectById(id: string): Promise<Project | null> {
  const { rows } = await query<Project>(
    `SELECT id, name, description, owner_id as "ownerId", visibility,
            created_at as "createdAt", updated_at as "updatedAt", archived
     FROM projects WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function getProjectsByUser(userId: string): Promise<Project[]> {
  const { rows } = await query<Project>(
    `SELECT p.id, p.name, p.description, p.owner_id as "ownerId", p.visibility,
            p.created_at as "createdAt", p.updated_at as "updatedAt", p.archived
     FROM projects p
     JOIN project_members pm ON p.id = pm.project_id
     WHERE pm.user_id = $1 AND p.archived = false
     ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC`,
    [userId]
  );
  return rows;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  visibility?: 'public' | 'private' | 'invite_only';
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project | null> {
  const updates: string[] = ['updated_at = NOW()'];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(input.description);
  }
  if (input.visibility !== undefined) {
    updates.push(`visibility = $${paramIndex++}`);
    values.push(input.visibility);
  }

  values.push(id);
  const { rows } = await query<Project>(
    `UPDATE projects SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, name, description, owner_id as "ownerId", visibility,
               created_at as "createdAt", updated_at as "updatedAt", archived`,
    values
  );

  return rows[0] || null;
}

export async function archiveProject(id: string): Promise<void> {
  await query(
    `UPDATE projects SET archived = true, updated_at = NOW() WHERE id = $1`,
    [id]
  );
}

// =============================================================================
// MEMBERS
// =============================================================================

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const { rows } = await query<ProjectMember>(
    `SELECT project_id as "projectId", user_id as "userId", role, joined_at as "joinedAt"
     FROM project_members WHERE project_id = $1`,
    [projectId]
  );
  return rows;
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: ProjectRole
): Promise<ProjectMember> {
  return withTransaction(async (client) => {
    // Add member
    const { rows } = await client.query<ProjectMember>(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3
       RETURNING project_id as "projectId", user_id as "userId", role, joined_at as "joinedAt"`,
      [projectId, userId, role]
    );

    // Clear existing capabilities
    await client.query(
      `DELETE FROM project_capabilities WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    // Grant role capabilities
    for (const cap of ROLE_CAPABILITIES[role]) {
      await client.query(
        `INSERT INTO project_capabilities (project_id, user_id, capability)
         VALUES ($1, $2, $3)`,
        [projectId, userId, cap]
      );
    }

    return rows[0];
  });
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      `DELETE FROM project_capabilities WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    await client.query(
      `DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );
  });
}

export async function getMemberRole(projectId: string, userId: string): Promise<ProjectRole | null> {
  const { rows } = await query<{ role: ProjectRole }>(
    `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId]
  );
  return rows[0]?.role || null;
}

// =============================================================================
// CAPABILITIES
// =============================================================================

export async function hasCapability(
  projectId: string,
  userId: string,
  capability: ProjectCapability
): Promise<boolean> {
  const { rows } = await query(
    `SELECT 1 FROM project_capabilities
     WHERE project_id = $1 AND user_id = $2 AND capability = $3`,
    [projectId, userId, capability]
  );
  return rows.length > 0;
}

export async function getUserCapabilities(
  projectId: string,
  userId: string
): Promise<ProjectCapability[]> {
  const { rows } = await query<{ capability: ProjectCapability }>(
    `SELECT capability FROM project_capabilities
     WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId]
  );
  return rows.map(r => r.capability);
}

export async function grantCapability(
  projectId: string,
  userId: string,
  capability: ProjectCapability
): Promise<void> {
  await query(
    `INSERT INTO project_capabilities (project_id, user_id, capability)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [projectId, userId, capability]
  );
}

export async function revokeCapability(
  projectId: string,
  userId: string,
  capability: ProjectCapability
): Promise<void> {
  await query(
    `DELETE FROM project_capabilities
     WHERE project_id = $1 AND user_id = $2 AND capability = $3`,
    [projectId, userId, capability]
  );
}
