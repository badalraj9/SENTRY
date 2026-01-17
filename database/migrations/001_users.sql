-- ============================================================================
-- SENTRY Database Schema - Migration 001: Users
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  bio TEXT,
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'limited', 'private')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE
);

-- User profiles (derived/computed metrics)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  workshops_participated INTEGER DEFAULT 0,
  decisions_confirmed INTEGER DEFAULT 0,
  discussions_started INTEGER DEFAULT 0,
  trust_score DECIMAL(3,2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assistant preferences (personalization)
CREATE TABLE IF NOT EXISTS assistant_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  prefers_concise_summaries BOOLEAN DEFAULT true,
  capture_decisions_early BOOLEAN DEFAULT false,
  ignore_brainstorming_prompts BOOLEAN DEFAULT false,
  assistant_verbosity VARCHAR(20) DEFAULT 'balanced' CHECK (assistant_verbosity IN ('quiet', 'balanced', 'verbose')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_handle ON users(handle);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
