-- ============================================================================
-- RPS SCORING SNAPSHOTS + DATE COLUMNS ON rps_surveys
-- Enables trends tracking for Module 5 (Psychosocial Risks)
-- ============================================================================

-- 1. Add date columns to rps_surveys for campaign calendar
ALTER TABLE rps_surveys ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE rps_surveys ADD COLUMN IF NOT EXISTS end_date DATE;

-- 2. Create RPS scoring snapshots table
CREATE TABLE IF NOT EXISTS rps_scoring_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES rps_surveys(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  global_score NUMERIC,
  axis_scores JSONB,          -- {axis1: 2.3, axis2: 3.1, ..., axis6: 2.8}
  dr_scores JSONB,            -- {DR1: 2.5, DR2: 3.0, ..., DR6: 2.7}
  by_department JSONB,        -- [{name, globalScore, axisScores, responseCount, participationRate}]
  participation_rate NUMERIC,
  response_count INTEGER,
  enps_score NUMERIC,
  question_correlations JSONB, -- {A1Q1: 0.72, A1Q2: 0.45, ...}
  CONSTRAINT rps_scoring_snapshots_survey_unique UNIQUE (survey_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_rps_snapshots_survey ON rps_scoring_snapshots(survey_id);
CREATE INDEX IF NOT EXISTS idx_rps_snapshots_company ON rps_scoring_snapshots(company_id);

-- 4. RLS
ALTER TABLE rps_scoring_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view RPS snapshots" ON rps_scoring_snapshots FOR SELECT USING (true);
CREATE POLICY "Users can insert RPS snapshots" ON rps_scoring_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update RPS snapshots" ON rps_scoring_snapshots FOR UPDATE USING (true);
