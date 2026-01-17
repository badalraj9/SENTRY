/**
 * Project Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody, validateParams, uuidSchema } from '../middleware/validation.js';
import * as projectService from '../services/project.service.js';

export const projectRouter = Router();

projectRouter.use(authMiddleware);

// =============================================================================
// SCHEMAS
// =============================================================================

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  visibility: z.enum(['public', 'private', 'invite_only']).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  visibility: z.enum(['public', 'private', 'invite_only']).optional(),
});

const addMemberSchema = z.object({
  userId: uuidSchema,
  role: z.enum(['maintainer', 'collaborator', 'observer']),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /projects
 * List user's projects
 */
projectRouter.get('/', async (req, res) => {
  const projects = await projectService.getProjectsByUser(req.user!.userId);
  res.json(projects);
});

/**
 * POST /projects
 * Create a new project
 */
projectRouter.post('/', validateBody(createProjectSchema), async (req, res) => {
  const project = await projectService.createProject({
    ...req.body,
    ownerId: req.user!.userId,
  });
  res.status(201).json(project);
});

/**
 * GET /projects/:id
 * Get project by ID
 */
projectRouter.get('/:id', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const project = await projectService.getProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Check access
  const hasAccess = await projectService.hasCapability(
    req.params.id,
    req.user!.userId,
    'project.view'
  );
  if (!hasAccess && project.visibility !== 'public') {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(project);
});

/**
 * PATCH /projects/:id
 * Update project
 */
projectRouter.patch(
  '/:id',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(updateProjectSchema),
  async (req, res) => {
    const hasAccess = await projectService.hasCapability(
      req.params.id,
      req.user!.userId,
      'project.edit'
    );
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const project = await projectService.updateProject(req.params.id, req.body);
    res.json(project);
  }
);

/**
 * DELETE /projects/:id
 * Archive project
 */
projectRouter.delete('/:id', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const hasAccess = await projectService.hasCapability(
    req.params.id,
    req.user!.userId,
    'project.delete'
  );
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  await projectService.archiveProject(req.params.id);
  res.status(204).send();
});

/**
 * GET /projects/:id/members
 * List project members
 */
projectRouter.get('/:id/members', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const members = await projectService.getProjectMembers(req.params.id);
  res.json(members);
});

/**
 * POST /projects/:id/members
 * Add project member
 */
projectRouter.post(
  '/:id/members',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(addMemberSchema),
  async (req, res) => {
    const hasAccess = await projectService.hasCapability(
      req.params.id,
      req.user!.userId,
      'project.manage_members'
    );
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const member = await projectService.addProjectMember(
      req.params.id,
      req.body.userId,
      req.body.role
    );
    res.status(201).json(member);
  }
);

/**
 * DELETE /projects/:id/members/:userId
 * Remove project member
 */
projectRouter.delete(
  '/:id/members/:userId',
  validateParams(z.object({ id: uuidSchema, userId: uuidSchema })),
  async (req, res) => {
    const hasAccess = await projectService.hasCapability(
      req.params.id,
      req.user!.userId,
      'project.manage_members'
    );
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await projectService.removeProjectMember(req.params.id, req.params.userId);
    res.status(204).send();
  }
);
