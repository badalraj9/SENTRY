/**
 * User Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody, validateParams, uuidSchema } from '../middleware/validation.js';
import * as userService from '../services/user.service.js';

export const userRouter = Router();

// All user routes require authentication
userRouter.use(authMiddleware);

// =============================================================================
// SCHEMAS
// =============================================================================

const updateUserSchema = z.object({
  displayName: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
  visibility: z.enum(['public', 'limited', 'private']).optional(),
});

const updatePreferencesSchema = z.object({
  prefersConciseSummaries: z.boolean().optional(),
  captureDecisionsEarly: z.boolean().optional(),
  ignoreBrainstormingPrompts: z.boolean().optional(),
  assistantVerbosity: z.enum(['quiet', 'balanced', 'verbose']).optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /users/me
 * Get current user
 */
userRouter.get('/me', async (req, res) => {
  const user = await userService.getUserById(req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

/**
 * PATCH /users/me
 * Update current user
 */
userRouter.patch('/me', validateBody(updateUserSchema), async (req, res) => {
  const user = await userService.updateUser(req.user!.userId, req.body);
  res.json(user);
});

/**
 * GET /users/:id
 * Get user by ID
 */
userRouter.get('/:id', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

/**
 * GET /users/:id/profile
 * Get user profile
 */
userRouter.get('/:id/profile', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const profile = await userService.getUserProfile(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(profile);
});

/**
 * GET /users/me/preferences
 * Get assistant preferences
 */
userRouter.get('/me/preferences', async (req, res) => {
  const prefs = await userService.getAssistantPreferences(req.user!.userId);
  res.json(prefs);
});

/**
 * PATCH /users/me/preferences
 * Update assistant preferences
 */
userRouter.patch('/me/preferences', validateBody(updatePreferencesSchema), async (req, res) => {
  const prefs = await userService.updateAssistantPreferences(req.user!.userId, req.body);
  res.json(prefs);
});
