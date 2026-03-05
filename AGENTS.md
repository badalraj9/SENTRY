# AGENTS.md - SENTRY Development Guide

## Overview

SENTRY is a Developer Collaboration OS built with a monorepo:
- `@sentry/backend` - Express + Socket.IO API server
- `@sentry/cli` - Commander-based CLI tool
- `@sentry/shared` - Shared types and utilities

## Build/Test/Lint Commands

### Root (Monorepo)
```bash
npm run dev            # Run all services concurrently
npm run dev:backend    # Run backend only
npm run dev:cli        # Run CLI in dev mode
npm run build          # Build all packages
npm run test           # Run all tests
npm run test:unit      # Run unit tests only
npm run lint           # ESLint all packages
npm run format         # Prettier format all code
npm run db:migrate     # Run database migrations
npm run db:seed        # Seed database
```

### Backend Package
```bash
npm run dev            # tsx watch mode
npm run build          # TypeScript compile
npm run test           # Run all tests (vitest)
npm run test:unit      # Run unit tests only
npm run test:integration # Run integration tests
npm run test:watch     # Watch mode
```

**Running a single test:**
```bash
npx vitest run tests/user.test.ts         # Specific file
npx vitest run -t "creates a new user"    # By name pattern
npx vitest run tests/unit/                # Specific directory
```

### CLI Package
```bash
npm run dev    # tsx watch mode
npm run build  # TypeScript compile
npm run start  # Run production build
```

### Shared Package
```bash
npm run build  # TypeScript compile
npm run dev    # Watch mode
```

---

## Code Style Guidelines

### TypeScript
- **Strict mode enabled** - all configs have `"strict": true`
- Target: ES2022, Module: NodeNext
- Use explicit return types for exported functions
- Use `unknown` instead of `any`

```typescript
export async function getUserById(id: string): Promise<User | null>
```

### Imports & Modules
- **Always use `.js` extension** for ESM local imports
- Group imports: external → internal (@sentry/shared) → relative
- Use named exports only in shared packages

```typescript
import { v4 as uuid } from 'uuid';
import type { User } from '@sentry/shared';
import { query } from '../db/pool.js';
```

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `user.service.ts` |
| Functions | camelCase | `getUserById` |
| Interfaces | PascalCase | `CreateUserInput` |
| Type aliases | PascalCase | `UserVisibility` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Database columns | snake_case | `created_at` |
| API responses | camelCase | `createdAt` |

### Error Handling
- Return `null` for "not found" cases, throw for actual errors
- Use try/catch with meaningful error messages
- Log errors with context before re-throwing

```typescript
export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await query<User>(/* ... */);
  return rows[0] || null;
}
```

### Database
- Use parameterized queries only - never string concatenation
- Map snake_case columns to camelCase in responses
- Use transactions for multi-step operations via `withTransaction`

```typescript
const { rows } = await query<User>(
  `SELECT id, handle, display_name as "displayName"
   FROM users WHERE id = $1`,
  [id]
);
```

### Service Pattern
```typescript
export interface CreateUserInput {
  handle: string;
  email: string;
  password: string;
  displayName?: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  return withTransaction(async (client) => {
    // implementation
  });
}
```

### Testing (Vitest)
- Place tests in `tests/` directory
- Use `describe` blocks grouping related tests
- Mock external dependencies (database, Redis)
- Integration tests use `supertest` for HTTP

```typescript
describe('Authentication', () => {
  it('registers a new user', async () => {
    const res = await request(app).post('/auth/register').send(testUser);
    expect(res.status).toBe(201);
  });
});
```

### Linting & Formatting
- Run `npm run lint` before committing
- Run `npm run format` to auto-fix formatting
- ESLint: `eslint packages --ext .ts,.tsx`
- Prettier: `"packages/**/*.{ts,tsx,json}"`

### File Organization
```
packages/backend/src/
  config/       # Configuration
  db/           # Database connections
  middleware/   # Express middleware
  routes/       # API route handlers
  services/     # Business logic
  intelligence/ # AI/ML components
  websocket/    # Socket.IO handlers

packages/cli/src/
  commands/     # CLI command implementations
  config.ts     # CLI configuration
  api.ts        # API client

packages/shared/src/
  types.ts      # Core type definitions
  constants.ts  # Shared constants
  utils.ts      # Shared utilities
  index.ts      # Public exports
```

---

## Environment Variables

Copy `.env.example` to `.env`:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection (optional for dev)
- `JWT_SECRET` - Auth token secret
- `NODE_ENV` - development | production
- `PORT` - Server port (default: 3001)

---

## Common Tasks

### Adding a new API endpoint
1. Create route in `packages/backend/src/routes/`
2. Add service function in `packages/backend/src/services/`
3. Register route in `packages/backend/src/routes/index.ts`
4. Add tests in `packages/backend/tests/`

### Adding a new shared type
1. Add to `packages/shared/src/types.ts`
2. Export from `packages/shared/src/index.ts`
3. Import via `@sentry/shared`
