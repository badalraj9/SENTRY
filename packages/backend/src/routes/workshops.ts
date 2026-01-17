/**
 * Workshop Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody, validateParams, uuidSchema } from '../middleware/validation.js';
import * as workshopService from '../services/workshop.service.js';
import * as projectService from '../services/project.service.js';

export const workshopRouter = Router();

workshopRouter.use(authMiddleware);

// =============================================================================
// SCHEMAS
// =============================================================================

const createWorkshopSchema = z.object({
  projectId: uuidSchema,
  title: z.string().min(1).max(200),
  objective: z.string().min(1).max(1000),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  maxParticipants: z.number().int().min(2).max(100).optional(),
});

const addAgendaSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  durationMinutes: z.number().int().min(1).max(180).optional(),
  presenterId: uuidSchema.optional(),
});

// =============================================================================
// WORKSHOP CRUD
// =============================================================================

/**
 * GET /workshops?projectId=xxx
 * List workshops for a project
 */
workshopRouter.get('/', async (req, res) => {
  const projectId = req.query.projectId as string;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId required' });
  }

  const workshops = await workshopService.getWorkshopsByProject(projectId);
  res.json(workshops);
});

/**
 * POST /workshops
 * Create a new workshop
 */
workshopRouter.post('/', validateBody(createWorkshopSchema), async (req, res) => {
  const hasAccess = await projectService.hasCapability(
    req.body.projectId,
    req.user!.userId,
    'workshop.create'
  );
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const workshop = await workshopService.createWorkshop({
    ...req.body,
    createdBy: req.user!.userId,
  });

  res.status(201).json(workshop);
});

/**
 * GET /workshops/:id
 * Get workshop by ID
 */
workshopRouter.get('/:id', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const workshop = await workshopService.getWorkshopById(req.params.id);
  if (!workshop) {
    return res.status(404).json({ error: 'Workshop not found' });
  }
  res.json(workshop);
});

// =============================================================================
// WORKSHOP LIFECYCLE
// =============================================================================

/**
 * POST /workshops/:id/schedule
 * Schedule a workshop
 */
workshopRouter.post(
  '/:id/schedule',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(z.object({
    scheduledStart: z.string().datetime(),
    scheduledEnd: z.string().datetime(),
  })),
  async (req, res) => {
    const workshop = await workshopService.scheduleWorkshop(
      req.params.id,
      new Date(req.body.scheduledStart),
      new Date(req.body.scheduledEnd)
    );
    if (!workshop) {
      return res.status(400).json({ error: 'Cannot schedule workshop' });
    }
    res.json(workshop);
  }
);

/**
 * POST /workshops/:id/start
 * Start a workshop
 */
workshopRouter.post('/:id/start', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const workshop = await workshopService.startWorkshop(req.params.id);
  if (!workshop) {
    return res.status(400).json({ error: 'Cannot start workshop' });
  }
  res.json(workshop);
});

/**
 * POST /workshops/:id/pause
 * Pause a workshop
 */
workshopRouter.post('/:id/pause', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const workshop = await workshopService.pauseWorkshop(req.params.id);
  if (!workshop) {
    return res.status(400).json({ error: 'Cannot pause workshop' });
  }
  res.json(workshop);
});

/**
 * POST /workshops/:id/complete
 * Complete a workshop (generates summary)
 */
workshopRouter.post('/:id/complete', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const workshop = await workshopService.completeWorkshop(req.params.id);
  if (!workshop) {
    return res.status(400).json({ error: 'Cannot complete workshop' });
  }
  res.json(workshop);
});

/**
 * POST /workshops/:id/cancel
 * Cancel a workshop
 */
workshopRouter.post('/:id/cancel', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const workshop = await workshopService.cancelWorkshop(req.params.id);
  if (!workshop) {
    return res.status(400).json({ error: 'Cannot cancel workshop' });
  }
  res.json(workshop);
});

// =============================================================================
// PARTICIPANTS
// =============================================================================

/**
 * GET /workshops/:id/participants
 * Get workshop participants
 */
workshopRouter.get('/:id/participants', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const participants = await workshopService.getParticipants(req.params.id);
  res.json(participants);
});

/**
 * POST /workshops/:id/participants
 * Invite participant to workshop
 */
workshopRouter.post(
  '/:id/participants',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(z.object({
    userId: uuidSchema,
    role: z.enum(['facilitator', 'presenter', 'participant', 'observer']).optional(),
  })),
  async (req, res) => {
    const participant = await workshopService.addParticipant(
      req.params.id,
      req.body.userId,
      req.body.role
    );
    res.status(201).json(participant);
  }
);

/**
 * POST /workshops/:id/join
 * Join a workshop
 */
workshopRouter.post('/:id/join', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  await workshopService.joinWorkshop(req.params.id, req.user!.userId);
  res.json({ joined: true });
});

/**
 * POST /workshops/:id/leave
 * Leave a workshop
 */
workshopRouter.post('/:id/leave', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  await workshopService.leaveWorkshop(req.params.id, req.user!.userId);
  res.json({ left: true });
});

// =============================================================================
// AGENDA
// =============================================================================

/**
 * GET /workshops/:id/agenda
 * Get workshop agenda
 */
workshopRouter.get('/:id/agenda', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const agenda = await workshopService.getAgenda(req.params.id);
  res.json(agenda);
});

/**
 * POST /workshops/:id/agenda
 * Add agenda item
 */
workshopRouter.post(
  '/:id/agenda',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(addAgendaSchema),
  async (req, res) => {
    const item = await workshopService.addAgendaItem(
      req.params.id,
      req.body.title,
      req.body.description,
      req.body.durationMinutes,
      req.body.presenterId
    );
    res.status(201).json(item);
  }
);

/**
 * POST /workshops/:id/agenda/:itemId/start
 * Start agenda item
 */
workshopRouter.post(
  '/:id/agenda/:itemId/start',
  validateParams(z.object({ id: uuidSchema, itemId: uuidSchema })),
  async (req, res) => {
    const item = await workshopService.startAgendaItem(req.params.itemId);
    if (!item) {
      return res.status(400).json({ error: 'Cannot start agenda item' });
    }
    res.json(item);
  }
);

/**
 * POST /workshops/:id/agenda/:itemId/complete
 * Complete agenda item
 */
workshopRouter.post(
  '/:id/agenda/:itemId/complete',
  validateParams(z.object({ id: uuidSchema, itemId: uuidSchema })),
  validateBody(z.object({ linkedDecisions: z.array(uuidSchema).optional() })),
  async (req, res) => {
    const item = await workshopService.completeAgendaItem(
      req.params.itemId,
      req.body.linkedDecisions
    );
    if (!item) {
      return res.status(400).json({ error: 'Cannot complete agenda item' });
    }
    res.json(item);
  }
);

// =============================================================================
// SUMMARY
// =============================================================================

/**
 * GET /workshops/:id/summary
 * Get workshop summary
 */
workshopRouter.get('/:id/summary', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  let summary = await workshopService.getWorkshopSummary(req.params.id);
  
  if (!summary) {
    // Generate if not exists
    summary = await workshopService.generateWorkshopSummary(req.params.id);
  }
  
  if (!summary) {
    return res.status(404).json({ error: 'Summary not available' });
  }
  
  res.json(summary);
});
