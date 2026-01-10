-- Module 1: Performance Planning
CREATE TABLE performance_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  indicator_type TEXT NOT NULL CHECK (indicator_type IN ('absenteeism', 'quality', 'accidents', 'productivity', 'skills')),
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 53),
  year INTEGER NOT NULL CHECK (year >= 2024 AND year <= 2050),
  target_value DECIMAL(10,2),
  actual_value DECIMAL(10,2),
  cost_impact DECIMAL(12,2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_performance_indicators_company ON performance_indicators(company_id);
CREATE INDEX idx_performance_indicators_type ON performance_indicators(indicator_type);
CREATE INDEX idx_performance_indicators_period ON performance_indicators(year, week_number);

-- RLS for performance_indicators
ALTER TABLE performance_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company's performance indicators"
ON performance_indicators FOR SELECT
USING (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND (
    has_role(auth.uid(), 'CONSULTANT'::app_role) OR
    has_role(auth.uid(), 'CEO'::app_role)
  )
);

CREATE POLICY "Authorized users can insert performance indicators"
ON performance_indicators FOR INSERT
WITH CHECK (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND (
    has_role(auth.uid(), 'CONSULTANT'::app_role) OR
    has_role(auth.uid(), 'CEO'::app_role)
  )
);

CREATE POLICY "Authorized users can update performance indicators"
ON performance_indicators FOR UPDATE
USING (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND (
    has_role(auth.uid(), 'CONSULTANT'::app_role) OR
    has_role(auth.uid(), 'CEO'::app_role)
  )
);

-- Module 2: Employee Satisfaction Surveys
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  access_code TEXT UNIQUE NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_anonymous BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_surveys_company ON surveys(company_id);
CREATE INDEX idx_surveys_access_code ON surveys(access_code);
CREATE INDEX idx_surveys_active ON surveys(is_active);

-- RLS for surveys
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RH_MANAGER can manage surveys"
ON surveys FOR ALL
USING (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND has_role(auth.uid(), 'RH_MANAGER'::app_role)
);

CREATE POLICY "Anyone can view active surveys by access code"
ON surveys FOR SELECT
USING (is_active = true);

CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id);

-- RLS for survey_responses
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit survey responses"
ON survey_responses FOR INSERT
WITH CHECK (true);

CREATE POLICY "RH_MANAGER can view responses"
ON survey_responses FOR SELECT
USING (
  survey_id IN (
    SELECT id FROM surveys 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
  AND has_role(auth.uid(), 'RH_MANAGER'::app_role)
);

-- Module 3: Cost Savings
CREATE TABLE team_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  team_leader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 53),
  year INTEGER NOT NULL CHECK (year >= 2024 AND year <= 2050),
  performance_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  cost_savings DECIMAL(12,2),
  notes TEXT,
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_performance_company ON team_performance(company_id);
CREATE INDEX idx_team_performance_leader ON team_performance(team_leader_id);
CREATE INDEX idx_team_performance_period ON team_performance(year, week_number);

-- RLS for team_performance
ALTER TABLE team_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "TEAM_LEADER can manage their team's performance"
ON team_performance FOR ALL
USING (
  team_leader_id = auth.uid()
  AND has_role(auth.uid(), 'TEAM_LEADER'::app_role)
);

CREATE POLICY "CEO and CONSULTANT can view all team performance"
ON team_performance FOR SELECT
USING (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND (
    has_role(auth.uid(), 'CEO'::app_role) OR
    has_role(auth.uid(), 'CONSULTANT'::app_role)
  )
);

CREATE POLICY "CEO and CONSULTANT can update team performance"
ON team_performance FOR UPDATE
USING (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND (
    has_role(auth.uid(), 'CEO'::app_role) OR
    has_role(auth.uid(), 'CONSULTANT'::app_role)
  )
);

-- Module 4: Performance Cards
CREATE TABLE performance_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department TEXT,
  team_name TEXT,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'quarterly', 'annual')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  ranking_position INTEGER,
  total_points DECIMAL(10,2),
  achievements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_performance_cards_company ON performance_cards(company_id);
CREATE INDEX idx_performance_cards_user ON performance_cards(user_id);
CREATE INDEX idx_performance_cards_period ON performance_cards(period_start, period_end);
CREATE INDEX idx_performance_cards_ranking ON performance_cards(ranking_position);

-- RLS for performance_cards
ALTER TABLE performance_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own performance card"
ON performance_cards FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "TEAM_LEADER can view their team's performance cards"
ON performance_cards FOR SELECT
USING (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND has_role(auth.uid(), 'TEAM_LEADER'::app_role)
);

CREATE POLICY "CEO and CONSULTANT can view all performance cards"
ON performance_cards FOR SELECT
USING (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND (
    has_role(auth.uid(), 'CEO'::app_role) OR
    has_role(auth.uid(), 'CONSULTANT'::app_role)
  )
);

CREATE POLICY "Authorized users can insert performance cards"
ON performance_cards FOR INSERT
WITH CHECK (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND (
    has_role(auth.uid(), 'CEO'::app_role) OR
    has_role(auth.uid(), 'CONSULTANT'::app_role) OR
    has_role(auth.uid(), 'RH_MANAGER'::app_role) OR
    has_role(auth.uid(), 'TEAM_LEADER'::app_role)
  )
);

CREATE POLICY "Authorized users can update performance cards"
ON performance_cards FOR UPDATE
USING (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND (
    has_role(auth.uid(), 'CEO'::app_role) OR
    has_role(auth.uid(), 'CONSULTANT'::app_role) OR
    has_role(auth.uid(), 'RH_MANAGER'::app_role) OR
    has_role(auth.uid(), 'TEAM_LEADER'::app_role)
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_performance_indicators_updated_at
BEFORE UPDATE ON performance_indicators
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_surveys_updated_at
BEFORE UPDATE ON surveys
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_team_performance_updated_at
BEFORE UPDATE ON team_performance
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_performance_cards_updated_at
BEFORE UPDATE ON performance_cards
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();