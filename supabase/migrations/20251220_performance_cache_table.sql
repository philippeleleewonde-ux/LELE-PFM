-- ============================================
-- MIGRATION: Table de cache des performances calculées
-- Date: 2025-12-20
-- But: Stocker les résultats pré-calculés pour affichage instantané
-- ============================================

-- Table pour stocker les résultats de performance par employé/indicateur
CREATE TABLE IF NOT EXISTS module3_performance_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES module3_team_members(id) ON DELETE CASCADE,
  business_line_id UUID NOT NULL REFERENCES business_lines(id) ON DELETE CASCADE,
  indicator_key TEXT NOT NULL CHECK (indicator_key IN ('abs', 'qd', 'oa', 'ddp', 'ekh')),

  -- Résultats pré-calculés (valeurs en devise de la company)
  ppr_prevues DECIMAL(15,4) DEFAULT 0,
  economies_realisees DECIMAL(15,4) DEFAULT 0,
  pertes_constatees DECIMAL(15,4) DEFAULT 0,
  temps_calcul DECIMAL(10,4) DEFAULT 0,
  frais_collectes DECIMAL(15,4) DEFAULT 0,
  score_financier DECIMAL(15,4) DEFAULT 0,

  -- Primes calculées
  prev_prime DECIMAL(15,4) DEFAULT 0,
  prev_treso DECIMAL(15,4) DEFAULT 0,
  real_prime DECIMAL(15,4) DEFAULT 0,
  real_treso DECIMAL(15,4) DEFAULT 0,

  -- Pourcentages
  contribution_pct DECIMAL(8,4) DEFAULT 0,
  pertes_pct DECIMAL(8,4) DEFAULT 0,

  -- Métadonnées de calcul
  fiscal_week INT NOT NULL,
  fiscal_year INT NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  calculation_version INT DEFAULT 1,

  -- Contrainte d'unicité: un seul enregistrement par employee/indicator/semaine
  UNIQUE(company_id, employee_id, indicator_key, fiscal_week, fiscal_year)
);

-- Table pour stocker les totaux agrégés par ligne d'activité
CREATE TABLE IF NOT EXISTS module3_performance_totals_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  business_line_id UUID REFERENCES business_lines(id) ON DELETE CASCADE, -- NULL = GRAND TOTAL
  indicator_key TEXT NOT NULL CHECK (indicator_key IN ('abs', 'qd', 'oa', 'ddp', 'ekh', 'all')),

  -- Totaux agrégés
  total_ppr_prevues DECIMAL(15,4) DEFAULT 0,
  total_economies DECIMAL(15,4) DEFAULT 0,
  total_pertes DECIMAL(15,4) DEFAULT 0,
  total_prev_prime DECIMAL(15,4) DEFAULT 0,
  total_prev_treso DECIMAL(15,4) DEFAULT 0,
  total_real_prime DECIMAL(15,4) DEFAULT 0,
  total_real_treso DECIMAL(15,4) DEFAULT 0,

  -- Statistiques
  employee_count INT DEFAULT 0,
  contribution_pct DECIMAL(8,4) DEFAULT 0,

  -- Métadonnées
  fiscal_week INT NOT NULL,
  fiscal_year INT NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte d'unicité
  UNIQUE(company_id, business_line_id, indicator_key, fiscal_week, fiscal_year)
);

-- Index pour requêtes rapides
CREATE INDEX IF NOT EXISTS idx_perf_cache_company_week
  ON module3_performance_cache(company_id, fiscal_week, fiscal_year);

CREATE INDEX IF NOT EXISTS idx_perf_cache_business_line
  ON module3_performance_cache(business_line_id, indicator_key);

CREATE INDEX IF NOT EXISTS idx_perf_totals_company_week
  ON module3_performance_totals_cache(company_id, fiscal_week, fiscal_year);

-- RLS Policies
ALTER TABLE module3_performance_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE module3_performance_totals_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les données de leur company
CREATE POLICY "Users can view own company performance cache"
  ON module3_performance_cache FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own company performance cache"
  ON module3_performance_cache FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company performance cache"
  ON module3_performance_cache FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own company performance cache"
  ON module3_performance_cache FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policies pour totals cache
CREATE POLICY "Users can view own company performance totals"
  ON module3_performance_totals_cache FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own company performance totals"
  ON module3_performance_totals_cache FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company performance totals"
  ON module3_performance_totals_cache FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own company performance totals"
  ON module3_performance_totals_cache FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Commentaires
COMMENT ON TABLE module3_performance_cache IS 'Cache des performances calculées par employé/indicateur pour affichage instantané';
COMMENT ON TABLE module3_performance_totals_cache IS 'Cache des totaux agrégés par ligne d''activité et indicateur';
