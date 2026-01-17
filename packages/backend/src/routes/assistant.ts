/**
 * Assistant Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody, uuidSchema } from '../middleware/validation.js';
import * as assistantService from '../services/assistant.service.js';

export const assistantRouter = Router();

assistantRouter.use(authMiddleware);

// =============================================================================
// SCHEMAS
// =============================================================================

const querySchema = z.object({
  query: z.string().min(1).max(500),
  projectId: uuidSchema,
  chatId: uuidSchema.optional(),
  mode: z.enum(['analyst', 'advisor', 'facilitator']).optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /assistant/query
 * Ask the assistant a question
 */
assistantRouter.post('/query', validateBody(querySchema), async (req, res) => {
  try {
    const response = await assistantService.processQuery(req.body);
    res.json(response);
  } catch (error) {
    console.error('Assistant query error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

/**
 * POST /assistant/classify
 * Classify a query to determine mode
 */
assistantRouter.post(
  '/classify',
  validateBody(z.object({ query: z.string().min(1) })),
  async (req, res) => {
    const mode = assistantService.classifyQuery(req.body.query);
    res.json({ mode });
  }
);
