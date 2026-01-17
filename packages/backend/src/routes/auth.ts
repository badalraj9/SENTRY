/**
 * Auth Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validation.js';
import { generateTokens } from '../middleware/auth.js';
import * as userService from '../services/user.service.js';

export const authRouter = Router();

// =============================================================================
// SCHEMAS
// =============================================================================

const registerSchema = z.object({
  handle: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /auth/register
 * Create a new user account
 */
authRouter.post('/register', validateBody(registerSchema), async (req, res) => {
  try {
    const { handle, email, password, displayName } = req.body;

    // Check if user exists
    const existingEmail = await userService.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const existingHandle = await userService.getUserByHandle(handle);
    if (existingHandle) {
      return res.status(400).json({ error: 'Handle already taken' });
    }

    // Create user
    const user = await userService.createUser({ handle, email, password, displayName });

    // Generate tokens
    const tokens = generateTokens(user.id, user.handle);

    res.status(201).json({
      user,
      ...tokens,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /auth/login
 * Authenticate and get tokens
 */
authRouter.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userService.validateCredentials(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last active
    await userService.updateLastActive(user.id);

    // Generate tokens
    const tokens = generateTokens(user.id, user.handle);

    res.json({
      user,
      ...tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token (simplified - in production use refresh token)
 */
authRouter.post('/refresh', async (req, res) => {
  // In production, this would validate a refresh token
  // For now, require re-authentication
  res.status(501).json({ error: 'Token refresh not implemented' });
});
