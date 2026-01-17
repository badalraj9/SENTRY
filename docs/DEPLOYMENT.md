# SENTRY Deployment Guide

> Complete guide for deploying SENTRY in production

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [CLI Distribution](#cli-distribution)
6. [Health Checks](#health-checks)
7. [Scaling](#scaling)

---

## Prerequisites

- **Node.js** 20+ LTS
- **PostgreSQL** 15+
- **Redis** 7+
- **Docker** (optional, for containerized deployment)

---

## Environment Setup

Create `.env` file from the example:

```bash
cp .env.example .env
```

### Required Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/sentry

# Redis
REDIS_URL=redis://host:6379

# Security
JWT_SECRET=<generate-32-byte-secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://your-frontend-domain.com
```

### Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database Setup

### 1. Create Database

```sql
CREATE DATABASE sentry;
CREATE USER sentry_app WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE sentry TO sentry_app;
```

### 2. Run Migrations

```bash
cd d:\MAJOR\SENTRY
npm run db:migrate
```

This runs all migrations in `database/migrations/` in order:
1. `001_users.sql` - Core user tables
2. `002_projects.sql` - Projects and roles
3. `003_chats.sql` - Chat system
4. `004_intents.sql` - Intent checkpoints
5. `005_decisions.sql` - Decision records
6. `006_neural_states.sql` - Per-user learning
7. `007_sessions.sql` - Sessions and API keys
8. `008_workshops.sql` - Workshop system
9. `009_documents.sql` - Document management

### 3. Create Indexes (if not included)

Migrations include all necessary indexes. Verify with:

```sql
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';
```

---

## Backend Deployment

### Option 1: Direct Node.js

```bash
# Build
npm run build

# Start
NODE_ENV=production node packages/backend/dist/index.js
```

### Option 2: Docker

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
COPY packages/backend/package*.json packages/backend/
COPY packages/shared/package*.json packages/shared/

RUN npm ci --only=production

COPY packages/shared/dist packages/shared/dist
COPY packages/backend/dist packages/backend/dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "packages/backend/dist/index.js"]
```

```bash
docker build -t sentry-backend .
docker run -d --env-file .env -p 3000:3000 sentry-backend
```

### Option 3: Docker Compose (Full Stack)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: sentry
      POSTGRES_USER: sentry_app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sentry_app -d sentry"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: .
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://sentry_app:${DB_PASSWORD}@postgres:5432/sentry
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3000:3000"

volumes:
  postgres_data:
  redis_data:
```

---

## CLI Distribution

### Build CLI

```bash
cd packages/cli
npm run build
```

### Global Install (Local)

```bash
npm link
sentry --help
```

### npm Publish

```bash
cd packages/cli
npm publish --access public
```

Users can then install:

```bash
npm install -g @sentry/cli
sentry auth login
```

---

## Health Checks

### HTTP Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-01-15T14:00:00.000Z"}
```

### Database Connection

```bash
curl http://localhost:3000/health/db
```

### Redis Connection

```bash
curl http://localhost:3000/health/redis
```

---

## Scaling

### Horizontal Scaling

The backend is stateless (sessions in Redis). Deploy multiple instances behind a load balancer:

```
┌─────────────┐
│ Load        │
│ Balancer    │
└─────┬───────┘
      │
  ┌───┴───┐
  │       │
┌─┴─┐   ┌─┴─┐
│ N1│   │ N2│  Backend Nodes
└─┬─┘   └─┬─┘
  │       │
  └───┬───┘
      │
  ┌───┴───┐
  │Postgres│
  └───────┘
```

### Recommended Instance Sizes

| Component | Min | Recommended |
|-----------|-----|-------------|
| Backend | 1 vCPU, 1GB RAM | 2 vCPU, 4GB RAM |
| PostgreSQL | 2 vCPU, 4GB RAM | 4 vCPU, 8GB RAM |
| Redis | 1 vCPU, 512MB RAM | 1 vCPU, 1GB RAM |

### Database Connection Pooling

The backend uses `pg` connection pooling. Configure in production:

```env
DATABASE_POOL_SIZE=20
DATABASE_IDLE_TIMEOUT=30000
```

### Redis Caching Strategy

- **Session cache TTL**: 1 hour
- **Neural state cache TTL**: 5 minutes
- **API key validation cache TTL**: 5 minutes

---

## Monitoring

### Logs

All logs go to stdout in JSON format. Use your log aggregator of choice.

### Metrics (Prometheus)

Add metrics endpoint:

```bash
npm install prom-client
```

Configure in `config/index.ts`:

```typescript
export const metrics = {
  enabled: process.env.METRICS_ENABLED === 'true',
  port: parseInt(process.env.METRICS_PORT || '9090'),
};
```

### Recommended Alerts

| Metric | Warning | Critical |
|--------|---------|----------|
| API p95 latency | > 200ms | > 500ms |
| Error rate | > 1% | > 5% |
| Database connections | > 80% | > 95% |
| Memory usage | > 70% | > 90% |

---

## Backup & Recovery

### PostgreSQL Backup

```bash
pg_dump -Fc sentry > sentry_backup.dump
```

### Restore

```bash
pg_restore -d sentry sentry_backup.dump
```

### Automated Daily Backups

```bash
0 2 * * * pg_dump -Fc sentry > /backups/sentry_$(date +\%Y\%m\%d).dump
```

---

## Security Checklist

- [ ] JWT secret is 32+ bytes, randomly generated
- [ ] Database uses SSL connections
- [ ] Redis requires authentication
- [ ] CORS origin is production domain only
- [ ] Rate limiting enabled
- [ ] HTTPS termination at load balancer
- [ ] API keys have scoped permissions
- [ ] Sessions expire appropriately
