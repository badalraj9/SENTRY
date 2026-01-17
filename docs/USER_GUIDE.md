# SENTRY User Guide

> Getting started with SENTRY - Developer Collaboration OS

---

## What is SENTRY?

SENTRY is an intelligent collaboration system that helps development teams:

- **Capture decisions** automatically from conversations
- **Track intent** through discussion checkpoints
- **Search past decisions** with semantic search
- **Query an assistant** for project knowledge

---

## Quick Start

### 1. Register & Login

```bash
# Using CLI
sentry auth login
```

Or via API:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"secret","handle":"yourname"}'
```

### 2. Create a Project

```bash
sentry project create "My Project"
sentry project use <project-id>
```

### 3. Start Collaborating

Create chats, send messages, and SENTRY will automatically detect decisions!

---

## Core Concepts

### Decisions

A **decision** is a recorded choice with:
- **Statement**: What was decided
- **Rationale**: Why it was decided
- **Context**: Where it happened (chat, who, when)
- **Confidence**: How certain the system was

**Examples:**
- "We'll use PostgreSQL for the main database"
- "Frontend will be built with React"
- "API versioning will use URL prefixes"

### Proposals

Before becoming a decision, SENTRY creates a **proposal**. You can:
- ✅ **Approve** → Creates official decision
- ❌ **Reject** → SENTRY learns your preferences

### Intents

An **intent** is a checkpoint that marks:
- "We're discussing database options"
- "Need to decide on API design"

This helps SENTRY focus detection within context.

### Workshops

Time-boxed sessions for focused decision-making:
- Agenda items
- Participant management
- Auto-generated summaries
- Decision linking

---

## Using the CLI

### Authentication

```bash
# Login (creates API key)
sentry auth login

# Check status
sentry auth status

# Configure
sentry auth config --api-url http://localhost:3000
```

### Projects

```bash
# List projects
sentry project list

# Create new
sentry project create "New Project"

# Set default
sentry project use <id>

# Show details
sentry project show
```

### Decisions

```bash
# List decisions
sentry decision list

# Search
sentry decision search "database"

# Create manually
sentry decision create -s "Use PostgreSQL" -r "Best for our scale"

# View proposals
sentry decision proposals

# Approve/reject
sentry decision approve <proposal-id>
sentry decision reject <proposal-id>
```

### Assistant

```bash
# Ask a question
sentry ask "Why did we choose PostgreSQL?"

# Use specific mode
sentry ask --mode advisor "Should we switch to MongoDB?"
sentry ask --mode facilitator "Summarize our API discussion"
```

### JSON Output (for scripting)

```bash
sentry --json decision list
sentry --json project show
```

---

## Assistant Modes

### 🔍 Analyst Mode
Recalls past decisions and context.

**Triggers:**
- "What did we decide about..."
- "Why did we choose..."
- "When was it decided..."

**Example:**
```
> sentry ask "What's our database?"
[ANALYST]
Based on decision #a1b2c3 from Jan 12:
"We will use PostgreSQL for the main database"
Rationale: Best balance of reliability, features, and team familiarity.
```

### 💡 Advisor Mode
Provides recommendations based on project history.

**Triggers:**
- "Should we..."
- "What would you recommend..."
- "Best approach for..."

**Example:**
```
> sentry ask "Should we add Redis?"
[ADVISOR]
Based on your project patterns:
✓ You've mentioned caching needs 3 times
✓ Session management requires fast lookups
→ Recommendation: Yes, Redis would align with your architecture.
```

### 🤝 Facilitator Mode
Summarizes discussions and helps consensus.

**Triggers:**
- "Summarize..."
- "What are the open questions..."
- "Where do we stand on..."

---

## Workshops

### Create a Workshop

```bash
POST /workshops
{
  "projectId": "...",
  "title": "Q1 Architecture Review",
  "objective": "Review and finalize architecture decisions"
}
```

### Lifecycle

1. **Draft** → Define agenda
2. **Scheduled** → Set time, invite participants
3. **Active** → Live discussion
4. **Completed** → Summary generated

### Summary

After completion, SENTRY generates:
- Executive summary
- Key decisions made
- Action items
- Open questions
- Participation metrics

---

## Documents

Create living documentation with decision links:

### Create Document

```bash
POST /documents
{
  "projectId": "...",
  "title": "API Design Document",
  "docType": "spec"
}
```

### Document Types

| Type | Purpose |
|------|---------|
| `general` | Any documentation |
| `adr` | Architecture Decision Record |
| `rfc` | Request for Comments |
| `spec` | Technical specification |
| `meeting_notes` | Meeting documentation |
| `runbook` | Operational procedures |
| `guide` | How-to guides |

### Inline Discussions

Comment on specific sections:

```bash
POST /documents/:id/sections/:sectionId/threads
{
  "textAnchor": "the selected text",
  "anchorStart": 0,
  "anchorEnd": 20
}
```

---

## Best Practices

### For Better Detection

1. **Use clear language**: "We've decided to..." is better than "maybe we could..."
2. **Set intents**: Create checkpoints before important discussions
3. **Review proposals**: Feedback improves accuracy
4. **Use workshops**: For complex decisions, time-boxed sessions work best

### For Teams

1. **One project per repo**: Keep decisions scoped
2. **Link decisions to docs**: Create ADRs with embedded decisions
3. **Regular reviews**: Check decision confidence scores
4. **Deprecate old decisions**: Mark superseded decisions

---

## Troubleshooting

### Low Detection Confidence

- Check if message contains clear decision language
- Is there an active intent? (Higher confidence with context)
- Is the author a maintainer? (Authority boost)
- Chat type affects detection (workshops > collabs > direct)

### False Positives

- Reject proposals → trains your Neural Hub
- Threshold adjusts automatically over time
- Check `/debug/state/:projectId` for your tuning

### Missed Decisions

- Create decisions manually when missed
- Use more explicit language
- Consider creating an intent checkpoint

---

## Need Help?

- **API Docs**: `/docs/API.md`
- **Architecture**: `/docs/ARCHITECTURE.md`
- **Deployment**: `/docs/DEPLOYMENT.md`
