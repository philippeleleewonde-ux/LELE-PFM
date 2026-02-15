-- ============================================
-- LELE AI Module - Tables & RLS Policies
-- Migration: 2026-02-08
-- ============================================

-- 1. Cache des réponses IA
CREATE TABLE IF NOT EXISTS ai_response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  response TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT,
  module_context TEXT,
  language TEXT DEFAULT 'fr',
  tokens_used INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_cache_key ON ai_response_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON ai_response_cache(expires_at);

-- 2. Insights pré-calculés (batch nocturne)
CREATE TABLE IF NOT EXISTS ai_precomputed_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  role TEXT NOT NULL,
  content JSONB NOT NULL,
  language TEXT DEFAULT 'fr',
  valid_until TIMESTAMPTZ NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_insights_user ON ai_precomputed_insights(user_id, insight_type);
CREATE INDEX idx_ai_insights_company ON ai_precomputed_insights(company_id, role);
CREATE INDEX idx_ai_insights_valid ON ai_precomputed_insights(valid_until);

-- 3. Préférences utilisateur IA
CREATE TABLE IF NOT EXISTS ai_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_language TEXT DEFAULT 'fr',
  nudges_enabled BOOLEAN DEFAULT true,
  morning_brief_enabled BOOLEAN DEFAULT true,
  ai_tone TEXT DEFAULT 'professional' CHECK (ai_tone IN ('professional', 'friendly', 'concise')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_prefs_user ON ai_user_preferences(user_id);

-- 4. Log des nudges envoyés
CREATE TABLE IF NOT EXISTS ai_nudge_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nudge_type TEXT NOT NULL,
  nudge_hash TEXT NOT NULL,
  was_clicked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_nudge_user ON ai_nudge_log(user_id, nudge_hash);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_precomputed_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_nudge_log ENABLE ROW LEVEL SECURITY;

-- Cache : accessible par les utilisateurs de la même entreprise
CREATE POLICY "ai_cache_select" ON ai_response_cache
  FOR SELECT USING (
    company_id IN (
      SELECT (raw_user_meta_data->>'company_id')::uuid
      FROM auth.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "ai_cache_insert" ON ai_response_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "ai_cache_delete" ON ai_response_cache
  FOR DELETE USING (true);

-- Insights : l'utilisateur voit ses propres insights
CREATE POLICY "ai_insights_select" ON ai_precomputed_insights
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "ai_insights_update" ON ai_precomputed_insights
  FOR UPDATE USING (user_id = auth.uid());

-- Préférences : l'utilisateur gère ses propres préférences
CREATE POLICY "ai_prefs_select" ON ai_user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "ai_prefs_insert" ON ai_user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_prefs_update" ON ai_user_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- Nudge log : l'utilisateur voit ses propres nudges
CREATE POLICY "ai_nudge_select" ON ai_nudge_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "ai_nudge_insert" ON ai_nudge_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_nudge_update" ON ai_nudge_log
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- Trigger updated_at pour ai_user_preferences
-- ============================================

CREATE OR REPLACE FUNCTION update_ai_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_prefs_updated_at
  BEFORE UPDATE ON ai_user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_prefs_updated_at();
