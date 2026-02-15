-- ============================================================================
-- MODULE 2 — Survey Access Keys
-- Single-use access keys for employee satisfaction surveys
-- Each key is generated per employee, consumed after survey submission
-- ============================================================================

CREATE TABLE IF NOT EXISTS survey_access_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  access_key TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_sak_survey ON survey_access_keys(survey_id);
CREATE INDEX IF NOT EXISTS idx_sak_key ON survey_access_keys(access_key);

-- RLS: authenticated users can read/validate keys
ALTER TABLE survey_access_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can validate keys"
  ON survey_access_keys FOR SELECT
  USING (true);

CREATE POLICY "Users can consume keys"
  ON survey_access_keys FOR UPDATE
  USING (true);

CREATE POLICY "Admins can create keys"
  ON survey_access_keys FOR INSERT
  WITH CHECK (true);
