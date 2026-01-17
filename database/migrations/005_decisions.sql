-- ============================================================================
-- SENTRY Database Schema - Migration 005: Decisions
-- ============================================================================

-- Decision proposals (pending confirmation)
CREATE TABLE IF NOT EXISTS decision_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  intent_id UUID REFERENCES chat_intents(id) ON DELETE SET NULL,
  statement TEXT NOT NULL,
  rationale TEXT,
  confidence DECIMAL(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  context JSONB DEFAULT '{}',
  proposed_by VARCHAR(20) DEFAULT 'system' CHECK (proposed_by IN ('system', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Decision records (confirmed decisions)
CREATE TABLE IF NOT EXISTS decision_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
  intent_id UUID REFERENCES chat_intents(id) ON DELETE SET NULL,
  statement TEXT NOT NULL,
  rationale TEXT,
  alternatives_considered TEXT[] DEFAULT '{}',
  assumptions TEXT[] DEFAULT '{}',
  open_questions TEXT[] DEFAULT '{}',
  confidence DECIMAL(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  context JSONB DEFAULT '{}',
  confirmed_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  participants UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deprecated BOOLEAN DEFAULT false,
  deprecated_at TIMESTAMP WITH TIME ZONE,
  superseded_by UUID REFERENCES decision_records(id) ON DELETE SET NULL
);

-- Decision tags (for categorization)
CREATE TABLE IF NOT EXISTS decision_tags (
  decision_id UUID NOT NULL REFERENCES decision_records(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  PRIMARY KEY (decision_id, tag)
);

-- Indexes
CREATE INDEX idx_proposals_chat ON decision_proposals(chat_id);
CREATE INDEX idx_proposals_status ON decision_proposals(status);
CREATE INDEX idx_proposals_created ON decision_proposals(created_at DESC);

CREATE INDEX idx_decisions_project ON decision_records(project_id);
CREATE INDEX idx_decisions_created ON decision_records(created_at DESC);
CREATE INDEX idx_decisions_search ON decision_records USING gin(to_tsvector('english', statement || ' ' || COALESCE(rationale, '')));
CREATE INDEX idx_decisions_not_deprecated ON decision_records(project_id) WHERE deprecated = false;
