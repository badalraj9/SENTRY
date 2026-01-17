/**
 * Document Service
 * Handles documents, sections, versions, and inline discussions
 */

import { v4 as uuid } from 'uuid';
import { query, withTransaction, PoolClient } from '../db/pool.js';

// =============================================================================
// TYPES
// =============================================================================

export type DocType = 'general' | 'adr' | 'rfc' | 'spec' | 'meeting_notes' | 'runbook' | 'guide';
export type DocStatus = 'draft' | 'in_review' | 'approved' | 'archived' | 'deprecated';
export type SectionType = 'text' | 'code' | 'decision_embed' | 'diagram' | 'table' | 'callout';
export type ThreadStatus = 'open' | 'resolved' | 'wontfix';

export interface Document {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  description: string | null;
  docType: DocType;
  status: DocStatus;
  version: number;
  createdBy: string;
  lastEditedBy: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  linkedDecisions: string[];
  linkedWorkshops: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentSection {
  id: string;
  documentId: string;
  parentId: string | null;
  title: string | null;
  content: string;
  sectionType: SectionType;
  orderIndex: number;
  depth: number;
  linkedDecisions: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  lastEditedBy: string | null;
}

export interface DocumentThread {
  id: string;
  sectionId: string;
  status: ThreadStatus;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  textAnchor: string | null;
  anchorStart: number | null;
  anchorEnd: number | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentComment {
  id: string;
  threadId: string;
  userId: string;
  content: string;
  createdAt: Date;
  editedAt: Date | null;
}

// =============================================================================
// DOCUMENT CRUD
// =============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

export interface CreateDocumentInput {
  projectId: string;
  title: string;
  description?: string;
  docType?: DocType;
  createdBy: string;
}

export async function createDocument(input: CreateDocumentInput): Promise<Document> {
  const id = uuid();
  const slug = slugify(input.title) + '-' + id.slice(0, 8);

  const { rows } = await query<Document>(
    `INSERT INTO documents (id, project_id, title, slug, description, doc_type, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, project_id as "projectId", title, slug, description, doc_type as "docType",
               status, version, created_by as "createdBy", last_edited_by as "lastEditedBy",
               approved_by as "approvedBy", approved_at as "approvedAt",
               linked_decisions as "linkedDecisions", linked_workshops as "linkedWorkshops",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [id, input.projectId, input.title, slug, input.description || null, input.docType || 'general', input.createdBy]
  );

  return rows[0];
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const { rows } = await query<Document>(
    `SELECT id, project_id as "projectId", title, slug, description, doc_type as "docType",
            status, version, created_by as "createdBy", last_edited_by as "lastEditedBy",
            approved_by as "approvedBy", approved_at as "approvedAt",
            linked_decisions as "linkedDecisions", linked_workshops as "linkedWorkshops",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM documents WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function getDocumentBySlug(projectId: string, slug: string): Promise<Document | null> {
  const { rows } = await query<Document>(
    `SELECT id, project_id as "projectId", title, slug, description, doc_type as "docType",
            status, version, created_by as "createdBy", last_edited_by as "lastEditedBy",
            approved_by as "approvedBy", approved_at as "approvedAt",
            linked_decisions as "linkedDecisions", linked_workshops as "linkedWorkshops",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM documents WHERE project_id = $1 AND slug = $2`,
    [projectId, slug]
  );
  return rows[0] || null;
}

export async function getDocumentsByProject(
  projectId: string,
  options: { status?: DocStatus; docType?: DocType; limit?: number; offset?: number } = {}
): Promise<Document[]> {
  const { status, docType, limit = 50, offset = 0 } = options;

  let whereClause = 'project_id = $1';
  const params: unknown[] = [projectId];
  let paramIndex = 2;

  if (status) {
    whereClause += ` AND status = $${paramIndex++}`;
    params.push(status);
  }
  if (docType) {
    whereClause += ` AND doc_type = $${paramIndex++}`;
    params.push(docType);
  }

  params.push(limit, offset);

  const { rows } = await query<Document>(
    `SELECT id, project_id as "projectId", title, slug, description, doc_type as "docType",
            status, version, created_by as "createdBy", last_edited_by as "lastEditedBy",
            approved_by as "approvedBy", approved_at as "approvedAt",
            linked_decisions as "linkedDecisions", linked_workshops as "linkedWorkshops",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM documents WHERE ${whereClause}
     ORDER BY updated_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );

  return rows;
}

export async function updateDocument(
  id: string,
  updates: Partial<Pick<Document, 'title' | 'description' | 'docType'>>,
  editedBy: string
): Promise<Document | null> {
  const setClauses: string[] = ['last_edited_by = $2', 'updated_at = NOW()'];
  const params: unknown[] = [id, editedBy];
  let paramIndex = 3;

  if (updates.title !== undefined) {
    setClauses.push(`title = $${paramIndex++}`);
    params.push(updates.title);
  }
  if (updates.description !== undefined) {
    setClauses.push(`description = $${paramIndex++}`);
    params.push(updates.description);
  }
  if (updates.docType !== undefined) {
    setClauses.push(`doc_type = $${paramIndex++}`);
    params.push(updates.docType);
  }

  const { rows } = await query<Document>(
    `UPDATE documents SET ${setClauses.join(', ')}
     WHERE id = $1
     RETURNING id, project_id as "projectId", title, slug, description, doc_type as "docType",
               status, version, created_by as "createdBy", last_edited_by as "lastEditedBy",
               approved_by as "approvedBy", approved_at as "approvedAt",
               linked_decisions as "linkedDecisions", linked_workshops as "linkedWorkshops",
               created_at as "createdAt", updated_at as "updatedAt"`,
    params
  );

  return rows[0] || null;
}

// =============================================================================
// DOCUMENT LIFECYCLE
// =============================================================================

export async function submitForReview(id: string, editedBy: string): Promise<Document | null> {
  const { rows } = await query<Document>(
    `UPDATE documents SET status = 'in_review', last_edited_by = $2, updated_at = NOW()
     WHERE id = $1 AND status = 'draft'
     RETURNING id, project_id as "projectId", title, slug, description, doc_type as "docType",
               status, version, created_by as "createdBy", last_edited_by as "lastEditedBy",
               approved_by as "approvedBy", approved_at as "approvedAt",
               linked_decisions as "linkedDecisions", linked_workshops as "linkedWorkshops",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [id, editedBy]
  );
  return rows[0] || null;
}

export async function approveDocument(id: string, approvedBy: string): Promise<Document | null> {
  // First, create a version snapshot
  await createVersionSnapshot(id, approvedBy);

  const { rows } = await query<Document>(
    `UPDATE documents
     SET status = 'approved', approved_by = $2, approved_at = NOW(), version = version + 1, updated_at = NOW()
     WHERE id = $1 AND status = 'in_review'
     RETURNING id, project_id as "projectId", title, slug, description, doc_type as "docType",
               status, version, created_by as "createdBy", last_edited_by as "lastEditedBy",
               approved_by as "approvedBy", approved_at as "approvedAt",
               linked_decisions as "linkedDecisions", linked_workshops as "linkedWorkshops",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [id, approvedBy]
  );
  return rows[0] || null;
}

export async function archiveDocument(id: string): Promise<Document | null> {
  const { rows } = await query<Document>(
    `UPDATE documents SET status = 'archived', updated_at = NOW()
     WHERE id = $1
     RETURNING id, project_id as "projectId", title, slug, description, doc_type as "docType",
               status, version, created_by as "createdBy", last_edited_by as "lastEditedBy",
               approved_by as "approvedBy", approved_at as "approvedAt",
               linked_decisions as "linkedDecisions", linked_workshops as "linkedWorkshops",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [id]
  );
  return rows[0] || null;
}

// =============================================================================
// SECTIONS
// =============================================================================

export async function addSection(
  documentId: string,
  content: string,
  options: {
    title?: string;
    sectionType?: SectionType;
    parentId?: string;
    orderIndex?: number;
    createdBy?: string;
  } = {}
): Promise<DocumentSection> {
  const id = uuid();

  // Get next order index if not specified
  let orderIndex = options.orderIndex;
  if (orderIndex === undefined) {
    const { rows } = await query<{ max: number }>(
      `SELECT COALESCE(MAX(order_index), -1) + 1 as max
       FROM document_sections WHERE document_id = $1 AND parent_id IS NOT DISTINCT FROM $2`,
      [documentId, options.parentId || null]
    );
    orderIndex = rows[0]?.max || 0;
  }

  // Calculate depth
  let depth = 0;
  if (options.parentId) {
    const { rows } = await query<{ depth: number }>(
      `SELECT depth FROM document_sections WHERE id = $1`,
      [options.parentId]
    );
    depth = (rows[0]?.depth || 0) + 1;
  }

  const { rows } = await query<DocumentSection>(
    `INSERT INTO document_sections (
      id, document_id, parent_id, title, content, section_type, order_index, depth, created_by
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, document_id as "documentId", parent_id as "parentId", title, content,
               section_type as "sectionType", order_index as "orderIndex", depth,
               linked_decisions as "linkedDecisions", created_at as "createdAt",
               updated_at as "updatedAt", created_by as "createdBy", last_edited_by as "lastEditedBy"`,
    [
      id,
      documentId,
      options.parentId || null,
      options.title || null,
      content,
      options.sectionType || 'text',
      orderIndex,
      depth,
      options.createdBy || null,
    ]
  );

  return rows[0];
}

export async function getSections(documentId: string): Promise<DocumentSection[]> {
  const { rows } = await query<DocumentSection>(
    `SELECT id, document_id as "documentId", parent_id as "parentId", title, content,
            section_type as "sectionType", order_index as "orderIndex", depth,
            linked_decisions as "linkedDecisions", created_at as "createdAt",
            updated_at as "updatedAt", created_by as "createdBy", last_edited_by as "lastEditedBy"
     FROM document_sections WHERE document_id = $1
     ORDER BY depth, order_index`,
    [documentId]
  );
  return rows;
}

export async function updateSection(
  id: string,
  content: string,
  editedBy: string
): Promise<DocumentSection | null> {
  const { rows } = await query<DocumentSection>(
    `UPDATE document_sections SET content = $2, last_edited_by = $3, updated_at = NOW()
     WHERE id = $1
     RETURNING id, document_id as "documentId", parent_id as "parentId", title, content,
               section_type as "sectionType", order_index as "orderIndex", depth,
               linked_decisions as "linkedDecisions", created_at as "createdAt",
               updated_at as "updatedAt", created_by as "createdBy", last_edited_by as "lastEditedBy"`,
    [id, content, editedBy]
  );
  return rows[0] || null;
}

export async function deleteSection(id: string): Promise<void> {
  // Deletes cascade to child sections
  await query(`DELETE FROM document_sections WHERE id = $1`, [id]);
}

export async function linkDecisionToSection(sectionId: string, decisionId: string): Promise<void> {
  await query(
    `UPDATE document_sections SET linked_decisions = array_append(linked_decisions, $2)
     WHERE id = $1`,
    [sectionId, decisionId]
  );
}

// =============================================================================
// VERSIONING
// =============================================================================

async function createVersionSnapshot(documentId: string, changedBy: string, changeSummary?: string): Promise<void> {
  const doc = await getDocumentById(documentId);
  if (!doc) return;

  const sections = await getSections(documentId);

  await query(
    `INSERT INTO document_versions (id, document_id, version, sections_snapshot, change_summary, changed_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [uuid(), documentId, doc.version, JSON.stringify(sections), changeSummary || null, changedBy]
  );
}

export async function getVersionHistory(documentId: string): Promise<{ version: number; changeSummary: string | null; changedBy: string; createdAt: Date }[]> {
  const { rows } = await query<{ version: number; changeSummary: string | null; changedBy: string; createdAt: Date }>(
    `SELECT version, change_summary as "changeSummary", changed_by as "changedBy", created_at as "createdAt"
     FROM document_versions WHERE document_id = $1
     ORDER BY version DESC`,
    [documentId]
  );
  return rows;
}

// =============================================================================
// INLINE DISCUSSIONS
// =============================================================================

export async function createThread(
  sectionId: string,
  createdBy: string,
  textAnchor?: string,
  anchorStart?: number,
  anchorEnd?: number
): Promise<DocumentThread> {
  const id = uuid();

  const { rows } = await query<DocumentThread>(
    `INSERT INTO document_threads (id, section_id, text_anchor, anchor_start, anchor_end, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, section_id as "sectionId", status, resolved_by as "resolvedBy",
               resolved_at as "resolvedAt", text_anchor as "textAnchor",
               anchor_start as "anchorStart", anchor_end as "anchorEnd",
               created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"`,
    [id, sectionId, textAnchor || null, anchorStart || null, anchorEnd || null, createdBy]
  );

  return rows[0];
}

export async function getThreadsBySection(sectionId: string): Promise<DocumentThread[]> {
  const { rows } = await query<DocumentThread>(
    `SELECT id, section_id as "sectionId", status, resolved_by as "resolvedBy",
            resolved_at as "resolvedAt", text_anchor as "textAnchor",
            anchor_start as "anchorStart", anchor_end as "anchorEnd",
            created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"
     FROM document_threads WHERE section_id = $1
     ORDER BY created_at`,
    [sectionId]
  );
  return rows;
}

export async function resolveThread(id: string, resolvedBy: string, status: 'resolved' | 'wontfix' = 'resolved'): Promise<DocumentThread | null> {
  const { rows } = await query<DocumentThread>(
    `UPDATE document_threads SET status = $2, resolved_by = $3, resolved_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status = 'open'
     RETURNING id, section_id as "sectionId", status, resolved_by as "resolvedBy",
               resolved_at as "resolvedAt", text_anchor as "textAnchor",
               anchor_start as "anchorStart", anchor_end as "anchorEnd",
               created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"`,
    [id, status, resolvedBy]
  );
  return rows[0] || null;
}

export async function addComment(threadId: string, userId: string, content: string): Promise<DocumentComment> {
  const id = uuid();

  const { rows } = await query<DocumentComment>(
    `INSERT INTO document_comments (id, thread_id, user_id, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id, thread_id as "threadId", user_id as "userId", content,
               created_at as "createdAt", edited_at as "editedAt"`,
    [id, threadId, userId, content]
  );

  // Update thread timestamp
  await query(`UPDATE document_threads SET updated_at = NOW() WHERE id = $1`, [threadId]);

  return rows[0];
}

export async function getComments(threadId: string): Promise<DocumentComment[]> {
  const { rows } = await query<DocumentComment>(
    `SELECT id, thread_id as "threadId", user_id as "userId", content,
            created_at as "createdAt", edited_at as "editedAt"
     FROM document_comments WHERE thread_id = $1
     ORDER BY created_at`,
    [threadId]
  );
  return rows;
}

// =============================================================================
// SEARCH
// =============================================================================

export async function searchDocuments(projectId: string, searchQuery: string, limit = 20): Promise<Document[]> {
  const { rows } = await query<Document>(
    `SELECT id, project_id as "projectId", title, slug, description, doc_type as "docType",
            status, version, created_by as "createdBy", last_edited_by as "lastEditedBy",
            approved_by as "approvedBy", approved_at as "approvedAt",
            linked_decisions as "linkedDecisions", linked_workshops as "linkedWorkshops",
            created_at as "createdAt", updated_at as "updatedAt",
            ts_rank(to_tsvector('english', title || ' ' || COALESCE(description, '')),
                    plainto_tsquery('english', $2)) as rank
     FROM documents
     WHERE project_id = $1 AND status != 'archived'
       AND to_tsvector('english', title || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', $2)
     ORDER BY rank DESC, updated_at DESC
     LIMIT $3`,
    [projectId, searchQuery, limit]
  );
  return rows;
}
