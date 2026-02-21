-- ============================================================================
-- MODULE 2 — SURVEY SCORING SNAPSHOTS
-- Stores computed scoring results per survey for trends/evolution tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS survey_scoring_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  global_score NUMERIC,
  theme_scores JSONB,
  dc_scores JSONB,
  by_department JSONB,
  participation_rate NUMERIC,
  response_count INTEGER,
  enps_score NUMERIC,
  question_correlations JSONB,
  UNIQUE(survey_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_scoring_snapshots_survey ON survey_scoring_snapshots(survey_id);
CREATE INDEX IF NOT EXISTS idx_scoring_snapshots_company ON survey_scoring_snapshots(company_id);
CREATE INDEX IF NOT EXISTS idx_scoring_snapshots_computed ON survey_scoring_snapshots(computed_at);

-- RLS
ALTER TABLE survey_scoring_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view scoring snapshots" ON survey_scoring_snapshots FOR SELECT USING (true);
CREATE POLICY "Users can create scoring snapshots" ON survey_scoring_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update scoring snapshots" ON survey_scoring_snapshots FOR UPDATE USING (true);
