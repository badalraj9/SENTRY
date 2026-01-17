/**
 * Assistant Service
 * Implements the Analyst, Advisor, and Facilitator modes
 */

import type { DecisionRecord, ChatIntent, Message } from '@sentry/shared';
import * as decisionService from './decision.service.js';
import * as intentService from './intent.service.js';
import * as messageService from './message.service.js';
import * as chatService from './chat.service.js';

// =============================================================================
// TYPES
// =============================================================================

export type AssistantMode = 'analyst' | 'advisor' | 'facilitator';

export interface AssistantQuery {
  query: string;
  projectId: string;
  chatId?: string;
  mode?: AssistantMode;
}

export interface AssistantResponse {
  mode: AssistantMode;
  answer: string;
  sources: AssistantSource[];
  suggestions?: string[];
}

export interface AssistantSource {
  type: 'decision' | 'message' | 'intent';
  id: string;
  statement: string;
  relevance: number;
}

// =============================================================================
// QUERY CLASSIFICATION
// =============================================================================

const QUERY_PATTERNS = {
  analyst: [
    /\b(why|when|who|what)\s+(did|was|were|decided|agreed|chose)\b/i,
    /\b(show|list|find|search)\s+(decisions?|history)\b/i,
    /\b(what|which)\s+(decisions?|choices?)\b/i,
    /\bprevious(ly)?\b/i,
    /\brecall\b/i,
  ],
  advisor: [
    /\b(should|could|would|might)\s+(we|i|you)\b/i,
    /\b(recommend|suggest|advise)\b/i,
    /\b(best|better|optimal)\s+(way|approach|option)\b/i,
    /\b(how|what)\s+(should|could)\b/i,
    /\bpros?\s*(and|&|,)\s*cons?\b/i,
  ],
  facilitator: [
    /\b(summarize|summary|recap)\b/i,
    /\b(next\s+steps?|action\s+items?)\b/i,
    /\b(everyone|all)\s+(agreed?|aligned?)\b/i,
    /\bwrap\s*up\b/i,
    /\bconclusion\b/i,
  ],
};

export function classifyQuery(query: string): AssistantMode {
  for (const [mode, patterns] of Object.entries(QUERY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        return mode as AssistantMode;
      }
    }
  }
  return 'analyst'; // Default to analyst mode
}

// =============================================================================
// ANALYST MODE - Decision Recall
// =============================================================================

async function handleAnalystQuery(
  query: string,
  projectId: string
): Promise<AssistantResponse> {
  // Search for relevant decisions
  const decisions = await decisionService.searchDecisions(projectId, query, 5);

  if (decisions.length === 0) {
    return {
      mode: 'analyst',
      answer: `I couldn't find any decisions matching "${query}". Try rephrasing or check if the topic was discussed.`,
      sources: [],
      suggestions: [
        'Try broader search terms',
        'Check recent discussions',
        'The decision might not have been captured yet',
      ],
    };
  }

  // Build response
  const decisionsList = decisions
    .map((d, i) => `${i + 1}. **${d.statement}** (${formatDate(d.createdAt)})`)
    .join('\n');

  const answer = `Found ${decisions.length} relevant decision(s):\n\n${decisionsList}`;

  const sources: AssistantSource[] = decisions.map(d => ({
    type: 'decision',
    id: d.id,
    statement: d.statement,
    relevance: 1.0, // Simplified - would calculate actual relevance
  }));

  return {
    mode: 'analyst',
    answer,
    sources,
  };
}

// =============================================================================
// ADVISOR MODE - Recommendations
// =============================================================================

async function handleAdvisorQuery(
  query: string,
  projectId: string,
  chatId?: string
): Promise<AssistantResponse> {
  // Find related previous decisions
  const relatedDecisions = await decisionService.searchDecisions(projectId, query, 3);

  // Get active intent if in a chat
  let activeIntent: ChatIntent | null = null;
  if (chatId) {
    activeIntent = await intentService.getActiveIntent(chatId);
  }

  // Build contextual advice
  let advice = '';
  const suggestions: string[] = [];

  if (relatedDecisions.length > 0) {
    advice += `Based on previous decisions:\n\n`;
    for (const d of relatedDecisions) {
      advice += `• Previously decided: "${d.statement}"\n`;
      if (d.rationale) {
        advice += `  Rationale: ${d.rationale}\n`;
      }
    }
    advice += '\n';
    suggestions.push('Consider if context has changed since these decisions');
  }

  if (activeIntent) {
    advice += `The current intent is: "${activeIntent.statement}"\n\n`;
    suggestions.push('Ensure any decision aligns with the stated intent');
  }

  if (!advice) {
    advice = `No prior decisions found on this topic. Consider:\n`;
    advice += `• Documenting assumptions before deciding\n`;
    advice += `• Identifying stakeholders who should weigh in\n`;
    advice += `• Defining success criteria\n`;
  }

  const sources: AssistantSource[] = relatedDecisions.map(d => ({
    type: 'decision',
    id: d.id,
    statement: d.statement,
    relevance: 0.8,
  }));

  if (activeIntent) {
    sources.unshift({
      type: 'intent',
      id: activeIntent.id,
      statement: activeIntent.statement,
      relevance: 1.0,
    });
  }

  return {
    mode: 'advisor',
    answer: advice,
    sources,
    suggestions,
  };
}

// =============================================================================
// FACILITATOR MODE - Summarization
// =============================================================================

async function handleFacilitatorQuery(
  query: string,
  projectId: string,
  chatId?: string
): Promise<AssistantResponse> {
  if (!chatId) {
    return {
      mode: 'facilitator',
      answer: 'Facilitator mode works best within a chat context. Please specify a chat.',
      sources: [],
    };
  }

  // Get recent messages
  const messages = await messageService.getMessagesByChat(chatId, { limit: 50 });

  // Get active intent
  const activeIntent = await intentService.getActiveIntent(chatId);

  // Get decisions made in this chat
  const decisions = await decisionService.getDecisionsByProject(projectId, { limit: 10 });
  const chatDecisions = decisions.filter(d => d.chatId === chatId);

  // Build summary
  let summary = '';
  const suggestions: string[] = [];

  if (activeIntent) {
    summary += `**Current Intent:** ${activeIntent.statement}\n\n`;
  }

  if (chatDecisions.length > 0) {
    summary += `**Decisions Made (${chatDecisions.length}):**\n`;
    for (const d of chatDecisions) {
      summary += `• ${d.statement}\n`;
    }
    summary += '\n';
  } else {
    summary += `**No decisions captured yet.**\n\n`;
    suggestions.push('Consider capturing key agreements as decisions');
  }

  // Simple message analysis
  const participantCount = new Set(messages.map(m => m.userId)).size;
  summary += `**Discussion Stats:**\n`;
  summary += `• ${messages.length} messages from ${participantCount} participants\n`;

  // Check if there are open questions
  const questionMessages = messages.filter(m => m.content.includes('?'));
  if (questionMessages.length > 0) {
    summary += `• ${questionMessages.length} questions asked\n`;
    suggestions.push('Address open questions before concluding');
  }

  const sources: AssistantSource[] = chatDecisions.map(d => ({
    type: 'decision',
    id: d.id,
    statement: d.statement,
    relevance: 1.0,
  }));

  return {
    mode: 'facilitator',
    answer: summary,
    sources,
    suggestions,
  };
}

// =============================================================================
// MAIN QUERY HANDLER
// =============================================================================

export async function processQuery(input: AssistantQuery): Promise<AssistantResponse> {
  const mode = input.mode || classifyQuery(input.query);

  switch (mode) {
    case 'analyst':
      return handleAnalystQuery(input.query, input.projectId);
    case 'advisor':
      return handleAdvisorQuery(input.query, input.projectId, input.chatId);
    case 'facilitator':
      return handleFacilitatorQuery(input.query, input.projectId, input.chatId);
    default:
      return handleAnalystQuery(input.query, input.projectId);
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return d.toLocaleDateString();
}
