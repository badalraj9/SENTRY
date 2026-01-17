/**
 * Workshop Service
 * Handles workshop lifecycle, participants, and agenda management
 */

import { v4 as uuid } from 'uuid';
import { query, withTransaction } from '../db/pool.js';
import { emitToChat } from '../websocket/handlers.js';
import * as chatService from './chat.service.js';

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

  // Get workshop metrics
  const { rows: msgStats } = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM messages WHERE chat_id = $1`,
    [workshop.chatId]
  );
  const totalMessages = parseInt(msgStats[0]?.count || '0', 10);

  const participants = await getParticipants(workshopId);
  const participantCount = participants.length;

  // Get decisions made during workshop
  const { rows: decisions } = await query<{ id: string }>(
    `SELECT id FROM decision_records
     WHERE chat_id = $1 AND created_at >= $2 AND created_at <= COALESCE($3, NOW())`,
    [workshop.chatId, workshop.actualStart, workshop.actualEnd]
  );
  const keyDecisions = decisions.map(d => d.id);
  const decisionCount = keyDecisions.length;

  // Calculate duration
  const durationMinutes = workshop.actualStart && workshop.actualEnd
    ? Math.round((workshop.actualEnd.getTime() - workshop.actualStart.getTime()) / (1000 * 60))
    : 0;

  // Get agenda items for summary
  const agenda = await getAgenda(workshopId);
  const completedItems = agenda.filter(a => a.status === 'completed');

  // Generate executive summary
  const executiveSummary = generateExecutiveSummary(workshop, completedItems, decisionCount);

  // Extract open questions (simplified - would use NLP in production)
  const openQuestions = await extractOpenQuestions(workshop.chatId);

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
      JSON.stringify([]), // Action items would be extracted with NLP
      openQuestions,
      totalMessages,
      participantCount,
      decisionCount,
      durationMinutes,
    ]
  );

  return rows[0];
}

function generateExecutiveSummary(
  workshop: Workshop,
  completedItems: AgendaItem[],
  decisionCount: number
): string {
  const itemsList = completedItems.map(i => `- ${i.title}`).join('\n');
  
  return `
## Workshop: ${workshop.title}

**Objective:** ${workshop.objective}

### Topics Covered
${itemsList || '- No agenda items completed'}

### Outcomes
- **${decisionCount}** decisions were made
${decisionCount > 0 ? '- All decisions have been captured and linked' : '- No formal decisions were captured'}

### Next Steps
Review the decisions and action items below for follow-up.
`.trim();
}

async function extractOpenQuestions(chatId: string): Promise<string[]> {
  // Simplified: extract messages ending with '?' that weren't replied to
  const { rows } = await query<{ content: string }>(
    `SELECT content FROM messages
     WHERE chat_id = $1 AND content LIKE '%?' AND deleted = false
     ORDER BY created_at DESC LIMIT 5`,
    [chatId]
  );

  return rows
    .map(r => r.content.split('?')[0] + '?')
    .filter(q => q.length < 200);
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
