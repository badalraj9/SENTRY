-- ============================================================================
-- SENTRY Database Schema - Migration 007: Sessions & API Keys
-- ============================================================================

-- User sessions (server-side session store)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  client_type VARCHAR(50) NOT NULL CHECK (client_type IN ('web', 'cli', 'mobile', 'api')),
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- API keys for CLI and integrations
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  prefix VARCHAR(10) NOT NULL,  -- First 8 chars for identification
  scopes TEXT[] DEFAULT '{}',   -- Allowed capabilities
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON user_sessions(refresh_token_hash) WHERE revoked = false;
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at) WHERE revoked = false;

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(prefix) WHERE revoked = false;
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE revoked = false;
