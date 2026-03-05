# API Quick Reference

> SENTRY Developer Collaboration OS - Essential API endpoints and usage

---

## Base URLs

```
Development: http://localhost:3000
Production:  https://api.sentry.dev
```

---

## Core Endpoints

### Authentication

```http
POST   /auth/login           # User login
POST   /auth/register        # User registration
POST   /auth/refresh         # Refresh access token
DELETE /auth/logout          # Logout user
```

### Users

```http
GET    /users/me             # Current user profile
PATCH  /users/me             # Update profile
GET    /users/:id            # Get user by ID
GET    /users/:id/profile    # User statistics
```

### Projects

```http
GET    /projects             # List projects
POST   /projects             # Create project
GET    /projects/:id         # Get project details
PATCH  /projects/:id         # Update project
DELETE /projects/:id         # Delete project
GET    /projects/:id/members # Project members
POST   /projects/:id/members # Add member
```

### Chats & Messages

```http
GET    /chats                # List accessible chats
POST   /chats                # Create new chat
GET    /chats/:id            # Get chat details
POST   /chats/:id/messages   # Send message
GET    /chats/:id/messages   # Get message history
```

### Decisions

```http
GET    /decisions            # List decisions
POST   /decisions            # Create decision
GET    /decisions/search     # Search decisions
GET    /decisions/:id        # Get decision details
```

### Neural Hub

```http
POST   /neural-hub/process   # Process message through Neural Hub
GET    /neural-hub/state     # Get neural state
PATCH  /neural-hub/weights   # Update weights
POST   /neural-hub/feedback  # Provide feedback
```

---

## WebSocket Events

### Client → Server

```javascript
{ type: 'subscribe', channels: ['chat:123', 'decisions'] }
{ type: 'message.send', chat_id: '123', content: 'Hello' }
{ type: 'typing.start', chat_id: '123' }
{ type: 'typing.stop', chat_id: '123' }
```

### Server → Client

```javascript
{ type: 'message.new', chat_id: '123', message: {...} }
{ type: 'decision.detected', proposal: {...} }
{ type: 'decision.confirmed', decision: {...} }
{ type: 'user.typing', chat_id: '123', user_id: '456' }
{ type: 'user.online', users: ['456', '789'] }
```

---

## Common Usage Patterns

### 1. Send Message & Detect Decision

```javascript
// Send message
const response = await fetch("/chats/123/messages", {
  method: "POST",
  headers: { Authorization: "Bearer <token>" },
  body: JSON.stringify({ content: "Let's use Redis for caching" }),
});

// WebSocket will emit decision events
socket.on("decision.detected", (proposal) => {
  console.log("Decision detected:", proposal);
  // Show UI for confirmation
});
```

### 2. Search Past Decisions

```javascript
const decisions = await fetch("/decisions/search", {
  method: "POST",
  headers: { Authorization: "Bearer <token>" },
  body: JSON.stringify({
    query: "database",
    project_id: "proj_123",
    limit: 10,
  }),
});
```

### 3. Get Neural Hub State

```javascript
const state = await fetch("/neural-hub/state", {
  headers: { Authorization: "Bearer <token>" },
});

// Returns weights, threshold, accuracy metrics
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-21T12:00:00Z",
    "request_id": "req_123"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": { "resource_id": "123" }
  },
  "meta": {
    "timestamp": "2026-01-21T12:00:00Z",
    "request_id": "req_123"
  }
}
```

---

## Rate Limits

| Endpoint  | Limit      | Window   |
| --------- | ---------- | -------- |
| Messages  | 100/minute | Per user |
| Decisions | 50/minute  | Per user |
| Search    | 20/minute  | Per user |
| Auth      | 5/minute   | Per IP   |

---

For complete API documentation, see [API.md](./API.md)
