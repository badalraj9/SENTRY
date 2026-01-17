/**
 * SENTRY Shared Types
 * Core type definitions used across all packages
 */

// =============================================================================
// USER & IDENTITY
// =============================================================================

export interface User {
  id: string;
  handle: string;
  displayName: string | null;
  email: string;
  bio: string | null;
  visibility: UserVisibility;
  createdAt: Date;
  lastActive: Date | null;
}

export type UserVisibility = 'public' | 'limited' | 'private';

export interface UserProfile {
  userId: string;
  workshopsParticipated: number;
  decisionsConfirmed: number;
  discussionsStarted: number;
  trustScore: number | null;
  updatedAt: Date;
}

export interface AssistantPreferences {
  userId: string;
  prefersConciseSummaries: boolean;
  captureDecisionsEarly: boolean;
  ignoreBrainstormingPrompts: boolean;
  assistantVerbosity: AssistantVerbosity;
  updatedAt: Date;
}

export type AssistantVerbosity = 'quiet' | 'balanced' | 'verbose';

// =============================================================================
// PROJECTS
// =============================================================================

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  visibility: ProjectVisibility;
  createdAt: Date;
  updatedAt: Date | null;
  archived: boolean;
}

export type ProjectVisibility = 'public' | 'private' | 'invite_only';

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: Date;
}

export type ProjectRole = 'maintainer' | 'collaborator' | 'observer';

export type ProjectCapability =
  | 'project.view' | 'project.edit' | 'project.delete' | 'project.manage_members'
  | 'chat.view' | 'chat.send' | 'chat.edit' | 'chat.delete'
  | 'decision.view' | 'decision.create' | 'decision.approve' | 'decision.deprecate'
  | 'document.view' | 'document.edit' | 'document.approve' | 'document.comment'
  | 'workshop.create' | 'workshop.invite' | 'workshop.close'
  | 'file.view' | 'file.upload' | 'file.delete';

// =============================================================================
// CHATS & MESSAGES
// =============================================================================

export interface Chat {
  id: string;
  type: ChatType;
  projectId: string | null;
  name: string | null;
  visibility: ChatVisibility;
  createdAt: Date;
  archived: boolean;
}

export type ChatType = 'direct' | 'group_collab' | 'community' | 'workshop';
export type ChatVisibility = 'private' | 'invite_only' | 'public';

export interface ChatParticipant {
  chatId: string;
  userId: string;
  joinedAt: Date;
  leftAt: Date | null;
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  content: string;
  replyTo: string | null;
  createdAt: Date;
  editedAt: Date | null;
  deleted: boolean;
}

export interface MessageReaction {
  messageId: string;
  userId: string;
  reaction: string;
  createdAt: Date;
}

// =============================================================================
// INTENTS
// =============================================================================

export interface ChatIntent {
  id: string;
  chatId: string;
  statement: string;
  status: IntentStatus;
  createdBy: string;
  createdAt: Date;
  resolvedAt: Date | null;
  linkedDecisions: string[];
}

export type IntentStatus = 'active' | 'resolved' | 'abandoned';

// =============================================================================
// DECISIONS
// =============================================================================

export interface DecisionProposal {
  id: string;
  chatId: string;
  intentId: string | null;
  statement: string;
  rationale: string | null;
  confidence: number;
  context: DecisionContext;
  proposedBy: 'system' | 'user';
  createdAt: Date;
  status: ProposalStatus;
}

export type ProposalStatus = 'pending' | 'approved' | 'rejected';

export interface DecisionContext {
  messageIds: string[];
  participants: string[];
  signals?: SignalInfo[];
}

export interface SignalInfo {
  name: string;
  type: string;
  value: number;
  weight: number;
}

export interface DecisionRecord {
  id: string;
  projectId: string;
  chatId: string | null;
  intentId: string | null;
  statement: string;
  rationale: string | null;
  alternativesConsidered: string[];
  assumptions: string[];
  openQuestions: string[];
  confidence: number;
  context: DecisionContext;
  confirmedBy: string;
  participants: string[];
  createdAt: Date;
  deprecated: boolean;
  deprecatedAt: Date | null;
  supersededBy: string | null;
}

// =============================================================================
// NEURAL HUB
// =============================================================================

export interface NeuralState {
  userId: string;
  projectId: string;
  weights: Record<string, number>;
  threshold: number;
  alpha: number;  // Beta distribution - confirmations
  beta: number;   // Beta distribution - rejections
  updatedAt: Date;
}

export interface Signal {
  name: string;
  type: SignalType;
  value: number;
  baseWeight: number;
}

export type SignalType = 'linguistic' | 'structural' | 'contextual' | 'temporal';

export interface ProcessResult {
  confidence: number;
  shouldPropose: boolean;
  contributingSignals: Signal[];
  aggregatedScore: number;
}

// =============================================================================
// WEBSOCKET EVENTS
// =============================================================================

export type WSEventType =
  // Messages
  | 'message.new'
  | 'message.edit'
  | 'message.delete'
  | 'message.reaction'
  // Proposals & Decisions
  | 'proposal.new'
  | 'proposal.approved'
  | 'proposal.rejected'
  | 'decision.new'
  | 'decision.deprecated'
  // Intents
  | 'intent.set'
  | 'intent.resolved'
  | 'intent.abandoned'
  // Presence
  | 'user.joined'
  | 'user.left'
  | 'user.typing';

export interface WSEvent<T = unknown> {
  type: WSEventType;
  payload: T;
  timestamp: Date;
}

// =============================================================================
// API RESPONSES
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// =============================================================================
// AUTH
// =============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: string;
  handle: string;
  iat: number;
  exp: number;
}
