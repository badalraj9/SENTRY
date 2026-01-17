-- ============================================================================
-- SENTRY Database Schema - Migration 004: Intents
-- ============================================================================

-- Chat intents (one active intent per chat)
CREATE TABLE IF NOT EXISTS chat_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'abandoned')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  linked_decisions UUID[] DEFAULT '{}'
);

-- Constraint: Only one active intent per chat
CREATE UNIQUE INDEX idx_one_active_intent_per_chat 
ON chat_intents(chat_id) 
WHERE status = 'active';

-- Indexes
CREATE INDEX idx_intents_chat ON chat_intents(chat_id);
CREATE INDEX idx_intents_status ON chat_intents(status);
CREATE INDEX idx_intents_created_by ON chat_intents(created_by);
