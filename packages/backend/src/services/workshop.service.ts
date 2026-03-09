/**
 * Workshop Service
 * Handles workshop lifecycle, participants, and agenda management
 */

import { v4 as uuid } from 'uuid';
import { query, withTransaction } from '../db/pool.js';
import { emitToChat } from '../websocket/handlers.js';
import * as chatService from './chat.service.js';
import { semanticEngine } from '../intelligence/semantic-engine.js';

// =============================================================================
// TYPES
// =============================================================================

export type WorkshopStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
export type ParticipantRole = 'facilitator' | 'presenter' | 'participant' | 'observer';
export type AgendaStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface Workshop {
  id: string;
  projectId: string;
  chatId: string;
  title: string;
  objective: string;
  status: WorkshopStatus;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  actualStart: Date | null;
  actualEnd: Date | null;
  createdBy: string;
  facilitatorId: string | null;
  maxParticipants: number;
  autoCaptureDecisions: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkshopParticipant {
  workshopId: string;
  userId: string;
  role: ParticipantRole;
  invitedAt: Date;
  joinedAt: Date | null;
  leftAt: Date | null;
}

export interface AgendaItem {
  id: string;
  workshopId: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  presenterId: string | null;
  orderIndex: number;
  status: AgendaStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  linkedDecisions: string[];
  createdAt: Date;
}

export interface WorkshopSummary {
  id: string;
  workshopId: string;
  executiveSummary: string;
  keyDecisions: string[];
  actionItems: ActionItem[];
  openQuestions: string[];
  totalMessages: number;
  participantCount: number;
  decisionCount: number;
  durationMinutes: number;
  generatedAt: Date;
  generatedBy: string;
}

export interface ActionItem {
  description: string;
  assignee?: string;
  dueDate?: string;
}

// =============================================================================
// WORKSHOP CRUD
// =============================================================================

export interface CreateWorkshopInput {
  projectId: string;
  title: string;
  objective: string;
  createdBy: string;
  facilitatorId?: string;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  maxParticipants?: number;
}

export async function createWorkshop(input: CreateWorkshopInput): Promise<Workshop> {
  const id = uuid();

  // Create associated chat for the workshop
  const chat = await chatService.createChat({
    type: 'workshop',
    projectId: input.projectId,
    name: input.title,
    creatorId: input.createdBy,
    visibility: 'invite_only',
  });

  const { rows } = await query<Workshop>(
    `INSERT INTO workshops (
      id, project_id, chat_id, title, objective, created_by, facilitator_id,
      scheduled_start, scheduled_end, max_participants
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, project_id as "projectId", chat_id as "chatId", title, objective,
               status, scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
               actual_start as "actualStart", actual_end as "actualEnd",
               created_by as "createdBy", facilitator_id as "facilitatorId",
               max_participants as "maxParticipants", auto_capture_decisions as "autoCaptureDecisions",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [
      id,
      input.projectId,
      chat.id,
      input.title,
      input.objective,
      input.createdBy,
      input.facilitatorId || input.createdBy,
      input.scheduledStart || null,
      input.scheduledEnd || null,
      input.maxParticipants || 20,
    ]
  );

  // Add creator as facilitator
  await addParticipant(id, input.createdBy, 'facilitator');

  return rows[0];
}

export async function getWorkshopById(id: string): Promise<Workshop | null> {
  const { rows } = await query<Workshop>(
    `SELECT id, project_id as "projectId", chat_id as "chatId", title, objective,
            status, scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
            actual_start as "actualStart", actual_end as "actualEnd",
            created_by as "createdBy", facilitator_id as "facilitatorId",
            max_participants as "maxParticipants", auto_capture_decisions as "autoCaptureDecisions",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM workshops WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function getWorkshopsByProject(projectId: string): Promise<Workshop[]> {
  const { rows } = await query<Workshop>(
    `SELECT id, project_id as "projectId", chat_id as "chatId", title, objective,
            status, scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
            actual_start as "actualStart", actual_end as "actualEnd",
            created_by as "createdBy", facilitator_id as "facilitatorId",
            max_participants as "maxParticipants", auto_capture_decisions as "autoCaptureDecisions",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM workshops WHERE project_id = $1
     ORDER BY created_at DESC`,
    [projectId]
  );
  return rows;
}

// =============================================================================
// WORKSHOP LIFECYCLE
// =============================================================================

export async function scheduleWorkshop(
  id: string,
  scheduledStart: Date,
  scheduledEnd: Date
): Promise<Workshop | null> {
  const { rows } = await query<Workshop>(
    `UPDATE workshops
     SET status = 'scheduled', scheduled_start = $2, scheduled_end = $3, updated_at = NOW()
     WHERE id = $1 AND status = 'draft'
     RETURNING id, project_id as "projectId", chat_id as "chatId", title, objective,
               status, scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
               actual_start as "actualStart", actual_end as "actualEnd",
               created_by as "createdBy", facilitator_id as "facilitatorId",
               max_participants as "maxParticipants", auto_capture_decisions as "autoCaptureDecisions",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [id, scheduledStart, scheduledEnd]
  );

  const workshop = rows[0];
  if (workshop) {
    await emitToChat(workshop.chatId, 'workshop.scheduled', workshop);
  }

  return workshop || null;
}

export async function startWorkshop(id: string): Promise<Workshop | null> {
  const { rows } = await query<Workshop>(
    `UPDATE workshops
     SET status = 'active', actual_start = NOW(), updated_at = NOW()
     WHERE id = $1 AND status IN ('draft', 'scheduled', 'paused')
     RETURNING id, project_id as "projectId", chat_id as "chatId", title, objective,
               status, scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
               actual_start as "actualStart", actual_end as "actualEnd",
               created_by as "createdBy", facilitator_id as "facilitatorId",
               max_participants as "maxParticipants", auto_capture_decisions as "autoCaptureDecisions",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [id]
  );

  const workshop = rows[0];
  if (workshop) {
    await emitToChat(workshop.chatId, 'workshop.started', workshop);
  }

  return workshop || null;
}

export async function pauseWorkshop(id: string): Promise<Workshop | null> {
  const { rows } = await query<Workshop>(
    `UPDATE workshops SET status = 'paused', updated_at = NOW()
     WHERE id = $1 AND status = 'active'
     RETURNING id, project_id as "projectId", chat_id as "chatId", title, objective,
               status, scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
               actual_start as "actualStart", actual_end as "actualEnd",
               created_by as "createdBy", facilitator_id as "facilitatorId",
               max_participants as "maxParticipants", auto_capture_decisions as "autoCaptureDecisions",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [id]
  );

  const workshop = rows[0];
  if (workshop) {
    await emitToChat(workshop.chatId, 'workshop.paused', workshop);
  }

  return workshop || null;
}

export async function completeWorkshop(id: string): Promise<Workshop | null> {
  const { rows } = await query<Workshop>(
    `UPDATE workshops
     SET status = 'completed', actual_end = NOW(), updated_at = NOW()
     WHERE id = $1 AND status IN ('active', 'paused')
     RETURNING id, project_id as "projectId", chat_id as "chatId", title, objective,
               status, scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
               actual_start as "actualStart", actual_end as "actualEnd",
               created_by as "createdBy", facilitator_id as "facilitatorId",
               max_participants as "maxParticipants", auto_capture_decisions as "autoCaptureDecisions",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [id]
  );

  const workshop = rows[0];
  if (workshop) {
    await emitToChat(workshop.chatId, 'workshop.completed', workshop);
    // Generate summary asynchronously
    generateWorkshopSummary(id).catch(console.error);
  }

  return workshop || null;
}

export async function cancelWorkshop(id: string): Promise<Workshop | null> {
  const { rows } = await query<Workshop>(
    `UPDATE workshops SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1 AND status NOT IN ('completed', 'cancelled')
     RETURNING id, project_id as "projectId", chat_id as "chatId", title, objective,
               status, scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
               actual_start as "actualStart", actual_end as "actualEnd",
               created_by as "createdBy", facilitator_id as "facilitatorId",
               max_participants as "maxParticipants", auto_capture_decisions as "autoCaptureDecisions",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [id]
  );

  return rows[0] || null;
}

// =============================================================================
// PARTICIPANTS
// =============================================================================

export async function addParticipant(
  workshopId: string,
  userId: string,
  role: ParticipantRole = 'participant'
): Promise<WorkshopParticipant> {
  const { rows } = await query<WorkshopParticipant>(
    `INSERT INTO workshop_participants (workshop_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (workshop_id, user_id) DO UPDATE SET role = EXCLUDED.role
     RETURNING workshop_id as "workshopId", user_id as "userId", role,
               invited_at as "invitedAt", joined_at as "joinedAt", left_at as "leftAt"`,
    [workshopId, userId, role]
  );

  // Also add to chat
  const workshop = await getWorkshopById(workshopId);
  if (workshop) {
    await chatService.addChatParticipant(workshop.chatId, userId);
  }

  return rows[0];
}

export async function joinWorkshop(workshopId: string, userId: string): Promise<void> {
  await query(
    `UPDATE workshop_participants SET joined_at = NOW()
     WHERE workshop_id = $1 AND user_id = $2`,
    [workshopId, userId]
  );
}

export async function leaveWorkshop(workshopId: string, userId: string): Promise<void> {
  await query(
    `UPDATE workshop_participants SET left_at = NOW()
     WHERE workshop_id = $1 AND user_id = $2`,
    [workshopId, userId]
  );
}

export async function getParticipants(workshopId: string): Promise<WorkshopParticipant[]> {
  const { rows } = await query<WorkshopParticipant>(
    `SELECT workshop_id as "workshopId", user_id as "userId", role,
            invited_at as "invitedAt", joined_at as "joinedAt", left_at as "leftAt"
     FROM workshop_participants WHERE workshop_id = $1 AND left_at IS NULL`,
    [workshopId]
  );
  return rows;
}

// =============================================================================
// AGENDA
// =============================================================================

export async function addAgendaItem(
  workshopId: string,
  title: string,
  description?: string,
  durationMinutes = 15,
  presenterId?: string
): Promise<AgendaItem> {
  const id = uuid();

  // Get next order index
  const { rows: orderRows } = await query<{ max: number }>(
    `SELECT COALESCE(MAX(order_index), -1) + 1 as max FROM workshop_agenda WHERE workshop_id = $1`,
    [workshopId]
  );
  const orderIndex = orderRows[0]?.max || 0;

  const { rows } = await query<AgendaItem>(
    `INSERT INTO workshop_agenda (id, workshop_id, title, description, duration_minutes, presenter_id, order_index)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, workshop_id as "workshopId", title, description, duration_minutes as "durationMinutes",
               presenter_id as "presenterId", order_index as "orderIndex", status,
               started_at as "startedAt", completed_at as "completedAt",
               linked_decisions as "linkedDecisions", created_at as "createdAt"`,
    [id, workshopId, title, description || null, durationMinutes, presenterId || null, orderIndex]
  );

  return rows[0];
}

export async function getAgenda(workshopId: string): Promise<AgendaItem[]> {
  const { rows } = await query<AgendaItem>(
    `SELECT id, workshop_id as "workshopId", title, description, duration_minutes as "durationMinutes",
            presenter_id as "presenterId", order_index as "orderIndex", status,
            started_at as "startedAt", completed_at as "completedAt",
            linked_decisions as "linkedDecisions", created_at as "createdAt"
     FROM workshop_agenda WHERE workshop_id = $1
     ORDER BY order_index`,
    [workshopId]
  );
  return rows;
}

export async function startAgendaItem(itemId: string): Promise<AgendaItem | null> {
  const { rows } = await query<AgendaItem>(
    `UPDATE workshop_agenda SET status = 'in_progress', started_at = NOW()
     WHERE id = $1 AND status = 'pending'
     RETURNING id, workshop_id as "workshopId", title, description, duration_minutes as "durationMinutes",
               presenter_id as "presenterId", order_index as "orderIndex", status,
               started_at as "startedAt", completed_at as "completedAt",
               linked_decisions as "linkedDecisions", created_at as "createdAt"`,
    [itemId]
  );
  return rows[0] || null;
}

export async function completeAgendaItem(itemId: string, linkedDecisions?: string[]): Promise<AgendaItem | null> {
  const { rows } = await query<AgendaItem>(
    `UPDATE workshop_agenda
     SET status = 'completed', completed_at = NOW(), linked_decisions = COALESCE($2, linked_decisions)
     WHERE id = $1
     RETURNING id, workshop_id as "workshopId", title, description, duration_minutes as "durationMinutes",
               presenter_id as "presenterId", order_index as "orderIndex", status,
               started_at as "startedAt", completed_at as "completedAt",
               linked_decisions as "linkedDecisions", created_at as "createdAt"`,
    [itemId, linkedDecisions || null]
  );
  return rows[0] || null;
}

// =============================================================================
// SUMMARY GENERATION
// =============================================================================

export async function generateWorkshopSummary(workshopId: string): Promise<WorkshopSummary | null> {
  const workshop = await getWorkshopById(workshopId);
  if (!workshop) return null;

  const chatId = workshop.chatId;

  const { rows: msgStats } = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM messages WHERE chat_id = $1`,
    [chatId]
  );
  const totalMessages = parseInt(msgStats[0]?.count || '0', 10);

  const participants = await getParticipants(workshopId);
  const participantCount = participants.length;

  const { rows: decisions } = await query<{
    id: string;
    statement: string;
    rationale: string | null;
  }>(
    `SELECT id, statement, rationale FROM decision_records
     WHERE chat_id = $1 AND created_at >= $2 AND created_at <= COALESCE($3, NOW())`,
    [chatId, workshop.actualStart, workshop.actualEnd]
  );
  const keyDecisions = decisions.map(d => d.id);
  const decisionCount = keyDecisions.length;

  const durationMinutes = workshop.actualStart && workshop.actualEnd
    ? Math.round((workshop.actualEnd.getTime() - workshop.actualStart.getTime()) / (1000 * 60))
    : 0;

  const agenda = await getAgenda(workshopId);
  const completedItems = agenda.filter(a => a.status === 'completed');

  const messages = await query<{ id: string; content: string; user_id: string }>(
    `SELECT id, content, user_id FROM messages WHERE chat_id = $1 AND deleted = false ORDER BY created_at`,
    [chatId]
  );
  const messageList = messages.rows;
  const actionItems = extractActionItems(messageList);
  const openQuestions = extractOpenQuestionsSmart(messageList);
  const keywords = extractWorkshopKeywords(messageList, decisions);

  const executiveSummary = generateExecutiveSummaryV2(
    workshop,
    completedItems,
    decisions,
    actionItems,
    participantCount,
    durationMinutes
  );

  const id = uuid();
  const { rows } = await query<WorkshopSummary>(
    `INSERT INTO workshop_summaries (
      id, workshop_id, executive_summary, key_decisions, action_items, open_questions,
      total_messages, participant_count, decision_count, duration_minutes
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (workshop_id) DO UPDATE SET
       executive_summary = EXCLUDED.executive_summary,
       key_decisions = EXCLUDED.key_decisions,
       total_messages = EXCLUDED.total_messages,
       participant_count = EXCLUDED.participant_count,
       decision_count = EXCLUDED.decision_count,
       duration_minutes = EXCLUDED.duration_minutes,
       generated_at = NOW()
     RETURNING id, workshop_id as "workshopId", executive_summary as "executiveSummary",
               key_decisions as "keyDecisions", action_items as "actionItems",
               open_questions as "openQuestions", total_messages as "totalMessages",
               participant_count as "participantCount", decision_count as "decisionCount",
               duration_minutes as "durationMinutes", generated_at as "generatedAt",
               generated_by as "generatedBy"`,
    [
      id,
      workshopId,
      executiveSummary,
      keyDecisions,
      JSON.stringify(actionItems),
      openQuestions,
      totalMessages,
      participantCount,
      decisionCount,
      durationMinutes,
    ]
  );

  return rows[0];
}

interface ExtractedAction {
  description: string;
  assignee?: string;
}

function extractActionItems(messages: Array<{ id: string; content: string; user_id: string }>): ExtractedAction[] {
  const actions: ExtractedAction[] = [];
  const seen = new Set<string>();
  const patterns = [
    { regex: /\b(i'?ll|I'?ll)\s+(.+?)(?:\.|!|$)/gi, hasAssignee: false },
    { regex: /\b(we'?ll|we\s+will)\s+(.+?)(?:\.|!|$)/gi, hasAssignee: false },
    { regex: /\b(going\sto)\s+(.+?)(?:\.|!|$)/gi, hasAssignee: false },
    { regex: /\b(should)\s+(.+?)(?:\.|!|$)/gi, hasAssignee: false },
    { regex: /\b(todo|to-do|action\s+item):?\s*(.+?)(?:\.|!|$)/gi, hasAssignee: false },
  ];

  for (const msg of messages) {
    const content = msg.content.trim();
    for (const { regex } of patterns) {
      const matches = content.matchAll(regex);
      for (const match of matches) {
        let description = (match[2] || match[1] || '').trim();
        if (description && description.length > 3 && description.length < 150) {
          const key = description.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            actions.push({ description: capitalizeFirst(description) });
          }
        }
      }
    }
  }
  return actions.slice(0, 10);
}

function extractOpenQuestionsSmart(messages: Array<{ id: string; content: string }>): string[] {
  const questionMap = new Map<string, number>();
  for (const msg of messages) {
    if (msg.content.includes('?')) {
      const question = msg.content.split('?')[0].replace(/^(who|what|where|when|why|how|should|could|would)\s+/i, '').trim();
      if (question.length > 5 && question.length < 150) {
        const existing = questionMap.get(question.toLowerCase()) || 0;
        questionMap.set(question.toLowerCase(), existing + 1);
      }
    }
  }
  return [...questionMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([q]) => capitalizeFirst(q) + '?');
}

function extractWorkshopKeywords(
  messages: Array<{ content: string }>,
  decisions: Array<{ statement: string }>
): string[] {
  const allText = [...messages.map(m => m.content), ...decisions.map(d => d.statement)].join(' ');
  const keywords = semanticEngine.extractKeywords([allText], { maxKeywords: 8 });
  return keywords.map(k => k.term);
}

function generateExecutiveSummaryV2(
  workshop: Workshop,
  completedItems: AgendaItem[],
  decisions: Array<{ id: string; statement: string; rationale: string | null }>,
  actionItems: ExtractedAction[],
  participantCount: number,
  durationMinutes: number
): string {
  const lines: string[] = [];
  lines.push('## Workshop Summary: ' + workshop.title);
  lines.push('');
  lines.push('**Objective:** ' + workshop.objective);
  lines.push('');
  lines.push('### Overview');
  lines.push('- Duration: ' + durationMinutes + ' minutes');
  lines.push('- Participants: ' + participantCount);
  lines.push('- Decisions Made: ' + decisions.length);
  lines.push('- Action Items: ' + actionItems.length);
  lines.push('');

  if (completedItems.length > 0) {
    lines.push('### Agenda Completed');
    for (const item of completedItems) {
      const status = item.status === 'completed' ? '[DONE]' : '[PENDING]';
      lines.push('- ' + status + ' ' + item.title);
    }
    lines.push('');
  }

  if (decisions.length > 0) {
    lines.push('### Decisions');
    for (const decision of decisions.slice(0, 5)) {
      lines.push('- ' + decision.statement.slice(0, 80));
    }
    if (decisions.length > 5) {
      lines.push('- ...and ' + (decisions.length - 5) + ' more');
    }
    lines.push('');
  }

  if (actionItems.length > 0) {
    lines.push('### Action Items');
    for (const action of actionItems.slice(0, 5)) {
      lines.push('- ' + action.description);
    }
    if (actionItems.length > 5) {
      lines.push('- ...and ' + (actionItems.length - 5) + ' more');
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('Generated on ' + new Date().toISOString().split('T')[0]);
  return lines.join('\n');
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function getWorkshopSummary(workshopId: string): Promise<WorkshopSummary | null> {
  const { rows } = await query<WorkshopSummary>(
    `SELECT id, workshop_id as "workshopId", executive_summary as "executiveSummary",
            key_decisions as "keyDecisions", action_items as "actionItems",
            open_questions as "openQuestions", total_messages as "totalMessages",
            participant_count as "participantCount", decision_count as "decisionCount",
            duration_minutes as "durationMinutes", generated_at as "generatedAt",
            generated_by as "generatedBy"
     FROM workshop_summaries WHERE workshop_id = $1`,
    [workshopId]
  );
  return rows[0] || null;
}
