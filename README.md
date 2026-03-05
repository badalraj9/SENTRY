# SENTRY

> **Developer Collaboration OS** — A decision intelligence platform where thinking happens.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

---

## What is SENTRY?

SENTRY is a **standalone, developer-first collaboration platform** where everything except coding lives. It provides:

- 🎯 **Structured Communication** — Chats, discussions, and workshops with intent
- 🧠 **Intelligent Decision Capture** — Automatic detection and recall of decisions
- 📚 **Knowledge Accumulation** — Without documentation overhead
- 🔒 **Personal & Collaborative Workspaces** — With fine-grained permissions
- ⚡ **Adaptive Assistance** — Rule-based intelligence that learns your patterns

### What SENTRY is NOT

- ❌ Not a code repository (no Git functionality)
- ❌ Not a project management tool (no sprints, tickets, burndown charts)
- ❌ Not a social network (no followers, likes, viral content)
- ❌ Not an LLM-powered chatbot (no generative AI, no hallucinations)

---

## Core Philosophy

| Principle                           | Description                                                               |
| ----------------------------------- | ------------------------------------------------------------------------- |
| **Projects are living entities**    | Not just folders — they have pulse, history, knowledge                    |
| **Knowledge is first-class**        | Decisions aren't buried in chats — they're structured, searchable, linked |
| **Collaboration is structured**     | Intent-driven discussions, not noisy channels                             |
| **Automation is ambient**           | Silent by default, never intrusive                                        |
| **One intelligence, many contexts** | The Neural Hub adapts to each user and project                            |

---

## Key Features

### 🎯 Intent Checkpoints

Set explicit goals for discussions. The system scopes all analysis to your current intent.

```
/intent "Design caching strategy for API v2"
```

### 🧠 Decision Detection

The Neural Hub detects decisions in natural conversation:

```
Message: "Let's go with Redis for session storage"
         ↓
System:  [Decision Detected: Confidence 0.82]
         "Use Redis for session storage?"
         [Confirm] [Edit] [Dismiss]
```

### 🔍 Decision Recall

Instantly retrieve past decisions with context:

```
@assist why redis?
→ "You decided to use Redis for session storage (3 days ago)
   Rationale: Better persistence than Memcached
   Participants: @alice, @bob"
```

### 🏭 Workshops

Time-bounded, goal-oriented collaboration sessions with mandatory outcomes.

### 📄 Living Documents

Structured papers that link to decisions, discussions, and files.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Interface Layer                      │
│         Web App  •  CLI  •  Mobile (Future)             │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    API Gateway                          │
│              REST + WebSocket (Socket.io)               │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   Platform Core                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Business Logic Layer                   │ │
│  │  Users • Projects • Chats • Decisions • Workshops  │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Neural Hub (Intelligence)                 │ │
│  │  Sensors → Aggregation → Activation → Learning     │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    Data Layer                           │
│         PostgreSQL  •  Redis  •  S3/Blob                │
└─────────────────────────────────────────────────────────┘
```

---

## Neural Hub: AI-Inspired Intelligence (Zero ML)

The intelligence engine uses mathematical foundations from neural network theory — but implemented as **pure deterministic algorithms**. No models, no training, no black boxes.

| Concept            | Implementation                         |
| ------------------ | -------------------------------------- |
| Weighted Sums      | `z = Σ(signal × weight)`               |
| Sigmoid Activation | `σ(z) = 1/(1+e^(-k(z-θ)))`             |
| Hebbian Learning   | `Δw = η × signal × outcome`            |
| Exponential Decay  | `w(t) = w₀×e^(-λt) + base×(1-e^(-λt))` |

**Every decision is 100% traceable and explainable.**

---

## Tech Stack

| Layer        | Technology                                 |
| ------------ | ------------------------------------------ |
| **Backend**  | Node.js + TypeScript + Express + Socket.io |
| **Database** | PostgreSQL 14+                             |
| **Cache/RT** | Redis 7+                                   |
| **Frontend** | React + Vite + TypeScript                  |
| **CLI**      | Node.js + Commander.js                     |

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/sentry.git
cd sentry

# Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev
```

### Access Points

| Service   | URL                   |
| --------- | --------------------- |
| Web App   | http://localhost:5173 |
| API       | http://localhost:3000 |
| WebSocket | ws://localhost:3000   |

---

## Project Structure

```
sentry/
├── packages/
│   ├── backend/          # Express API + Neural Hub
│   ├── web/              # React web application (renamed from frontend)
│   ├── cli/              # Command-line tool
│   └── shared/           # Shared types & utilities
├── database/
│   └── migrations/       # SQL migration files
├── docker-compose.yml    # Infrastructure setup
├── docs/
│   ├── DEVELOPMENT.md    # Development guide
│   ├── API.md            # API documentation
│   ├── ARCHITECTURE.md   # Detailed architecture
│   ├── USER_GUIDE.md     # End-user documentation
│   └── DEPLOYMENT.md     # Production deployment guide
├── figma-mcp-server/     # Figma MCP integration server
└── README.md
```

---

## Documentation

| Document                                  | Description                                           |
| ----------------------------------------- | ----------------------------------------------------- |
| [DEVELOPMENT.md](./docs/DEVELOPMENT.md)   | Setup, development workflow, contribution guide       |
| [API.md](./docs/API.md)                   | REST & WebSocket API reference                        |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Detailed system architecture                          |
| [NEURAL_HUB.md](./docs/NEURAL_HUB.md)     | Complete Neural Hub intelligence engine documentation |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md)     | Production deployment guide                           |
| [USER_GUIDE.md](./docs/USER_GUIDE.md)     | End-user documentation                                |

---

## Performance Targets

| Metric                 | Target  |
| ---------------------- | ------- |
| Neural Hub per-message | < 1ms   |
| API p95 response       | < 100ms |
| WebSocket latency      | < 30ms  |
| Decision detection F1  | > 0.75  |

---

## Team

Built by the SENTRY team.

---

## License

Proprietary. All rights reserved.
