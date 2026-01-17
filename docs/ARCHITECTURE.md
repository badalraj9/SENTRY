# SENTRY Architecture

> Complete technical architecture for the Developer Collaboration OS.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       SENTRY PLATFORM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   INTERFACE LAYER                         │ │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────┐              │ │
│  │   │  Web    │    │   CLI   │    │ Mobile  │              │ │
│  │   │  React  │    │  Node   │    │ (Future)│              │ │
│  │   └────┬────┘    └────┬────┘    └────┬────┘              │ │
│  └────────┼──────────────┼──────────────┼────────────────────┘ │
│           │              │              │                       │
│           └──────────────┴──────────────┘                       │
│                          │                                       │
│  ┌───────────────────────▼───────────────────────────────────┐ │
│  │                   API GATEWAY                              │ │
│  │         Express.js + Socket.io (REST + WebSocket)         │ │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐               │ │
│  │   │   Auth   │  │ Validate │  │   Rate   │               │ │
│  │   │Middleware│  │Middleware│  │  Limit   │               │ │
│  │   └──────────┘  └──────────┘  └──────────┘               │ │
│  └───────────────────────┬───────────────────────────────────┘ │
│                          │                                       │
│  ┌───────────────────────▼───────────────────────────────────┐ │
│  │                   PLATFORM CORE                            │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │              BUSINESS LOGIC LAYER                     │ │ │
│  │  │  UserService • ProjectService • ChatService          │ │ │
│  │  │  MessageService • IntentService • DecisionService    │ │ │
│  │  │  WorkshopService • DocumentService • AssistantService│ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                          │                                 │ │
│  │  ┌──────────────────────▼───────────────────────────────┐ │ │
│  │  │                  NEURAL HUB                           │ │ │
│  │  │   ┌─────────┐  ┌─────────┐  ┌─────────┐             │ │ │
│  │  │   │ Sensors │──│Aggregate│──│Activate │──▶ Detect   │ │ │
│  │  │   └─────────┘  └─────────┘  └─────────┘             │ │ │
│  │  │        ▲                                    │        │ │ │
│  │  │        └────────── Learning ◀───────────────┘        │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └───────────────────────┬───────────────────────────────────┘ │
│                          │                                       │
│  ┌───────────────────────▼───────────────────────────────────┐ │
│  │                     DATA LAYER                             │ │
│  │   ┌────────────┐  ┌────────────┐  ┌────────────┐         │ │
│  │   │ PostgreSQL │  │   Redis    │  │  S3/Blob   │         │ │
│  │   │  Primary   │  │ Cache/RT   │  │   Files    │         │ │
│  │   └────────────┘  └────────────┘  └────────────┘         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Interface Layer

#### Web Application (React + Vite)
```
Responsibilities:
  • Render UI components
  • Manage local state
  • Handle user interactions
  • Maintain WebSocket connection

Does NOT:
  • Make business decisions
  • Store persistent data
  • Run detection algorithms
```

#### CLI Tool (Node.js + Commander)
```
Responsibilities:
  • Provide terminal interface
  • Format output (human/JSON)
  • Cache auth tokens locally

Does NOT:
  • Run detection algorithms
  • Cache neural states
```

### 2. API Gateway

```typescript
// Middleware Stack
app.use(cors());
app.use(helmet());
app.use(rateLimit({ windowMs: 60000, max: 100 }));
app.use(authMiddleware);
app.use(validationMiddleware);

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/chats', chatRoutes);
app.use('/decisions', decisionRoutes);
app.use('/assistant', assistantRoutes);

// WebSocket
io.on('connection', handleConnection);
```

### 3. Business Logic Layer

| Service | Responsibility |
|---------|----------------|
| UserService | Auth, profiles, preferences |
| ProjectService | CRUD, members, capabilities |
| ChatService | Create, join, archive |
| MessageService | Send, edit, delete, react |
| IntentService | Set, resolve, abandon |
| DecisionService | Proposals, records, search |
| WorkshopService | Lifecycle, summaries |
| AssistantService | Query handling |

### 4. Neural Hub

```
Input Layer (Sensors)
├── LinguisticSensor    → Pattern matching
├── StructuralSensor    → Thread/reaction analysis
├── ContextualSensor    → Intent/chat-type awareness
└── TemporalSensor      → Time patterns

Processing Layer
├── Aggregator          → Weighted sum: z = Σ(s×w)
└── Activator           → Sigmoid: σ(z) = 1/(1+e^(-k(z-θ)))

Output Layer
├── ProposalEmitter     → Create decision proposals
└── SilenceEmitter      → No action (default)

Feedback Layer
├── HebbianLearner      → Weight updates: Δw = η×s×outcome
└── TemporalDecay       → Drift toward baseline
```

### 5. Data Layer

```
PostgreSQL (Primary Store)
├── Users, Profiles, Preferences
├── Projects, Members, Capabilities
├── Chats, Participants, Messages
├── Intents
├── Decisions (Proposals, Records)
└── Neural States

Redis (Cache + Real-time)
├── Session cache
├── Neural state cache
├── Pub/Sub for WebSocket

S3/Blob (File Storage)
├── Uploaded files
└── Generated exports
```

---

## Data Flow Diagrams

### Message Processing

```
User types message
        │
        ▼
┌─────────────────┐
│ POST /messages  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ MessageService  │
│   .create()     │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────────┐
│  DB   │ │ WebSocket │
│ Write │ │ Broadcast │
└───────┘ └───────────┘
         │
         ▼
┌─────────────────┐
│   NeuralHub     │
│   .process()    │
└────────┬────────┘
         │
         ▼
    confidence >= 0.5?
    ┌────┴────┐
   No        Yes
    │         │
    ▼         ▼
  Done    ┌───────────┐
          │ Create    │
          │ Proposal  │
          └─────┬─────┘
                │
                ▼
          ┌───────────┐
          │ Notify    │
          │ via WS    │
          └───────────┘
```

### Decision Confirmation

```
User clicks "Confirm"
        │
        ▼
┌────────────────────┐
│ POST /proposals/   │
│      :id/approve   │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ DecisionService    │
│   .approve()       │
└─────────┬──────────┘
          │
     ┌────┴────┐
     ▼         ▼
┌─────────┐ ┌─────────────┐
│ Create  │ │ Update      │
│ Record  │ │ Intent      │
└─────────┘ │ (if linked) │
            └─────────────┘
          │
          ▼
┌────────────────────┐
│ NeuralHub          │
│   .learn()         │
│   outcome=confirmed│
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Update weights     │
│ Δw = +η×signal     │
└────────────────────┘
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────┐     ┌───────────────┐     ┌──────────┐
│  users  │────▶│project_members│◀────│ projects │
└────┬────┘     └───────────────┘     └────┬─────┘
     │                                      │
     │          ┌───────────────┐           │
     └─────────▶│chat_participants◀──────────┘
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │     chats     │
                └───────┬───────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
    ┌──────────┐ ┌────────────┐ ┌──────────────┐
    │ messages │ │chat_intents│ │decision_props│
    └──────────┘ └────────────┘ └──────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ decision_records │
                              └──────────────────┘
```

### Key Tables

```sql
-- Core Entities
users (id, handle, email, created_at)
projects (id, name, owner_id, visibility)
chats (id, type, project_id, name)
messages (id, chat_id, user_id, content, created_at)

-- Decision System
chat_intents (id, chat_id, statement, status)
decision_proposals (id, chat_id, statement, confidence, status)
decision_records (id, project_id, statement, rationale, confirmed_by)

-- Intelligence
neural_states (user_id, project_id, weights, threshold, alpha, beta)
```

---

## Security Model

### Authentication

```
JWT-based authentication:
  • Access token: 15 minutes
  • Refresh token: 7 days
  • Stored in httpOnly cookie (web)
  • Stored in config file (CLI)
```

### Authorization (Capability-Based)

```typescript
type Capability =
  | 'project.view' | 'project.edit' | 'project.delete'
  | 'chat.view' | 'chat.send' | 'chat.moderate'
  | 'decision.view' | 'decision.approve' | 'decision.deprecate'
  | 'workshop.create' | 'workshop.close';

// Check before action
if (!hasCapability(user, project, 'decision.approve')) {
  throw new ForbiddenError();
}
```

### Role Templates

| Role | Capabilities |
|------|-------------|
| Owner | All |
| Maintainer | All except project.delete |
| Collaborator | view, send, create |
| Observer | view only |

---

## Performance Architecture

### Caching Strategy

```
Layer 1: Application (in-memory)
  TTL: 60 seconds
  Items: Hot neural states, active sessions

Layer 2: Redis
  TTL: 5 minutes
  Items: Neural states, user profiles, search results

Layer 3: PostgreSQL
  Source of truth
```

### Optimization Techniques

| Technique | Where | Benefit |
|-----------|-------|---------|
| Precompiled regex | Linguistic sensor | O(1) vs O(n) compile |
| Early exit | Detection pipeline | Skip 80% of messages |
| Connection pooling | Database | Reduced latency |
| Pub/Sub | WebSocket | Horizontal scaling |

### Performance Targets

| Metric | Target |
|--------|--------|
| Neural Hub per-message | < 1ms |
| API p50 | < 50ms |
| API p95 | < 100ms |
| API p99 | < 300ms |
| WebSocket latency | < 30ms |

---

## Scalability Path

### Horizontal Scaling

```
                    Load Balancer
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
        ┌───────┐    ┌───────┐    ┌───────┐
        │ API 1 │    │ API 2 │    │ API N │
        └───┬───┘    └───┬───┘    └───┬───┘
            │            │            │
            └────────────┴────────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
         ┌─────────┐           ┌─────────┐
         │ Primary │◀─────────▶│ Replica │
         │   DB    │           │   DB    │
         └─────────┘           └─────────┘
```

### Future Optimizations

1. **Read replicas** for search queries
2. **Message partitioning** by date
3. **Materialized views** for activity summaries
4. **CDN** for static assets

---

## Monitoring

### Metrics to Track

```yaml
Application:
  - Request rate (req/s)
  - Response time (p50, p95, p99)
  - Error rate (%)
  - Active WebSocket connections

Neural Hub:
  - Detection rate (decisions/hour)
  - Confirmation rate (%)
  - Average confidence score
  - Weight distribution

Database:
  - Query time (ms)
  - Connection pool usage
  - Cache hit rate

Infrastructure:
  - CPU usage
  - Memory usage
  - Network I/O
```

---

*Document Version: 1.0 | January 2026*
