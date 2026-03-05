# SENTRY Development Guide

> Complete guide for setting up, developing, and contributing to SENTRY.

---

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Architecture Deep Dive](#architecture-deep-dive)
5. [Neural Hub Intelligence](#neural-hub-intelligence)
6. [Database Schema](#database-schema)
7. [API Design](#api-design)
8. [Testing Strategy](#testing-strategy)
9. [Coding Standards](#coding-standards)
10. [Deployment](#deployment)

---

## Environment Setup

### Prerequisites

| Tool           | Version | Purpose                       |
| -------------- | ------- | ----------------------------- |
| Node.js        | 20+     | Runtime                       |
| npm            | 10+     | Package manager               |
| Docker         | 24+     | Containerization              |
| Docker Compose | 2.20+   | Multi-container orchestration |
| Git            | 2.40+   | Version control               |
| VS Code        | Latest  | Recommended IDE               |

### VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker"
  ]
}
```

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/sentry.git
cd sentry

# 2. Copy environment file
cp .env.example .env

# 3. Start infrastructure
docker-compose up -d

# 4. Verify containers
docker ps
# Should show: sentry-postgres, sentry-redis

# 5. Install dependencies
npm install

# 6. Run migrations
npm run db:migrate

# 7. Seed development data (optional)
npm run db:seed

# 8. Start all services
npm run dev
```

### Environment Variables

```bash
# .env
# Database
DATABASE_URL=postgresql://sentry:sentry@localhost:5432/sentry
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

---

## Project Structure

```
sentry/
├── packages/
│   ├── backend/                 # Express API server
│   │   ├── src/
│   │   │   ├── index.ts         # Entry point
│   │   │   ├── app.ts           # Express app setup
│   │   │   ├── config/          # Configuration
│   │   │   ├── db/              # Database clients
│   │   │   ├── middleware/      # Express middleware
│   │   │   ├── routes/          # API route handlers
│   │   │   ├── services/        # Business logic
│   │   │   ├── intelligence/    # Neural Hub
│   │   │   │   ├── neural-hub.ts
│   │   │   │   ├── sensors/
│   │   │   │   ├── math/
│   │   │   │   └── state/
│   │   │   ├── websocket/       # Socket.io handlers
│   │   │   └── utils/           # Utilities
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                     # React web application (renamed from frontend)
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── api/             # API client
│   │   │   ├── hooks/           # React hooks
│   │   │   ├── stores/          # State management
│   │   │   ├── pages/           # Page components
│   │   │   ├── components/      # UI components
│   │   │   └── styles/          # CSS
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── cli/                     # Command-line tool
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── commands/
│   │   │   ├── api/
│   │   │   └── utils/
│   │   └── package.json
│   │
│   └── shared/                  # Shared types & utilities
│       ├── src/
│       │   ├── types/
│       │   ├── constants/
│       │   └── utils/
│       └── package.json
│
├── database/
│   └── migrations/              # SQL migrations
│       ├── 001_users.sql
│       ├── 002_projects.sql
│       ├── 003_chats.sql
│       ├── 004_intents.sql
│       ├── 005_decisions.sql
│       └── 006_neural_states.sql
│
├── docker-compose.yml           # Infrastructure setup

├── docs/
│   ├── DEVELOPMENT.md           # This file
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── USER_GUIDE.md
│   └── DEPLOYMENT.md

├── figma-mcp-server/            # Figma MCP integration server
├── package.json                 # Root workspace config
├── tsconfig.base.json           # Shared TS config
└── .env.example
```

---

## Development Workflow

### Running Services

```bash
# Start all services (backend + frontend + CLI watch)
npm run dev

# Start individual services
npm run dev:backend    # API server on :3000
npm run dev:web        # Vite dev server on :5173
npm run dev:cli        # CLI in watch mode

# Database operations
npm run db:migrate     # Run pending migrations
npm run db:rollback    # Rollback last migration
npm run db:seed        # Seed development data
npm run db:reset       # Drop, create, migrate, seed
```

### Development Ports

| Service     | Port | Description      |
| ----------- | ---- | ---------------- |
| Backend API | 3000 | REST + WebSocket |
| Frontend    | 5173 | Vite dev server  |
| PostgreSQL  | 5432 | Database         |
| Redis       | 6379 | Cache            |

### Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/neural-hub-improvements
# ... make changes ...
git add .
git commit -m "feat(intelligence): improve decision detection accuracy"
git push origin feature/neural-hub-improvements
# Create PR for review
```

### Commit Convention

```
<type>(<scope>): <description>

Types:
  feat     - New feature
  fix      - Bug fix
  refactor - Code refactoring
  docs     - Documentation
  test     - Tests
  chore    - Build/tooling

Scopes:
  backend, web, cli, shared, db, intelligence
```

---

## Architecture Deep Dive

### Request Flow

```
Client Request
     │
     ▼
┌─────────────────────┐
│   API Gateway       │
│   (Express)         │
│   • Auth middleware │
│   • Validation      │
│   • Rate limiting   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Route Handler     │
│   • Parse request   │
│   • Call service    │
│   • Format response │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Service Layer     │
│   • Business logic  │
│   • Transaction mgmt│
│   • Event emission  │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐ ┌─────────────┐
│   DB    │ │ Neural Hub  │
│ (CRUD)  │ │ (Detection) │
└─────────┘ └─────────────┘
```

### Message Processing Pipeline

```
New Message
     │
     ▼
┌─────────────────────────────────────┐
│ 1. Store in Database                │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│ 2. Broadcast via WebSocket          │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│ 3. Neural Hub Processing            │
│    ┌─────────────────────────────┐  │
│    │ Sensors: Extract signals    │  │
│    └──────────────┬──────────────┘  │
│                   ▼                  │
│    ┌─────────────────────────────┐  │
│    │ Aggregate: Weighted sum     │  │
│    └──────────────┬──────────────┘  │
│                   ▼                  │
│    ┌─────────────────────────────┐  │
│    │ Activate: Sigmoid function  │  │
│    └──────────────┬──────────────┘  │
│                   ▼                  │
│    ┌─────────────────────────────┐  │
│    │ Decide: Confidence >= 0.5?  │  │
│    └─────────────────────────────┘  │
└──────────────────┬──────────────────┘
                   │
                   ▼ (if detected)
┌─────────────────────────────────────┐
│ 4. Create Decision Proposal         │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│ 5. Notify User via WebSocket        │
└─────────────────────────────────────┘
```

---

## Neural Hub Intelligence

### Core Mathematical Components

#### 1. Signal Sensors

```typescript
// Linguistic Sensor - Pattern matching with weights
const PATTERNS = [
  { regex: /\bdecided\b/i, weight: 0.35 },
  { regex: /\blet's go with\b/i, weight: 0.32 },
  { regex: /\bwe'll use\b/i, weight: 0.3 },
];

// Structural Sensor - Thread/reaction analysis
function structuralScore(msg: Message, ctx: Context): number {
  let score = 0;
  score += Math.min(msg.threadDepth * 0.03, 0.15); // Depth bonus
  score += ctx.isAuthorMaintainer ? 0.12 : 0; // Authority
  score += Math.min(msg.ackRatio * 0.05, 0.1); // Acknowledgments
  return score;
}
```

#### 2. Aggregation

```typescript
// Perceptron-style weighted sum
function aggregate(signals: Signal[], weights: Map<string, number>): number {
  return signals.reduce((sum, s) => {
    const w = weights.get(s.name) ?? s.baseWeight;
    return sum + s.value * w;
  }, 0);
}
```

#### 3. Activation

```typescript
// Sigmoid function maps to (0, 1)
function sigmoid(z: number, threshold: number, k = 10): number {
  return 1 / (1 + Math.exp(-k * (z - threshold)));
}
```

#### 4. Learning

```typescript
// Hebbian-inspired weight update
function updateWeight(
  current: number,
  signal: number,
  outcome: "confirmed" | "rejected",
  η = 0.05,
): number {
  const direction = outcome === "confirmed" ? 1 : -1;
  return clamp(current + η * signal * direction, 0.01, 1.0);
}

// Temporal decay
function decay(value: number, base: number, days: number, λ = 0.01): number {
  const factor = Math.exp(-λ * days);
  return value * factor + base * (1 - factor);
}
```

### Neural State Persistence

```sql
CREATE TABLE neural_states (
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  weights JSONB DEFAULT '{}',
  threshold DECIMAL(4,3) DEFAULT 0.750,
  alpha INTEGER DEFAULT 1,  -- Beta dist confirmations
  beta INTEGER DEFAULT 1,   -- Beta dist rejections
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);
```

---

## Database Schema

### Core Tables

```sql
-- Users
users (id, handle, display_name, email, visibility, created_at)
user_profiles (user_id, workshops_participated, decisions_confirmed, trust_score)

-- Projects
projects (id, name, description, owner_id, visibility, created_at)
project_members (project_id, user_id, role, joined_at)
project_capabilities (project_id, user_id, capability, granted_at)

-- Chats & Messages
chats (id, type, project_id, name, visibility, created_at)
chat_participants (chat_id, user_id, joined_at)
messages (id, chat_id, user_id, content, reply_to, created_at)

-- Intents
chat_intents (id, chat_id, statement, status, created_by, created_at)

-- Decisions
decision_proposals (id, chat_id, intent_id, statement, confidence, status)
decision_records (id, project_id, statement, rationale, confirmed_by, created_at)

-- Intelligence
neural_states (user_id, project_id, weights, threshold, alpha, beta)
```

### Entity Relationships

```
users ─────┬──── projects (owner)
           ├──── project_members
           ├──── messages
           ├──── chats (participants)
           └──── neural_states

projects ──┬──── chats
           ├──── decision_records
           └──── neural_states

chats ─────┬──── messages
           ├──── chat_intents
           └──── decision_proposals
```

---

## API Design

### REST Endpoints

```
Authentication
  POST   /auth/login
  POST   /auth/logout
  POST   /auth/refresh

Users
  GET    /users/:id
  PATCH  /users/:id
  GET    /users/:id/profile

Projects
  GET    /projects
  POST   /projects
  GET    /projects/:id
  PATCH  /projects/:id

Chats
  GET    /chats
  POST   /chats
  GET    /chats/:id/messages
  POST   /chats/:id/messages

Intents
  GET    /chats/:id/intent
  POST   /chats/:id/intent
  PATCH  /intents/:id

Decisions
  GET    /decisions
  POST   /decisions
  GET    /decisions/search

Proposals
  GET    /proposals
  POST   /proposals/:id/approve
  POST   /proposals/:id/reject

Assistant
  POST   /assistant/query
```

### WebSocket Events

```typescript
// Client → Server
{ type: 'subscribe', channels: ['chat:123', 'proposals'] }
{ type: 'message.send', chat_id: '123', content: 'Hello' }
{ type: 'typing.start', chat_id: '123' }

// Server → Client
{ type: 'message.new', chat_id: '123', message: {...} }
{ type: 'proposal.new', proposal: {...} }
{ type: 'decision.new', decision: {...} }
{ type: 'user.typing', chat_id: '123', user_id: '456' }
```

---

## Testing Strategy

### Test Structure

```
packages/backend/tests/
├── unit/
│   ├── intelligence/
│   │   ├── neural-hub.test.ts
│   │   ├── sensors.test.ts
│   │   └── math.test.ts
│   └── services/
│       ├── user.service.test.ts
│       └── decision.service.test.ts
├── integration/
│   ├── api/
│   │   ├── auth.test.ts
│   │   └── decisions.test.ts
│   └── websocket/
│       └── events.test.ts
└── e2e/
    └── decision-flow.test.ts
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage
```

### Detection Accuracy Testing

```typescript
const TEST_CORPUS = [
  { text: "Let's go with Redis", expected: true, minConfidence: 0.75 },
  { text: "What about Redis?", expected: false, maxConfidence: 0.3 },
  {
    text: "Decided: PostgreSQL for storage",
    expected: true,
    minConfidence: 0.85,
  },
];

// Target metrics:
// Precision > 0.80
// Recall > 0.65
// F1 > 0.72
```

---

## Coding Standards

### TypeScript

```typescript
// Use explicit types
function processMessage(msg: Message, ctx: Context): ProcessResult {}

// Prefer interfaces over types for objects
interface Message {
  id: string;
  content: string;
  createdAt: Date;
}

// Use enums for fixed sets
enum ChatType {
  Direct = "direct",
  Group = "group",
  Workshop = "workshop",
}

// Prefer const assertions
const WEIGHTS = {
  linguistic: 0.4,
  structural: 0.3,
} as const;
```

### Error Handling

```typescript
// Use custom error classes
class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "NotFoundError";
  }
}

// Always handle errors explicitly
try {
  await service.process(msg);
} catch (error) {
  if (error instanceof NotFoundError) {
    return res.status(404).json({ error: error.message });
  }
  throw error; // Re-throw unknown errors
}
```

### File Naming

```
kebab-case for files:    neural-hub.ts, user.service.ts
PascalCase for classes:  NeuralHub, UserService
camelCase for functions: processMessage, computeScore
SCREAMING_CASE for constants: DEFAULT_THRESHOLD, MAX_RETRIES
```

---

## Deployment

### Docker Build

```bash
# Build production image
docker build -t sentry:latest -f docker/Dockerfile .

# Run production container
docker run -d \
  --name sentry \
  -p 3000:3000 \
  -e DATABASE_URL=... \
  -e REDIS_URL=... \
  -e JWT_SECRET=... \
  sentry:latest
```

### Environment Configurations

| Environment | Database         | Redis        | Features                  |
| ----------- | ---------------- | ------------ | ------------------------- |
| Development | Local Docker     | Local Docker | Debug logging, hot reload |
| Staging     | Cloud PostgreSQL | Cloud Redis  | Full features, test data  |
| Production  | Cloud PostgreSQL | Cloud Redis  | Optimized, monitoring     |

---

## Troubleshooting

### Common Issues

**Database connection failed**

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart container
docker-compose restart postgres
```

**Redis connection failed**

```bash
# Check if Redis is running
docker ps | grep redis

# Test connection
redis-cli -h localhost -p 6379 ping
```

**Port already in use**

```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <pid> /F
```

---

## Getting Help

- **Slack**: #sentry-dev
- **Wiki**: internal.wiki/sentry
- **Issues**: GitHub Issues

---

_Last updated: January 2026_
