-- ============================================================================
-- SENTRY Database Schema - Migration 006: Neural States
-- ============================================================================

-- Neural states (per user × project)
CREATE TABLE IF NOT EXISTS neural_states (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  weights JSONB NOT NULL DEFAULT '{}',
  threshold DECIMAL(4,3) DEFAULT 0.750 CHECK (threshold >= 0.6 AND threshold <= 0.9),
  alpha INTEGER DEFAULT 1 CHECK (alpha >= 1),  -- Beta distribution confirmations
  beta INTEGER DEFAULT 1 CHECK (beta >= 1),    -- Beta distribution rejections
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);

-- Learning events log (for analysis and debugging)
CREATE TABLE IF NOT EXISTS learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES decision_proposals(id) ON DELETE SET NULL,
  outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('confirmed', 'rejected')),
  contributing_signals JSONB NOT NULL DEFAULT '[]',
  weight_deltas JSONB NOT NULL DEFAULT '{}',
  threshold_before DECIMAL(4,3),
  threshold_after DECIMAL(4,3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_neural_states_updated ON neural_states(updated_at);
CREATE INDEX idx_learning_events_user ON learning_events(user_id, created_at DESC);
CREATE INDEX idx_learning_events_project ON learning_events(project_id, created_at DESC);
