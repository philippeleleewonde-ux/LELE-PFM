-- ============================================================================
-- MODULE 5 — RISQUES PSYCHOSOCIAUX (RPS) TABLES
-- Tables: rps_surveys, rps_survey_responses, rps_access_keys
-- ============================================================================

-- Table des enquêtes RPS
CREATE TABLE IF NOT EXISTS rps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des réponses RPS
CREATE TABLE IF NOT EXISTS rps_survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES rps_surveys(id) ON DELETE CASCADE,
  responses JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des clés d'accès RPS
CREATE TABLE IF NOT EXISTS rps_access_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES rps_surveys(id) ON DELETE CASCADE,
  access_key TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_rps_surveys_company ON rps_surveys(company_id);
CREATE INDEX IF NOT EXISTS idx_rps_responses_survey ON rps_survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_rps_keys_survey ON rps_access_keys(survey_id);
CREATE INDEX IF NOT EXISTS idx_rps_keys_key ON rps_access_keys(access_key);

-- RLS
ALTER TABLE rps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE rps_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rps_access_keys ENABLE ROW LEVEL SECURITY;

-- Policies for rps_surveys
CREATE POLICY "Users can view company surveys" ON rps_surveys FOR SELECT USING (true);
CREATE POLICY "Admins can create surveys" ON rps_surveys FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update surveys" ON rps_surveys FOR UPDATE USING (true);
CREATE POLICY "Admins can delete surveys" ON rps_surveys FOR DELETE USING (true);

-- Policies for rps_survey_responses
CREATE POLICY "Users can view responses" ON rps_survey_responses FOR SELECT USING (true);
CREATE POLICY "Users can submit responses" ON rps_survey_responses FOR INSERT WITH CHECK (true);

-- Policies for rps_access_keys
CREATE POLICY "Users can validate keys" ON rps_access_keys FOR SELECT USING (true);
CREATE POLICY "Users can consume keys" ON rps_access_keys FOR UPDATE USING (true);
CREATE POLICY "Admins can create keys" ON rps_access_keys FOR INSERT WITH CHECK (true);
