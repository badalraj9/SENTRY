-- ============================================================================
-- SENTRY Database Schema - Migration 008: Workshops
-- ============================================================================

-- Workshops: Time-boxed collaborative sessions for decision-making
CREATE TABLE IF NOT EXISTS workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  
  -- Workshop metadata
  title VARCHAR(200) NOT NULL,
  objective TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')
  ),
  
  -- Scheduling
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  
  -- Ownership
  created_by UUID NOT NULL REFERENCES users(id),
  facilitator_id UUID REFERENCES users(id),
  
  -- Configuration
  max_participants INTEGER DEFAULT 20,
  auto_capture_decisions BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workshop participants (beyond chat participants)
CREATE TABLE IF NOT EXISTS workshop_participants (
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'participant' CHECK (
    role IN ('facilitator', 'presenter', 'participant', 'observer')
  ),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (workshop_id, user_id)
);

-- Workshop agenda items
CREATE TABLE IF NOT EXISTS workshop_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 15,
  presenter_id UUID REFERENCES users(id),
  order_index INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_progress', 'completed', 'skipped')
  ),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  linked_decisions UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workshop summaries (generated at close)
CREATE TABLE IF NOT EXISTS workshop_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL UNIQUE REFERENCES workshops(id) ON DELETE CASCADE,
  
  -- Summary content
  executive_summary TEXT NOT NULL,
  key_decisions UUID[] DEFAULT '{}',
  action_items JSONB DEFAULT '[]',
  open_questions TEXT[] DEFAULT '{}',
  
  -- Metrics
  total_messages INTEGER DEFAULT 0,
  participant_count INTEGER DEFAULT 0,
  decision_count INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  
  -- Generation metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by VARCHAR(50) DEFAULT 'system' -- 'system' or user_id who edited
);

-- Indexes
CREATE INDEX idx_workshops_project ON workshops(project_id);
CREATE INDEX idx_workshops_status ON workshops(status);
CREATE INDEX idx_workshops_facilitator ON workshops(facilitator_id);
CREATE INDEX idx_workshop_agenda_order ON workshop_agenda(workshop_id, order_index);
