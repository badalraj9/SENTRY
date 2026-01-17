-- ============================================================================
-- SENTRY Database Schema - Migration 009: Documents
-- ============================================================================

-- Documents: Living docs with sections and decision references
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Document metadata
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL,
  description TEXT,
  doc_type VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (
    doc_type IN ('general', 'adr', 'rfc', 'spec', 'meeting_notes', 'runbook', 'guide')
  ),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'in_review', 'approved', 'archived', 'deprecated')
  ),
  
  -- Versioning
  version INTEGER DEFAULT 1,
  
  -- Ownership
  created_by UUID NOT NULL REFERENCES users(id),
  last_edited_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Linked content
  linked_decisions UUID[] DEFAULT '{}',
  linked_workshops UUID[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(project_id, slug)
);

-- Document sections (structured content blocks)
CREATE TABLE IF NOT EXISTS document_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES document_sections(id) ON DELETE CASCADE,
  
  -- Section content
  title VARCHAR(200),
  content TEXT NOT NULL,
  section_type VARCHAR(50) DEFAULT 'text' CHECK (
    section_type IN ('text', 'code', 'decision_embed', 'diagram', 'table', 'callout')
  ),
  
  -- Ordering
  order_index INTEGER NOT NULL DEFAULT 0,
  depth INTEGER DEFAULT 0,
  
  -- Linked decisions (embedded in this section)
  linked_decisions UUID[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  last_edited_by UUID REFERENCES users(id)
);

-- Document version history
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  
  -- Snapshot of sections at this version
  sections_snapshot JSONB NOT NULL,
  
  -- Change info
  change_summary TEXT,
  changed_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(document_id, version)
);

-- Inline discussion threads (attached to sections)
CREATE TABLE IF NOT EXISTS document_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES document_sections(id) ON DELETE CASCADE,
  
  -- Thread metadata
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'wontfix')),
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Position within section (for inline comments)
  text_anchor TEXT,  -- The text being commented on
  anchor_start INTEGER,
  anchor_end INTEGER,
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thread comments
CREATE TABLE IF NOT EXISTS document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES document_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(doc_type);
CREATE INDEX idx_sections_document ON document_sections(document_id, order_index);
CREATE INDEX idx_sections_parent ON document_sections(parent_id);
CREATE INDEX idx_threads_section ON document_threads(section_id);
CREATE INDEX idx_comments_thread ON document_comments(thread_id);

-- Full-text search on documents
CREATE INDEX idx_documents_search ON documents 
  USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_sections_search ON document_sections 
  USING GIN(to_tsvector('english', COALESCE(title, '') || ' ' || content));
