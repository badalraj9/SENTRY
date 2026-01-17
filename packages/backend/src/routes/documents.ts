/**
 * Document Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody, validateParams, validateQuery, uuidSchema } from '../middleware/validation.js';
import * as documentService from '../services/document.service.js';
import * as projectService from '../services/project.service.js';

export const documentRouter = Router();

documentRouter.use(authMiddleware);

// =============================================================================
// SCHEMAS
// =============================================================================

const createDocSchema = z.object({
  projectId: uuidSchema,
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  docType: z.enum(['general', 'adr', 'rfc', 'spec', 'meeting_notes', 'runbook', 'guide']).optional(),
});

const updateDocSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  docType: z.enum(['general', 'adr', 'rfc', 'spec', 'meeting_notes', 'runbook', 'guide']).optional(),
});

const addSectionSchema = z.object({
  content: z.string().min(1).max(50000),
  title: z.string().max(200).optional(),
  sectionType: z.enum(['text', 'code', 'decision_embed', 'diagram', 'table', 'callout']).optional(),
  parentId: uuidSchema.optional(),
});

const createThreadSchema = z.object({
  textAnchor: z.string().max(500).optional(),
  anchorStart: z.number().int().optional(),
  anchorEnd: z.number().int().optional(),
});

// =============================================================================
// DOCUMENT CRUD
// =============================================================================

/**
 * GET /documents?projectId=xxx
 * List documents for a project
 */
documentRouter.get(
  '/',
  validateQuery(z.object({
    projectId: uuidSchema,
    status: z.enum(['draft', 'in_review', 'approved', 'archived', 'deprecated']).optional(),
    docType: z.enum(['general', 'adr', 'rfc', 'spec', 'meeting_notes', 'runbook', 'guide']).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })),
  async (req, res) => {
    const projectId = req.query.projectId as string;
    
    const hasAccess = await projectService.hasCapability(projectId, req.user!.userId, 'document.view');
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const documents = await documentService.getDocumentsByProject(projectId, {
      status: req.query.status as any,
      docType: req.query.docType as any,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
    });
    
    res.json(documents);
  }
);

/**
 * POST /documents
 * Create a new document
 */
documentRouter.post('/', validateBody(createDocSchema), async (req, res) => {
  const hasAccess = await projectService.hasCapability(
    req.body.projectId,
    req.user!.userId,
    'document.edit'
  );
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const document = await documentService.createDocument({
    ...req.body,
    createdBy: req.user!.userId,
  });

  res.status(201).json(document);
});

/**
 * GET /documents/search?projectId=xxx&q=xxx
 * Search documents
 */
documentRouter.get(
  '/search',
  validateQuery(z.object({
    projectId: uuidSchema,
    q: z.string().min(1),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })),
  async (req, res) => {
    const documents = await documentService.searchDocuments(
      req.query.projectId as string,
      req.query.q as string,
      req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
    );
    res.json(documents);
  }
);

/**
 * GET /documents/:id
 * Get document by ID
 */
documentRouter.get('/:id', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const document = await documentService.getDocumentById(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(document);
});

/**
 * PATCH /documents/:id
 * Update document
 */
documentRouter.patch(
  '/:id',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(updateDocSchema),
  async (req, res) => {
    const document = await documentService.updateDocument(
      req.params.id,
      req.body,
      req.user!.userId
    );
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  }
);

// =============================================================================
// DOCUMENT LIFECYCLE
// =============================================================================

/**
 * POST /documents/:id/submit-review
 * Submit document for review
 */
documentRouter.post('/:id/submit-review', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const document = await documentService.submitForReview(req.params.id, req.user!.userId);
  if (!document) {
    return res.status(400).json({ error: 'Cannot submit for review' });
  }
  res.json(document);
});

/**
 * POST /documents/:id/approve
 * Approve document
 */
documentRouter.post('/:id/approve', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const doc = await documentService.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const hasAccess = await projectService.hasCapability(
    doc.projectId,
    req.user!.userId,
    'document.approve'
  );
  if (!hasAccess) {
    return res.status(403).json({ error: 'No approval rights' });
  }

  const document = await documentService.approveDocument(req.params.id, req.user!.userId);
  if (!document) {
    return res.status(400).json({ error: 'Cannot approve document' });
  }
  res.json(document);
});

/**
 * POST /documents/:id/archive
 * Archive document
 */
documentRouter.post('/:id/archive', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const document = await documentService.archiveDocument(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(document);
});

// =============================================================================
// SECTIONS
// =============================================================================

/**
 * GET /documents/:id/sections
 * Get document sections
 */
documentRouter.get('/:id/sections', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const sections = await documentService.getSections(req.params.id);
  res.json(sections);
});

/**
 * POST /documents/:id/sections
 * Add section to document
 */
documentRouter.post(
  '/:id/sections',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(addSectionSchema),
  async (req, res) => {
    const section = await documentService.addSection(req.params.id, req.body.content, {
      title: req.body.title,
      sectionType: req.body.sectionType,
      parentId: req.body.parentId,
      createdBy: req.user!.userId,
    });
    res.status(201).json(section);
  }
);

/**
 * PATCH /documents/:id/sections/:sectionId
 * Update section
 */
documentRouter.patch(
  '/:id/sections/:sectionId',
  validateParams(z.object({ id: uuidSchema, sectionId: uuidSchema })),
  validateBody(z.object({ content: z.string().min(1).max(50000) })),
  async (req, res) => {
    const section = await documentService.updateSection(
      req.params.sectionId,
      req.body.content,
      req.user!.userId
    );
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    res.json(section);
  }
);

/**
 * DELETE /documents/:id/sections/:sectionId
 * Delete section
 */
documentRouter.delete(
  '/:id/sections/:sectionId',
  validateParams(z.object({ id: uuidSchema, sectionId: uuidSchema })),
  async (req, res) => {
    await documentService.deleteSection(req.params.sectionId);
    res.status(204).send();
  }
);

/**
 * POST /documents/:id/sections/:sectionId/link-decision
 * Link decision to section
 */
documentRouter.post(
  '/:id/sections/:sectionId/link-decision',
  validateParams(z.object({ id: uuidSchema, sectionId: uuidSchema })),
  validateBody(z.object({ decisionId: uuidSchema })),
  async (req, res) => {
    await documentService.linkDecisionToSection(req.params.sectionId, req.body.decisionId);
    res.json({ linked: true });
  }
);

// =============================================================================
// VERSIONING
// =============================================================================

/**
 * GET /documents/:id/versions
 * Get document version history
 */
documentRouter.get('/:id/versions', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const versions = await documentService.getVersionHistory(req.params.id);
  res.json(versions);
});

// =============================================================================
// INLINE DISCUSSIONS
// =============================================================================

/**
 * GET /documents/:id/sections/:sectionId/threads
 * Get threads for a section
 */
documentRouter.get(
  '/:id/sections/:sectionId/threads',
  validateParams(z.object({ id: uuidSchema, sectionId: uuidSchema })),
  async (req, res) => {
    const threads = await documentService.getThreadsBySection(req.params.sectionId);
    res.json(threads);
  }
);

/**
 * POST /documents/:id/sections/:sectionId/threads
 * Create thread on section
 */
documentRouter.post(
  '/:id/sections/:sectionId/threads',
  validateParams(z.object({ id: uuidSchema, sectionId: uuidSchema })),
  validateBody(createThreadSchema),
  async (req, res) => {
    const thread = await documentService.createThread(
      req.params.sectionId,
      req.user!.userId,
      req.body.textAnchor,
      req.body.anchorStart,
      req.body.anchorEnd
    );
    res.status(201).json(thread);
  }
);

/**
 * POST /documents/:id/threads/:threadId/resolve
 * Resolve thread
 */
documentRouter.post(
  '/:id/threads/:threadId/resolve',
  validateParams(z.object({ id: uuidSchema, threadId: uuidSchema })),
  validateBody(z.object({ status: z.enum(['resolved', 'wontfix']).optional() })),
  async (req, res) => {
    const thread = await documentService.resolveThread(
      req.params.threadId,
      req.user!.userId,
      req.body.status
    );
    if (!thread) {
      return res.status(400).json({ error: 'Cannot resolve thread' });
    }
    res.json(thread);
  }
);

/**
 * GET /documents/:id/threads/:threadId/comments
 * Get thread comments
 */
documentRouter.get(
  '/:id/threads/:threadId/comments',
  validateParams(z.object({ id: uuidSchema, threadId: uuidSchema })),
  async (req, res) => {
    const comments = await documentService.getComments(req.params.threadId);
    res.json(comments);
  }
);

/**
 * POST /documents/:id/threads/:threadId/comments
 * Add comment to thread
 */
documentRouter.post(
  '/:id/threads/:threadId/comments',
  validateParams(z.object({ id: uuidSchema, threadId: uuidSchema })),
  validateBody(z.object({ content: z.string().min(1).max(5000) })),
  async (req, res) => {
    const comment = await documentService.addComment(
      req.params.threadId,
      req.user!.userId,
      req.body.content
    );
    res.status(201).json(comment);
  }
);
