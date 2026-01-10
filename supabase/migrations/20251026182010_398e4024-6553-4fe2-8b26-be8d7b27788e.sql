-- Table pour les scores IA bancaires
CREATE TABLE IF NOT EXISTS public.ai_banking_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  score_date DATE DEFAULT CURRENT_DATE,
  global_score INTEGER CHECK (global_score >= 0 AND global_score <= 100),
  risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  recommended_rate DECIMAL(5,2),
  ai_analysis JSONB DEFAULT '{}',
  confidence_level INTEGER CHECK (confidence_level >= 0 AND confidence_level <= 100),
  factors JSONB DEFAULT '[]',
  benchmark_position TEXT,
  module_scores JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_banking_scores_company ON ai_banking_scores(company_id);
CREATE INDEX IF NOT EXISTS idx_banking_scores_date ON ai_banking_scores(score_date DESC);

-- RLS policies
ALTER TABLE public.ai_banking_scores ENABLE ROW LEVEL SECURITY;

-- CEO et CONSULTANT peuvent voir les scores de leur entreprise
CREATE POLICY "CEO and CONSULTANT can view their company scores"
ON public.ai_banking_scores
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
  AND (
    has_role(auth.uid(), 'CEO'::app_role) OR 
    has_role(auth.uid(), 'CONSULTANT'::app_role)
  )
);

-- Banquiers avec accès peuvent voir les scores
CREATE POLICY "Bankers with access can view scores"
ON public.ai_banking_scores
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'BANQUIER'::app_role)
  AND EXISTS (
    SELECT 1 FROM banker_access_grants
    WHERE banker_user_id = auth.uid()
    AND banker_access_grants.company_id = ai_banking_scores.company_id
    AND is_active = true
  )
);

-- Système peut insérer les scores
CREATE POLICY "System can insert scores"
ON public.ai_banking_scores
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
  AND (
    has_role(auth.uid(), 'CEO'::app_role) OR 
    has_role(auth.uid(), 'CONSULTANT'::app_role)
  )
);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_ai_banking_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_banking_scores_updated_at
BEFORE UPDATE ON ai_banking_scores
FOR EACH ROW
EXECUTE FUNCTION update_ai_banking_scores_updated_at();

-- Table pour limites IA par plan
CREATE TABLE IF NOT EXISTS public.subscription_ai_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT NOT NULL UNIQUE CHECK (plan_type IN ('free', 'basic', 'silver', 'gold', 'enterprise')),
  ai_enabled BOOLEAN DEFAULT false,
  ai_calls_per_month INTEGER DEFAULT 0,
  advanced_analytics BOOLEAN DEFAULT false,
  custom_prompts BOOLEAN DEFAULT false,
  predictive_ai BOOLEAN DEFAULT false,
  banking_score BOOLEAN DEFAULT false,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Données initiales pour les plans
INSERT INTO subscription_ai_limits (plan_type, ai_enabled, ai_calls_per_month, advanced_analytics, custom_prompts, predictive_ai, banking_score, features)
VALUES 
  ('free', false, 0, false, false, false, false, '[]'),
  ('basic', false, 0, false, false, false, false, '[]'),
  ('silver', true, 100, false, false, true, false, '["Recommandations de base", "Analyse de tendances", "Suggestions d''amélioration"]'),
  ('gold', true, 1000, true, true, true, true, '["IA prédictive complète", "Analyses sectorielles", "Coaching personnalisé IA", "Score bancaire automatique", "Benchmarking IA"]'),
  ('enterprise', true, -1, true, true, true, true, '["IA illimitée", "Analyses personnalisées", "Support dédié IA", "Modèles custom"]')
ON CONFLICT (plan_type) DO NOTHING;

-- RLS pour limites IA
ALTER TABLE public.subscription_ai_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view AI limits"
ON public.subscription_ai_limits
FOR SELECT
TO authenticated
USING (true);