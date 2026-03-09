/**
 * Chat Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody, validateParams, validateQuery, uuidSchema, paginationSchema } from '../middleware/validation.js';
import * as chatService from '../services/chat.service.js';
import * as messageService from '../services/message.service.js';
import * as intentService from '../services/intent.service.js';

export const chatRouter = Router();

chatRouter.use(authMiddleware);

// =============================================================================
// SCHEMAS
// =============================================================================

const createChatSchema = z.object({
  type: z.enum(['direct', 'group_collab', 'community', 'workshop']),
  projectId: uuidSchema.optional(),
  name: z.string().max(200).optional(),
  visibility: z.enum(['private', 'invite_only', 'public']).optional(),
});

const createMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  replyTo: uuidSchema.optional(),
});

const addMemberSchema = z.object({
  userId: uuidSchema,
});

const createIntentSchema = z.object({
  statement: z.string().min(1).max(500),
});

// =============================================================================
// CHAT ROUTES
// =============================================================================

/**
 * GET /chats
 * List user's chats
 */
chatRouter.get('/', async (req, res) => {
  const chats = await chatService.getChatsByUser(req.user!.userId);
  res.json(chats);
});

/**
 * POST /chats
 * Create a new chat
 */
chatRouter.post('/', validateBody(createChatSchema), async (req, res) => {
  const chat = await chatService.createChat({
    ...req.body,
    creatorId: req.user!.userId,
  });
  res.status(201).json(chat);
});

/**
 * GET /chats/:id
 * Get chat by ID
 */
chatRouter.get('/:id', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const chat = await chatService.getChatById(req.params.id);
  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  // Check access
  const isParticipant = await chatService.isParticipant(req.params.id, req.user!.userId);
  if (!isParticipant && chat.visibility !== 'public') {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(chat);
});

/**
 * POST /chats/:id/join
 * Join a chat
 */
chatRouter.post('/:id/join', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const chat = await chatService.getChatById(req.params.id);
  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  if (chat.visibility === 'private') {
    return res.status(403).json({ error: 'Cannot join private chat' });
  }

  const participant = await chatService.addChatParticipant(req.params.id, req.user!.userId);
  res.json(participant);
});

/**
 * POST /chats/:id/leave
 * Leave a chat
 */
chatRouter.post('/:id/leave', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  await chatService.removeChatParticipant(req.params.id, req.user!.userId);
  res.status(204).send();
});

// =============================================================================
// MESSAGE ROUTES
// =============================================================================

/**
 * GET /chats/:id/messages
 * Get messages in a chat
 */
chatRouter.get(
  '/:id/messages',
  validateParams(z.object({ id: uuidSchema })),
  validateQuery(z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    before: z.string().datetime().optional(),
    after: z.string().datetime().optional(),
  })),
  async (req, res) => {
    // Check access
    const isParticipant = await chatService.isParticipant(req.params.id, req.user!.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await messageService.getMessagesByChat(req.params.id, {
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      before: req.query.before ? new Date(req.query.before as string) : undefined,
      after: req.query.after ? new Date(req.query.after as string) : undefined,
    });

    res.json(messages);
  }
);

/**
 * POST /chats/:id/messages
 * Send a message
 */
chatRouter.post(
  '/:id/messages',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(createMessageSchema),
  async (req, res) => {
    // Check access
    const isParticipant = await chatService.isParticipant(req.params.id, req.user!.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = await messageService.createMessage({
      chatId: req.params.id,
      userId: req.user!.userId,
      ...req.body,
    });

    res.status(201).json(message);
  }
);

/**
 * POST /chats/:id/members
 * Add member to chat
 */
chatRouter.post(
  '/:id/members',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(addMemberSchema),
  async (req, res) => {
    const chat = await chatService.getChatById(req.params.id);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const participant = await chatService.addChatParticipant(req.params.id, req.body.userId);
    res.status(201).json(participant);
  }
);

/**
 * GET /chats/:id/members
 * Get chat members
 */
chatRouter.get('/:id/members', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const members = await chatService.getChatParticipants(req.params.id);
  res.json(members);
});

/**
 * GET /chats/:id/messages/:messageId/thread
 * Get thread replies for a message
 */
chatRouter.get(
  '/:id/messages/:messageId/thread',
  validateParams(z.object({ id: uuidSchema, messageId: uuidSchema })),
  async (req, res) => {
    const messages = await messageService.getThreadMessages(req.params.messageId);
    res.json(messages);
  }
);

// =============================================================================
// INTENT ROUTES
// =============================================================================

/**
 * GET /chats/:id/intent
 * Get active intent
 */
chatRouter.get('/:id/intent', validateParams(z.object({ id: uuidSchema })), async (req, res) => {
  const intent = await intentService.getActiveIntent(req.params.id);
  res.json(intent);
});

/**
 * POST /chats/:id/intent
 * Set intent
 */
chatRouter.post(
  '/:id/intent',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(createIntentSchema),
  async (req, res) => {
    try {
      const intent = await intentService.createIntent({
        chatId: req.params.id,
        statement: req.body.statement,
        createdBy: req.user!.userId,
      });
      res.status(201).json(intent);
    } catch (error) {
      if (error instanceof Error && error.message.includes('already has an active intent')) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }
);

/**
 * POST /chats/:id/intent/resolve
 * Resolve active intent
 */
chatRouter.post(
  '/:id/intent/resolve',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(z.object({ decisionIds: z.array(uuidSchema).optional() })),
  async (req, res) => {
    const activeIntent = await intentService.getActiveIntent(req.params.id);
    if (!activeIntent) {
      return res.status(404).json({ error: 'No active intent' });
    }

    const intent = await intentService.resolveIntent(activeIntent.id, req.body.decisionIds);
    res.json(intent);
  }
);

/**
 * POST /chats/:id/intent/abandon
 * Abandon active intent
 */
chatRouter.post(
  '/:id/intent/abandon',
  validateParams(z.object({ id: uuidSchema })),
  async (req, res) => {
    const activeIntent = await intentService.getActiveIntent(req.params.id);
    if (!activeIntent) {
      return res.status(404).json({ error: 'No active intent' });
    }

    const intent = await intentService.abandonIntent(activeIntent.id);
    res.json(intent);
  }
);
