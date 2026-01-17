/**
 * Decision Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody, validateParams, validateQuery, uuidSchema } from '../middleware/validation.js';
import * as decisionService from '../services/decision.service.js';
import * as proposalService from '../services/proposal.service.js';
import * as chatService from '../services/chat.service.js';
import * as projectService from '../services/project.service.js';

export const decisionRouter = Router();

decisionRouter.use(authMiddleware);

// =============================================================================
// SCHEMAS
// =============================================================================

const createDecisionSchema = z.object({
  projectId: uuidSchema,
  statement: z.string().min(1).max(1000),
  rationale: z.string().max(5000).optional(),
  alternativesConsidered: z.array(z.string()).optional(),
  assumptions: z.array(z.string()).optional(),
  openQuestions: z.array(z.string()).optional(),
});

const searchSchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

// =============================================================================
// DECISION ROUTES
// =============================================================================

/**
 * GET /decisions
 * List decisions for a project
 */
decisionRouter.get(
  '/',
  validateQuery(z.object({
    projectId: uuidSchema,
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
    includeDeprecated: z.coerce.boolean().optional(),
  })),
  async (req, res) => {
    const projectId = req.query.projectId as string;

    // Check access
    const hasAccess = await projectService.hasCapability(projectId, req.user!.userId, 'decision.view');
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const decisions = await decisionService.getDecisionsByProject(projectId, {
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      includeDeprecated: req.query.includeDeprecated === 'true',
    });

    res.json(decisions);
  }
);

/**
 * POST /decisions
 * Create a manual decision
 */
decisionRouter.post('/', validateBody(createDecisionSchema), async (req, res) => {
  // Check access
  const hasAccess = await projectService.hasCapability(
    req.body.projectId,
    req.user!.userId,
    'decision.create'
  );
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const decision = await decisionService.createDecision({
    ...req.body,
    confidence: 1.0, // Manual decisions have full confidence
    context: { messageIds: [], participants: [req.user!.userId] },
    confirmedBy: req.user!.userId,
  });

  res.status(201).json(decision);
});

/**
 * GET /decisions/search
 * Search decisions
 */
decisionRouter.get('/search', validateQuery(searchSchema), async (req, res) => {
  const projectId = req.query.projectId as string;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId required' });
  }

  const decisions = await decisionService.searchDecisions(
    projectId,
    req.query.q as string,
    req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
  );

  res.json(decisions);
});

/**
 * GET /decisions/:id
 * Get decision by ID
 */
decisionRouter.get('/:id', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const decision = await decisionService.getDecisionById(req.params.id);
  if (!decision) {
    return res.status(404).json({ error: 'Decision not found' });
  }
  res.json(decision);
});

/**
 * POST /decisions/:id/deprecate
 * Deprecate a decision
 */
decisionRouter.post(
  '/:id/deprecate',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(z.object({ supersededById: uuidSchema.optional() })),
  async (req, res) => {
    const decision = await decisionService.getDecisionById(req.params.id);
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    // Check access
    const hasAccess = await projectService.hasCapability(
      decision.projectId,
      req.user!.userId,
      'decision.deprecate'
    );
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const deprecated = await decisionService.deprecateDecision(
      req.params.id,
      req.body.supersededById
    );
    res.json(deprecated);
  }
);

// =============================================================================
// PROPOSAL ROUTES
// =============================================================================

/**
 * GET /proposals
 * Get pending proposals for user
 */
decisionRouter.get('/proposals', async (req, res) => {
  const proposals = await proposalService.getPendingProposalsForUser(req.user!.userId);
  res.json(proposals);
});

/**
 * POST /proposals/:id/approve
 * Approve a proposal and create decision
 */
decisionRouter.post(
  '/proposals/:id/approve',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(z.object({
    projectId: uuidSchema,
    statement: z.string().optional(),
    rationale: z.string().optional(),
  })),
  async (req, res) => {
    const decision = await decisionService.confirmProposal(
      req.params.id,
      req.user!.userId,
      req.body.projectId,
      { statement: req.body.statement, rationale: req.body.rationale }
    );

    if (!decision) {
      return res.status(404).json({ error: 'Proposal not found or already processed' });
    }

    res.json(decision);
  }
);

/**
 * POST /proposals/:id/reject
 * Reject a proposal
 */
decisionRouter.post(
  '/proposals/:id/reject',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(z.object({ projectId: uuidSchema })),
  async (req, res) => {
    await decisionService.rejectProposalWithLearning(
      req.params.id,
      req.user!.userId,
      req.body.projectId
    );
    res.status(204).send();
  }
);
