/**
 * Validation Middleware using Zod
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Create validation middleware for request body
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten(),
      });
      return;
    }
    
    req.body = result.data;
    next();
  };
}

/**
 * Create validation middleware for query params
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    
    if (!result.success) {
      res.status(400).json({
        error: 'Invalid query parameters',
        details: result.error.flatten(),
      });
      return;
    }
    
    req.query = result.data as Record<string, string>;
    next();
  };
}

/**
 * Create validation middleware for URL params
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    
    if (!result.success) {
      res.status(400).json({
        error: 'Invalid URL parameters',
        details: result.error.flatten(),
      });
      return;
    }
    
    req.params = result.data as Record<string, string>;
    next();
  };
}

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
