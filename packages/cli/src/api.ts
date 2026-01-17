/**
 * CLI API Client
 * Handles all HTTP requests to the SENTRY backend
 */

import { getApiUrl, getApiKey } from './config.js';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const apiUrl = getApiUrl();
  const apiKey = getApiKey();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || `HTTP ${response.status}` };
    }

    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Request failed' };
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

// =============================================================================
// API METHODS
// =============================================================================

// Auth
export async function login(email: string, password: string) {
  return api.post<{ accessToken: string; user: unknown }>('/auth/login', { email, password });
}

export async function createApiKey(name: string) {
  return api.post<{ apiKey: { id: string; prefix: string }; key: string }>('/auth/api-keys', { name });
}

// Projects
export async function getProjects() {
  return api.get<unknown[]>('/projects');
}

export async function getProject(id: string) {
  return api.get<unknown>(`/projects/${id}`);
}

export async function createProject(name: string, description?: string) {
  return api.post<unknown>('/projects', { name, description });
}

// Decisions
export async function getDecisions(projectId: string) {
  return api.get<unknown[]>(`/decisions?projectId=${projectId}`);
}

export async function searchDecisions(projectId: string, query: string) {
  return api.get<unknown[]>(`/decisions/search?projectId=${projectId}&q=${encodeURIComponent(query)}`);
}

export async function createDecision(projectId: string, statement: string, rationale?: string) {
  return api.post<unknown>('/decisions', { projectId, statement, rationale });
}

// Proposals
export async function getPendingProposals() {
  return api.get<unknown[]>('/decisions/proposals');
}

export async function approveProposal(proposalId: string, projectId: string) {
  return api.post<unknown>(`/decisions/proposals/${proposalId}/approve`, { projectId });
}

export async function rejectProposal(proposalId: string, projectId: string) {
  return api.post<void>(`/decisions/proposals/${proposalId}/reject`, { projectId });
}

// Chats
export async function getChats() {
  return api.get<unknown[]>('/chats');
}

export async function getChatMessages(chatId: string, limit = 20) {
  return api.get<unknown[]>(`/chats/${chatId}/messages?limit=${limit}`);
}

export async function sendMessage(chatId: string, content: string) {
  return api.post<unknown>(`/chats/${chatId}/messages`, { content });
}

// Intent
export async function getIntent(chatId: string) {
  return api.get<unknown>(`/chats/${chatId}/intent`);
}

export async function setIntent(chatId: string, statement: string) {
  return api.post<unknown>(`/chats/${chatId}/intent`, { statement });
}

// Assistant
export async function askAssistant(query: string, projectId: string, chatId?: string, mode?: string) {
  return api.post<unknown>('/assistant/query', { query, projectId, chatId, mode });
}
