# SENTRY API Documentation

> Auto-generated API reference for SENTRY Developer Collaboration OS

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Projects](#projects)
4. [Chats](#chats)
5. [Decisions](#decisions)
6. [Workshops](#workshops)
7. [Documents](#documents)
8. [Assistant](#assistant)

---

## Base URL

```
Development: http://localhost:3000
Production: https://api.sentry.dev
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens can be:
- **JWT Access Token** (15 min TTL) - from login
- **API Key** (no expiry, revocable) - for CLI/integrations

---

## Authentication

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "handle": "johndoe",
  "displayName": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "user": { "id": "uuid", "email": "...", "handle": "..." },
  "accessToken": "jwt...",
  "refreshToken": "rt_..."
}
```

### POST /auth/login
Login with email/password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "user": { "id": "uuid", ... },
  "accessToken": "jwt...",
  "refreshToken": "rt_..."
}
```

### POST /auth/api-keys
Create an API key for CLI/integrations.

**Request Body:**
```json
{
  "name": "my-cli-key"
}
```

**Response:** `201 Created`
```json
{
  "apiKey": { "id": "...", "prefix": "sntry_abc..." },
  "key": "sntry_abcdef..." // Only shown once!
}
```

---

## Users

### GET /users/me
Get current user profile.

### PATCH /users/me
Update profile.

**Request Body:**
```json
{
  "displayName": "New Name",
  "assistantPreferences": {
    "mode": "advisor",
    "verbosity": "detailed"
  }
}
```

---

## Projects

### GET /projects
List projects for current user.

### POST /projects
Create a new project.

**Request Body:**
```json
{
  "name": "My Project",
  "description": "Project description",
  "visibility": "private"
}
```

### GET /projects/:id
Get project details.

### GET /projects/:id/members
List project members.

### POST /projects/:id/members
Add member to project.

**Request Body:**
```json
{
  "userId": "uuid",
  "role": "collaborator"
}
```

---

## Chats

### GET /chats?projectId=xxx
List chats for a project.

### POST /chats
Create a new chat.

**Request Body:**
```json
{
  "type": "group_collab",
  "projectId": "uuid",
  "name": "Architecture Discussion"
}
```

### GET /chats/:id/messages
Get messages in a chat.

### POST /chats/:id/messages
Send a message.

**Request Body:**
```json
{
  "content": "I think we should use PostgreSQL here.",
  "replyTo": "uuid" // optional
}
```

### POST /chats/:id/intents
Create an intent checkpoint.

**Request Body:**
```json
{
  "statement": "Decide on database technology"
}
```

### POST /chats/:id/intents/:intentId/resolve
Resolve an intent with linked decision.

---

## Decisions

### GET /decisions?projectId=xxx
List decisions for a project.

### GET /decisions/search?projectId=xxx&q=xxx
Search decisions using full-text search.

### POST /decisions
Create a manual decision.

**Request Body:**
```json
{
  "projectId": "uuid",
  "statement": "We will use PostgreSQL for the main database",
  "rationale": "Best balance of reliability and features"
}
```

### GET /decisions/proposals
List pending proposals.

### POST /decisions/proposals/:id/approve
Approve a proposal → creates decision.

### POST /decisions/proposals/:id/reject
Reject a proposal → trains Neural Hub.

---

## Workshops

### GET /workshops?projectId=xxx
List workshops.

### POST /workshops
Create a workshop.

**Request Body:**
```json
{
  "projectId": "uuid",
  "title": "Q1 Architecture Review",
  "objective": "Review and approve system architecture",
  "scheduledStart": "2026-01-20T14:00:00Z",
  "scheduledEnd": "2026-01-20T15:30:00Z"
}
```

### POST /workshops/:id/start
Start the workshop.

### POST /workshops/:id/complete
Complete and generate summary.

### GET /workshops/:id/agenda
Get workshop agenda.

### POST /workshops/:id/agenda
Add agenda item.

### GET /workshops/:id/summary
Get generated summary with decisions and action items.

---

## Documents

### GET /documents?projectId=xxx
List documents.

**Query Parameters:**
- `status`: draft, in_review, approved, archived
- `docType`: general, adr, rfc, spec, meeting_notes, runbook, guide

### POST /documents
Create a document.

**Request Body:**
```json
{
  "projectId": "uuid",
  "title": "API Design Document",
  "docType": "spec"
}
```

### GET /documents/:id/sections
Get document sections.

### POST /documents/:id/sections
Add content section.

**Request Body:**
```json
{
  "content": "# Introduction\n\nThis document describes...",
  "sectionType": "text"
}
```

### POST /documents/:id/submit-review
Submit for review.

### POST /documents/:id/approve
Approve document (creates version snapshot).

### POST /documents/:id/sections/:sectionId/threads
Start inline discussion thread.

### POST /documents/:id/threads/:threadId/comments
Add comment to thread.

---

## Assistant

### POST /assistant/query
Query the intelligent assistant.

**Request Body:**
```json
{
  "query": "Why did we choose PostgreSQL over MongoDB?",
  "projectId": "uuid",
  "chatId": "uuid", // optional, for context
  "mode": "analyst" // optional: analyst, advisor, facilitator
}
```

**Response:**
```json
{
  "mode": "analyst",
  "answer": "Based on decision #abc123 from 3 days ago...",
  "sources": [
    { "type": "decision", "id": "abc123", "statement": "..." }
  ],
  "suggestions": [
    "Would you like me to compare PostgreSQL vs MongoDB features?"
  ]
}
```

### GET /assistant/classify?query=xxx
Classify a query to determine the best mode.

---

## Debug (Development Only)

### POST /debug/analyze
Analyze a message through Neural Hub without creating proposal.

**Request Body:**
```json
{
  "content": "Let's go with PostgreSQL for the database.",
  "projectId": "uuid"
}
```

**Response:**
```json
{
  "result": {
    "confidence": 0.78,
    "shouldPropose": true
  },
  "reasoning": {
    "signals": [...],
    "decisionRationale": "Proposing decision (78% confidence)..."
  }
}
```

### GET /debug/state/:projectId
Get current neural state for debugging.

### GET /debug/patterns
List all detection patterns.

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Human-readable error message"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - No permission |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## WebSocket Events

Connect to: `ws://localhost:3000`

### Subscribe to Chat
```json
{ "type": "subscribe", "chatId": "uuid" }
```

### Events Received
- `message.new` - New message in chat
- `message.edit` - Message edited
- `message.delete` - Message deleted
- `proposal.new` - New decision proposal
- `proposal.approved` - Proposal was approved
- `intent.created` - New intent checkpoint
- `workshop.started` - Workshop began
- `workshop.completed` - Workshop ended with summary
