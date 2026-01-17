/**
 * API Integration Tests
 * 
 * Tests for authentication, projects, chats, and decisions endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

// =============================================================================
// TEST SETUP
// =============================================================================

let authToken: string;
let testUserId: string;
let testProjectId: string;
let testChatId: string;

const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'testpassword123',
  handle: `testuser${Date.now()}`,
  displayName: 'Test User',
};

// =============================================================================
// AUTHENTICATION TESTS
// =============================================================================

describe('Authentication', () => {
  describe('POST /auth/register', () => {
    it('registers a new user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
      
      testUserId = res.body.user.id;
      authToken = res.body.accessToken;
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('validates required fields', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'invalid' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('rejects invalid password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
    });
  });
});

// =============================================================================
// PROJECTS TESTS
// =============================================================================

describe('Projects', () => {
  describe('POST /projects', () => {
    it('creates a new project', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project',
          description: 'A test project',
          visibility: 'private',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Test Project');
      
      testProjectId = res.body.id;
    });

    it('requires authentication', async () => {
      const res = await request(app)
        .post('/projects')
        .send({ name: 'No Auth Project' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /projects', () => {
    it('lists user projects', async () => {
      const res = await request(app)
        .get('/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /projects/:id', () => {
    it('returns project details', async () => {
      const res = await request(app)
        .get(`/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testProjectId);
    });

    it('returns 404 for non-existent project', async () => {
      const res = await request(app)
        .get('/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});

// =============================================================================
// CHATS TESTS
// =============================================================================

describe('Chats', () => {
  describe('POST /chats', () => {
    it('creates a new chat', async () => {
      const res = await request(app)
        .post('/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'group_collab',
          projectId: testProjectId,
          name: 'Test Chat',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Test Chat');
      expect(res.body.type).toBe('group_collab');
      
      testChatId = res.body.id;
    });
  });

  describe('GET /chats', () => {
    it('lists chats for project', async () => {
      const res = await request(app)
        .get(`/chats?projectId=${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Messages', () => {
    it('sends a message to chat', async () => {
      const res = await request(app)
        .post(`/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is a test message',
        });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('This is a test message');
    });

    it('gets chat messages', async () => {
      const res = await request(app)
        .get(`/chats/${testChatId}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('Intents', () => {
    it('creates an intent checkpoint', async () => {
      const res = await request(app)
        .post(`/chats/${testChatId}/intents`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          statement: 'Decide on database technology',
        });

      expect(res.status).toBe(201);
      expect(res.body.statement).toBe('Decide on database technology');
      expect(res.body.status).toBe('active');
    });
  });
});

// =============================================================================
// DECISIONS TESTS
// =============================================================================

describe('Decisions', () => {
  let testDecisionId: string;

  describe('POST /decisions', () => {
    it('creates a manual decision', async () => {
      const res = await request(app)
        .post('/decisions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          statement: 'We will use PostgreSQL',
          rationale: 'Best for our use case',
        });

      expect(res.status).toBe(201);
      expect(res.body.statement).toBe('We will use PostgreSQL');
      
      testDecisionId = res.body.id;
    });
  });

  describe('GET /decisions', () => {
    it('lists project decisions', async () => {
      const res = await request(app)
        .get(`/decisions?projectId=${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((d: any) => d.id === testDecisionId)).toBe(true);
    });
  });

  describe('GET /decisions/search', () => {
    it('searches decisions by text', async () => {
      const res = await request(app)
        .get(`/decisions/search?projectId=${testProjectId}&q=PostgreSQL`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// ASSISTANT TESTS
// =============================================================================

describe('Assistant', () => {
  describe('POST /assistant/query', () => {
    it('responds to analyst query', async () => {
      const res = await request(app)
        .post('/assistant/query')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'What decisions have we made?',
          projectId: testProjectId,
          mode: 'analyst',
        });

      expect(res.status).toBe(200);
      expect(res.body.mode).toBe('analyst');
      expect(res.body.answer).toBeDefined();
    });

    it('classifies query mode automatically', async () => {
      const res = await request(app)
        .get('/assistant/classify?query=Should%20we%20use%20React%3F')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(['analyst', 'advisor', 'facilitator']).toContain(res.body.mode);
    });
  });
});

// =============================================================================
// DEBUG TESTS
// =============================================================================

describe('Debug', () => {
  describe('POST /debug/analyze', () => {
    it('analyzes message without creating proposal', async () => {
      const res = await request(app)
        .post('/debug/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: "Let's go with PostgreSQL for the database.",
          projectId: testProjectId,
        });

      expect(res.status).toBe(200);
      expect(res.body.result).toBeDefined();
      expect(res.body.reasoning).toBeDefined();
      expect(typeof res.body.result.confidence).toBe('number');
    });
  });

  describe('GET /debug/patterns', () => {
    it('lists detection patterns', async () => {
      const res = await request(app)
        .get('/debug/patterns')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.linguistic).toBeDefined();
      expect(res.body.structural).toBeDefined();
    });
  });
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

describe('Health', () => {
  it('returns healthy status', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});
