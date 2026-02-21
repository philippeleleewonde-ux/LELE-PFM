-- LELE PFM Initial Schema
-- All 16 tables with complete structure, constraints, RLS, and indexes

-- 1. profiles
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  country TEXT DEFAULT 'FR',
  currency TEXT DEFAULT 'EUR',
  language TEXT DEFAULT 'fr',
  timezone TEXT DEFAULT 'Europe/Paris',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,

  CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT valid_currency CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT valid_language CHECK (language IN ('fr', 'en', 'es', 'de'))
);

COMMENT ON TABLE profiles IS 'User profiles with personal and preference information';
COMMENT ON COLUMN profiles.user_id IS 'Unique identifier for user';
COMMENT ON COLUMN profiles.email IS 'User email address (unique)';
COMMENT ON COLUMN profiles.currency IS 'ISO 4217 currency code';

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY profiles_delete_own ON profiles
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- 2. revenues
CREATE TABLE IF NOT EXISTS revenues (
  revenue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  frequency TEXT NOT NULL,
  source_type TEXT NOT NULL,
  is_regular BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT positive_amount CHECK (amount_cents > 0),
  CONSTRAINT valid_frequency CHECK (frequency IN ('Mensuel', 'Hebdomadaire', 'Annuel', 'Irrégulier')),
  CONSTRAINT valid_date_range CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

COMMENT ON TABLE revenues IS 'Income sources for each user';
COMMENT ON COLUMN revenues.amount_cents IS 'Amount stored in cents as INTEGER';
COMMENT ON COLUMN revenues.is_regular IS 'TRUE if revenue is recurring';

ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY revenues_select_own ON revenues
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY revenues_insert_own ON revenues
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY revenues_update_own ON revenues
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY revenues_delete_own ON revenues
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_revenues_user_id ON revenues(user_id);
CREATE INDEX idx_revenues_user_created ON revenues(user_id, created_at DESC);

-- 3. expenses
CREATE TABLE IF NOT EXISTS expenses (
  expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  category_code TEXT NOT NULL,
  frequency TEXT NOT NULL,
  is_fixed BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT positive_amount CHECK (amount_cents > 0),
  CONSTRAINT valid_category CHECK (category_code IN ('01', '02', '03', '04', '05', '06', '07', '08')),
  CONSTRAINT valid_frequency CHECK (frequency IN ('Mensuel', 'Hebdomadaire', 'Annuel', 'Irrégulier')),
  CONSTRAINT valid_date_range CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

COMMENT ON TABLE expenses IS 'Expense records organized by COICOP categories';
COMMENT ON COLUMN expenses.amount_cents IS 'Amount stored in cents as INTEGER';
COMMENT ON COLUMN expenses.category_code IS 'COICOP code (01-08)';
COMMENT ON COLUMN expenses.is_fixed IS 'TRUE for fixed/recurring expenses';

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY expenses_select_own ON expenses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY expenses_insert_own ON expenses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY expenses_update_own ON expenses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY expenses_delete_own ON expenses
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_category ON expenses(category_code);
CREATE INDEX idx_expenses_user_category ON expenses(user_id, category_code);

-- 4. financial_history
CREATE TABLE IF NOT EXISTS financial_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_income_cents INTEGER NOT NULL DEFAULT 0,
  total_expenses_cents INTEGER NOT NULL DEFAULT 0,
  total_savings_cents INTEGER,
  snapshot_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_period CHECK (period_start < period_end)
);

COMMENT ON TABLE financial_history IS 'Historical snapshots of financial data';
COMMENT ON COLUMN financial_history.total_income_cents IS 'Total income in period (cents)';
COMMENT ON COLUMN financial_history.total_expenses_cents IS 'Total expenses in period (cents)';
COMMENT ON COLUMN financial_history.snapshot_data IS 'JSON snapshot of full financial state';

ALTER TABLE financial_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY financial_history_select_own ON financial_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY financial_history_insert_own ON financial_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_financial_history_user ON financial_history(user_id);
CREATE INDEX idx_financial_history_period ON financial_history(user_id, period_start DESC);

-- 5. financial_commitments
CREATE TABLE IF NOT EXISTS financial_commitments (
  commitment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  category TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT positive_amount CHECK (amount_cents > 0),
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'cancelled'))
);

COMMENT ON TABLE financial_commitments IS 'Financial goals and commitments (loans, savings targets)';
COMMENT ON COLUMN financial_commitments.amount_cents IS 'Target amount in cents';
COMMENT ON COLUMN financial_commitments.due_date IS 'Target completion date';

ALTER TABLE financial_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY financial_commitments_select_own ON financial_commitments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY financial_commitments_insert_own ON financial_commitments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY financial_commitments_update_own ON financial_commitments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY financial_commitments_delete_own ON financial_commitments
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_financial_commitments_user ON financial_commitments(user_id);
CREATE INDEX idx_financial_commitments_due_date ON financial_commitments(due_date);

-- 6. risk_assessment
CREATE TABLE IF NOT EXISTS risk_assessment (
  assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  risk_level TEXT NOT NULL,
  income_stability_score NUMERIC(5, 2),
  expense_control_score NUMERIC(5, 2),
  emergency_fund_score NUMERIC(5, 2),
  debt_ratio NUMERIC(5, 2),
  savings_capacity NUMERIC(5, 2),
  assessment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_risk_level CHECK (risk_level IN ('Faible', 'Moyen', 'Élevé')),
  CONSTRAINT valid_scores CHECK (
    (income_stability_score IS NULL OR (income_stability_score >= 0 AND income_stability_score <= 100)) AND
    (expense_control_score IS NULL OR (expense_control_score >= 0 AND expense_control_score <= 100)) AND
    (emergency_fund_score IS NULL OR (emergency_fund_score >= 0 AND emergency_fund_score <= 100)) AND
    (debt_ratio IS NULL OR (debt_ratio >= 0 AND debt_ratio <= 100)) AND
    (savings_capacity IS NULL OR (savings_capacity >= 0 AND savings_capacity <= 100))
  )
);

COMMENT ON TABLE risk_assessment IS 'Risk assessment and financial health indicators';
COMMENT ON COLUMN risk_assessment.risk_level IS 'Overall risk classification';
COMMENT ON COLUMN risk_assessment.income_stability_score IS 'Score 0-100 for income stability';
COMMENT ON COLUMN risk_assessment.emergency_fund_score IS 'Score 0-100 for emergency preparedness';

ALTER TABLE risk_assessment ENABLE ROW LEVEL SECURITY;

CREATE POLICY risk_assessment_select_own ON risk_assessment
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY risk_assessment_insert_own ON risk_assessment
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY risk_assessment_update_own ON risk_assessment
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_risk_assessment_user ON risk_assessment(user_id);
CREATE INDEX idx_risk_assessment_date ON risk_assessment(assessment_date DESC);

-- 7. ekh_scores
CREATE TABLE IF NOT EXISTS ekh_scores (
  score_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  e_score NUMERIC(5, 2) NOT NULL,
  k_score NUMERIC(5, 2) NOT NULL,
  h_score NUMERIC(5, 2) NOT NULL,
  overall_ekh NUMERIC(5, 2) GENERATED ALWAYS AS ((e_score + k_score + h_score) / 3) STORED,
  measurement_date DATE NOT NULL,
  period_weeks INTEGER DEFAULT 4,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT positive_scores CHECK (e_score >= 0 AND k_score >= 0 AND h_score >= 0),
  CONSTRAINT max_scores CHECK (e_score <= 100 AND k_score <= 100 AND h_score <= 100)
);

COMMENT ON TABLE ekh_scores IS 'EKH (Épargne, Contrôle, Harmonie) scoring system';
COMMENT ON COLUMN ekh_scores.e_score IS 'Épargne (Savings) score 0-100';
COMMENT ON COLUMN ekh_scores.k_score IS 'Contrôle (Control) score 0-100';
COMMENT ON COLUMN ekh_scores.h_score IS 'Harmonie (Harmony) score 0-100';
COMMENT ON COLUMN ekh_scores.overall_ekh IS 'Calculated average of all three scores';

ALTER TABLE ekh_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY ekh_scores_select_own ON ekh_scores
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY ekh_scores_insert_own ON ekh_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ekh_scores_update_own ON ekh_scores
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ekh_scores_user ON ekh_scores(user_id);
CREATE INDEX idx_ekh_scores_date ON ekh_scores(measurement_date DESC);

-- 8. improvement_levers
CREATE TABLE IF NOT EXISTS improvement_levers (
  lever_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  impact_potential NUMERIC(5, 2),
  difficulty_level TEXT,
  implementation_status TEXT DEFAULT 'proposed',
  expected_savings_cents INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_category CHECK (category IN ('Épargne', 'Contrôle', 'Harmonie')),
  CONSTRAINT valid_difficulty CHECK (difficulty_level IN ('Facile', 'Moyen', 'Difficile')),
  CONSTRAINT valid_status CHECK (implementation_status IN ('proposed', 'in_progress', 'completed', 'abandoned')),
  CONSTRAINT valid_impact CHECK (impact_potential IS NULL OR (impact_potential >= 0 AND impact_potential <= 100))
);

COMMENT ON TABLE improvement_levers IS 'Recommended actions to improve financial health (EKH)';
COMMENT ON COLUMN improvement_levers.category IS 'Which EKH pillar this lever addresses';
COMMENT ON COLUMN improvement_levers.impact_potential IS 'Estimated impact 0-100 (%)';
COMMENT ON COLUMN improvement_levers.expected_savings_cents IS 'Estimated savings in cents';

ALTER TABLE improvement_levers ENABLE ROW LEVEL SECURITY;

CREATE POLICY improvement_levers_select_own ON improvement_levers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY improvement_levers_insert_own ON improvement_levers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY improvement_levers_update_own ON improvement_levers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY improvement_levers_delete_own ON improvement_levers
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_improvement_levers_user ON improvement_levers(user_id);
CREATE INDEX idx_improvement_levers_category ON improvement_levers(user_id, category);

-- 9. pfe_results
CREATE TABLE IF NOT EXISTS pfe_results (
  result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  calculation_date DATE NOT NULL,
  p1_amount_cents INTEGER,
  p2_amount_cents INTEGER,
  p3_amount_cents INTEGER,
  p4_amount_cents INTEGER,
  waterfall_valid BOOLEAN DEFAULT false,
  ekh_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT non_negative_amounts CHECK (
    (p1_amount_cents IS NULL OR p1_amount_cents >= 0) AND
    (p2_amount_cents IS NULL OR p2_amount_cents >= 0) AND
    (p3_amount_cents IS NULL OR p3_amount_cents >= 0) AND
    (p4_amount_cents IS NULL OR p4_amount_cents >= 0)
  )
);

COMMENT ON TABLE pfe_results IS 'Personal Finance Engine calculation results';
COMMENT ON COLUMN pfe_results.week_number IS 'ISO week number';
COMMENT ON COLUMN pfe_results.p1_amount_cents IS 'P1 (Essential) allocation in cents';
COMMENT ON COLUMN pfe_results.p2_amount_cents IS 'P2 (Variable) allocation in cents';
COMMENT ON COLUMN pfe_results.p3_amount_cents IS 'P3 (Unforeseen) allocation in cents';
COMMENT ON COLUMN pfe_results.p4_amount_cents IS 'P4 (Savings/Debt) allocation in cents';
COMMENT ON COLUMN pfe_results.waterfall_valid IS 'TRUE if P1+P2+P3+P4 = 100±1%';

ALTER TABLE pfe_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY pfe_results_select_own ON pfe_results
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY pfe_results_insert_own ON pfe_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY pfe_results_update_own ON pfe_results
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_pfe_results_user ON pfe_results(user_id);
CREATE INDEX idx_pfe_results_week ON pfe_results(user_id, week_number DESC);

-- 10. category_configs
CREATE TABLE IF NOT EXISTS category_configs (
  config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  poste_n1_code TEXT NOT NULL,
  label_n1 TEXT NOT NULL,
  f1 NUMERIC(5, 2) DEFAULT 0,
  f2 NUMERIC(5, 2) DEFAULT 0,
  f3 NUMERIC(5, 2) DEFAULT 0,
  flexibility_score NUMERIC(5, 2) GENERATED ALWAYS AS (((f1 + f2 + f3) / 63.0) * 100) STORED,
  custom_label TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_code CHECK (poste_n1_code IN ('01', '02', '03', '04', '05', '06', '07', '08')),
  CONSTRAINT valid_flexibility CHECK (f1 >= 0 AND f1 <= 21 AND f2 >= 0 AND f2 <= 21 AND f3 >= 0 AND f3 <= 21),
  CONSTRAINT unique_user_code UNIQUE (user_id, poste_n1_code)
);

COMMENT ON TABLE category_configs IS 'Category configuration with flexibility scoring';
COMMENT ON COLUMN category_configs.poste_n1_code IS 'COICOP code (01-08)';
COMMENT ON COLUMN category_configs.flexibility_score IS 'Calculated: (f1+f2+f3)/63*100';
COMMENT ON COLUMN category_configs.f1 IS 'Flexibility dimension 1 (0-21)';
COMMENT ON COLUMN category_configs.f2 IS 'Flexibility dimension 2 (0-21)';
COMMENT ON COLUMN category_configs.f3 IS 'Flexibility dimension 3 (0-21)';
COMMENT ON COLUMN category_configs.is_system IS 'TRUE for default system categories';

ALTER TABLE category_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY category_configs_select_own ON category_configs
  FOR SELECT
  USING (auth.uid() = user_id OR is_system = true);

CREATE POLICY category_configs_insert_own ON category_configs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY category_configs_update_own ON category_configs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_category_configs_user ON category_configs(user_id);
CREATE INDEX idx_category_configs_code ON category_configs(poste_n1_code);

-- 11. transactions
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  coicop TEXT NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  week_number INTEGER NOT NULL,
  is_reconciled BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_type CHECK (type IN ('Fixe', 'Variable', 'Imprévue', 'Épargne-Dette')),
  CONSTRAINT valid_coicop CHECK (coicop IN ('01', '02', '03', '04', '05', '06', '07', '08')),
  CONSTRAINT positive_amount CHECK (amount_cents > 0),
  CONSTRAINT no_ekh_type CHECK (type != 'EKH')
);

COMMENT ON TABLE transactions IS 'Individual transactions with strict type enforcement';
COMMENT ON COLUMN transactions.type IS 'Only: Fixe, Variable, Imprévue, Épargne-Dette (never EKH)';
COMMENT ON COLUMN transactions.amount_cents IS 'Amount in cents as INTEGER';
COMMENT ON COLUMN transactions.coicop IS 'COICOP code (01-08 only)';
COMMENT ON COLUMN transactions.week_number IS 'ISO week number for the transaction date';
COMMENT ON COLUMN transactions.is_reconciled IS 'TRUE if verified against bank statement';

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY transactions_select_own ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY transactions_insert_own ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY transactions_update_own ON transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY transactions_delete_own ON transactions
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_week ON transactions(user_id, week_number);
CREATE INDEX idx_transactions_coicop ON transactions(user_id, coicop);
CREATE INDEX idx_transactions_type ON transactions(user_id, type);

-- 12. weekly_performance
CREATE TABLE IF NOT EXISTS weekly_performance (
  performance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_income_cents INTEGER NOT NULL DEFAULT 0,
  total_expenses_cents INTEGER NOT NULL DEFAULT 0,
  p1_actual_cents INTEGER,
  p2_actual_cents INTEGER,
  p3_actual_cents INTEGER,
  p4_actual_cents INTEGER,
  p1_planned_cents INTEGER,
  p2_planned_cents INTEGER,
  p3_planned_cents INTEGER,
  p4_planned_cents INTEGER,
  performance_score NUMERIC(5, 2),
  locked BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT non_negative_amounts CHECK (
    total_income_cents >= 0 AND
    total_expenses_cents >= 0 AND
    (p1_actual_cents IS NULL OR p1_actual_cents >= 0) AND
    (p2_actual_cents IS NULL OR p2_actual_cents >= 0) AND
    (p3_actual_cents IS NULL OR p3_actual_cents >= 0) AND
    (p4_actual_cents IS NULL OR p4_actual_cents >= 0) AND
    (p1_planned_cents IS NULL OR p1_planned_cents >= 0) AND
    (p2_planned_cents IS NULL OR p2_planned_cents >= 0) AND
    (p3_planned_cents IS NULL OR p3_planned_cents >= 0) AND
    (p4_planned_cents IS NULL OR p4_planned_cents >= 0)
  ),
  CONSTRAINT valid_performance_score CHECK (performance_score IS NULL OR (performance_score >= 0 AND performance_score <= 100)),
  CONSTRAINT valid_week_dates CHECK (week_start_date < week_end_date)
);

COMMENT ON TABLE weekly_performance IS 'Weekly financial performance tracking and analysis';
COMMENT ON COLUMN weekly_performance.week_number IS 'ISO week number';
COMMENT ON COLUMN weekly_performance.performance_score IS 'Overall weekly performance score 0-100';
COMMENT ON COLUMN weekly_performance.locked IS 'TRUE if week is locked from editing';
COMMENT ON COLUMN weekly_performance.p1_actual_cents IS 'Actual P1 spending in cents';
COMMENT ON COLUMN weekly_performance.p1_planned_cents IS 'Planned P1 budget in cents';

ALTER TABLE weekly_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY weekly_performance_select_own ON weekly_performance
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY weekly_performance_insert_own ON weekly_performance
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY weekly_performance_update_own ON weekly_performance
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_weekly_performance_user ON weekly_performance(user_id);
CREATE INDEX idx_weekly_performance_week ON weekly_performance(user_id, week_number DESC);
CREATE INDEX idx_weekly_performance_locked ON weekly_performance(user_id, locked);

-- 13. distribution_config
CREATE TABLE IF NOT EXISTS distribution_config (
  config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  p1 NUMERIC(5, 2) NOT NULL DEFAULT 50,
  p2 NUMERIC(5, 2) NOT NULL DEFAULT 25,
  p3 NUMERIC(5, 2) NOT NULL DEFAULT 10,
  p4 NUMERIC(5, 2) NOT NULL DEFAULT 15,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT waterfall_sum_valid CHECK (
    (p1 + p2 + p3 + p4) BETWEEN 99 AND 101
  ),
  CONSTRAINT positive_percentages CHECK (
    p1 >= 0 AND p2 >= 0 AND p3 >= 0 AND p4 >= 0
  )
);

COMMENT ON TABLE distribution_config IS 'Waterfall distribution configuration (P1-P4)';
COMMENT ON COLUMN distribution_config.p1 IS 'Essential/Fixed percentage';
COMMENT ON COLUMN distribution_config.p2 IS 'Variable percentage';
COMMENT ON COLUMN distribution_config.p3 IS 'Unforeseen percentage';
COMMENT ON COLUMN distribution_config.p4 IS 'Savings/Debt percentage';
COMMENT ON CONSTRAINT waterfall_sum_valid ON distribution_config IS 'P1+P2+P3+P4 must equal 100±1%';

ALTER TABLE distribution_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY distribution_config_select_own ON distribution_config
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY distribution_config_insert_own ON distribution_config
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY distribution_config_update_own ON distribution_config
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_distribution_config_user ON distribution_config(user_id);
CREATE INDEX idx_distribution_config_active ON distribution_config(user_id, is_active);

-- 14. audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_action CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT'))
);

COMMENT ON TABLE audit_log IS 'Audit trail for compliance and security';
COMMENT ON COLUMN audit_log.action IS 'Type of action: CREATE, READ, UPDATE, DELETE, EXPORT, IMPORT';
COMMENT ON COLUMN audit_log.entity_type IS 'Type of entity affected (transactions, profile, etc.)';
COMMENT ON COLUMN audit_log.old_values IS 'Previous values before update (JSON)';
COMMENT ON COLUMN audit_log.new_values IS 'New values after update (JSON)';

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_select_own ON audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY audit_log_insert_own ON audit_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_date ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- 15. sync_queue
CREATE TABLE IF NOT EXISTS sync_queue (
  queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  payload JSONB,
  status TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_operation CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE', 'SYNC')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT non_negative_retry CHECK (retry_count >= 0)
);

COMMENT ON TABLE sync_queue IS 'Queue for offline-first synchronization';
COMMENT ON COLUMN sync_queue.operation IS 'Type of operation queued';
COMMENT ON COLUMN sync_queue.status IS 'Current status: pending, processing, completed, failed';
COMMENT ON COLUMN sync_queue.retry_count IS 'Number of failed attempts';

ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY sync_queue_select_own ON sync_queue
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY sync_queue_insert_own ON sync_queue
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY sync_queue_update_own ON sync_queue
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_sync_queue_user ON sync_queue(user_id);
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_sync_queue_created ON sync_queue(created_at DESC);

-- 16. notification_preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(user_id) ON DELETE CASCADE,
  email_weekly_summary BOOLEAN DEFAULT true,
  email_alerts BOOLEAN DEFAULT true,
  email_tips BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  push_weekly_summary BOOLEAN DEFAULT true,
  push_alerts BOOLEAN DEFAULT true,
  sms_alerts BOOLEAN DEFAULT false,
  preferred_email TEXT,
  preferred_phone TEXT,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'Europe/Paris',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_quiet_hours CHECK (quiet_hours_start IS NULL OR quiet_hours_end IS NULL OR quiet_hours_start < quiet_hours_end)
);

COMMENT ON TABLE notification_preferences IS 'User notification and communication preferences';
COMMENT ON COLUMN notification_preferences.email_weekly_summary IS 'Send weekly email summary';
COMMENT ON COLUMN notification_preferences.push_notifications IS 'Enable push notifications';
COMMENT ON COLUMN notification_preferences.quiet_hours_start IS 'Start time for notification quiet hours';
COMMENT ON COLUMN notification_preferences.quiet_hours_end IS 'End time for notification quiet hours';

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_preferences_select_own ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY notification_preferences_insert_own ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY notification_preferences_update_own ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
