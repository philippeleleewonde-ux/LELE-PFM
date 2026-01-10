-- ============================================
-- MIGRATION: calculated_metrics
-- Date: 2025-12-06
-- Description: Table de métriques calculées partagées entre modules HCM
--
-- Cette table permet de:
-- 1. Stocker les métriques calculées par Module 1 (HCM Performance Plan)
-- 2. Les rendre accessibles à Module 3 (HCM Cost Savings) et autres modules
-- 3. Lier les données aux périodes fiscales pour un suivi temporel précis
-- ============================================

-- Types de métriques
DO $$ BEGIN
    CREATE TYPE metric_type_enum AS ENUM (
        'priority_actions',      -- PPR par personne par indicateur (Pages 14-16)
        'gains',                 -- Gains N+1, N+2, N+3
        'prl',                   -- Pertes Potentiellement Récupérables
        'var',                   -- Value at Risk
        'el',                    -- Expected Losses
        'ul',                    -- Unexpected Losses
        'indicator_rate',        -- Taux par indicateur (absentéisme, productivité, etc.)
        'budget_allocation',     -- Allocation budget par ligne d'activité
        'staff_distribution',    -- Distribution effectifs
        'custom'                 -- Métriques personnalisées
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Indicateurs de performance
DO $$ BEGIN
    CREATE TYPE indicator_enum AS ENUM (
        'absenteeism',           -- Absentéisme
        'productivity',          -- Productivité directe
        'quality',               -- Qualité
        'accidents',             -- Accidents du travail
        'knowhow',               -- Know-how
        'all'                    -- Tous indicateurs confondus
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table principale des métriques calculées
CREATE TABLE IF NOT EXISTS calculated_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Classification de la métrique
    metric_type VARCHAR(50) NOT NULL,                  -- 'priority_actions', 'gains', 'prl', etc.
    source_module VARCHAR(20) NOT NULL DEFAULT 'module1', -- Module source

    -- Contexte temporel
    fiscal_year INT NOT NULL,                          -- 2025, 2026, 2027
    fiscal_period VARCHAR(10) DEFAULT 'ANNUAL',        -- 'Q1', 'Q2', 'M01', 'W01', 'ANNUAL'
    year_offset INT DEFAULT 0,                         -- 0=N, 1=N+1, 2=N+2, 3=N+3

    -- Contexte organisationnel
    business_line VARCHAR(100),                        -- Nom de la ligne d'activité
    business_line_id UUID,                             -- Référence optionnelle

    -- Contexte indicateur
    indicator VARCHAR(50),                             -- 'absenteeism', 'productivity', etc.

    -- Valeurs calculées
    value_total DECIMAL(18,4),                         -- Valeur totale (ex: PPR ligne)
    value_per_person DECIMAL(18,4),                    -- Valeur par personne (ex: PPR/personne)
    value_rate DECIMAL(8,4),                           -- Taux en % (ex: taux indicateur)

    -- Métadonnées de contexte
    staff_count INT,                                   -- Effectif concerné
    budget_rate DECIMAL(8,4),                          -- Taux budget ligne

    -- Données additionnelles (flexibilité)
    metadata JSONB DEFAULT '{}',                       -- Données additionnelles

    -- Traçabilité
    calculated_at TIMESTAMPTZ DEFAULT NOW(),           -- Quand le calcul a été fait
    calculation_version VARCHAR(20) DEFAULT 'v1.0',    -- Version du moteur de calcul

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contrainte d'unicité pour éviter les doublons
    CONSTRAINT unique_calculated_metric
        UNIQUE NULLS NOT DISTINCT (
            company_id, metric_type, fiscal_year, fiscal_period,
            business_line, indicator
        )
);

-- Index pour performances optimales
CREATE INDEX IF NOT EXISTS idx_calc_metrics_company
    ON calculated_metrics(company_id);

CREATE INDEX IF NOT EXISTS idx_calc_metrics_company_year
    ON calculated_metrics(company_id, fiscal_year);

CREATE INDEX IF NOT EXISTS idx_calc_metrics_company_type
    ON calculated_metrics(company_id, metric_type);

CREATE INDEX IF NOT EXISTS idx_calc_metrics_lookup
    ON calculated_metrics(company_id, metric_type, fiscal_year, business_line, indicator);

CREATE INDEX IF NOT EXISTS idx_calc_metrics_year_offset
    ON calculated_metrics(company_id, year_offset);

CREATE INDEX IF NOT EXISTS idx_calc_metrics_business_line
    ON calculated_metrics(company_id, business_line)
    WHERE business_line IS NOT NULL;

-- Index GIN pour recherche dans metadata
CREATE INDEX IF NOT EXISTS idx_calc_metrics_metadata
    ON calculated_metrics USING GIN (metadata);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_calculated_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculated_metrics_updated_at ON calculated_metrics;
CREATE TRIGGER trigger_calculated_metrics_updated_at
    BEFORE UPDATE ON calculated_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_calculated_metrics_updated_at();

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour récupérer les PPR par personne pour une ligne d'activité
CREATE OR REPLACE FUNCTION get_priority_actions_per_person(
    p_company_id UUID,
    p_business_line VARCHAR,
    p_year_offset INT DEFAULT 1  -- Par défaut N+1
)
RETURNS TABLE (
    indicator VARCHAR,
    value_per_line DECIMAL,
    value_per_person DECIMAL,
    staff_count INT,
    budget_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cm.indicator::VARCHAR,
        cm.value_total,
        cm.value_per_person,
        cm.staff_count,
        cm.budget_rate
    FROM calculated_metrics cm
    WHERE cm.company_id = p_company_id
      AND cm.metric_type = 'priority_actions'
      AND cm.year_offset = p_year_offset
      AND LOWER(cm.business_line) = LOWER(p_business_line)
    ORDER BY cm.indicator;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction pour sauvegarder les métriques Priority Actions depuis Module 1
CREATE OR REPLACE FUNCTION save_priority_actions_metrics(
    p_company_id UUID,
    p_year_offset INT,
    p_data JSONB
)
RETURNS INT AS $$
DECLARE
    v_count INT := 0;
    v_fiscal_year INT;
    v_bl JSONB;
    v_dist JSONB;
BEGIN
    -- Calculer l'année fiscale
    v_fiscal_year := EXTRACT(YEAR FROM CURRENT_DATE)::INT + p_year_offset;

    -- Parcourir les business lines
    FOR v_bl IN SELECT * FROM jsonb_array_elements(p_data)
    LOOP
        -- Parcourir les distributions (indicateurs)
        FOR v_dist IN SELECT * FROM jsonb_array_elements(v_bl->'distributions')
        LOOP
            INSERT INTO calculated_metrics (
                company_id,
                metric_type,
                source_module,
                fiscal_year,
                year_offset,
                business_line,
                indicator,
                value_total,
                value_per_person,
                staff_count,
                budget_rate,
                calculated_at
            ) VALUES (
                p_company_id,
                'priority_actions',
                'module1',
                v_fiscal_year,
                p_year_offset,
                v_bl->>'businessLine',
                v_dist->>'indicator',
                (v_dist->>'perLine')::DECIMAL,
                (v_dist->>'perPerson')::DECIMAL,
                (v_bl->>'staffCount')::INT,
                (v_bl->>'budgetRate')::DECIMAL,
                NOW()
            )
            ON CONFLICT (company_id, metric_type, fiscal_year, fiscal_period, business_line, indicator)
            DO UPDATE SET
                value_total = EXCLUDED.value_total,
                value_per_person = EXCLUDED.value_per_person,
                staff_count = EXCLUDED.staff_count,
                budget_rate = EXCLUDED.budget_rate,
                calculated_at = EXCLUDED.calculated_at,
                updated_at = NOW();

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Vue pour faciliter l'accès aux données Priority Actions N+1
CREATE OR REPLACE VIEW v_priority_actions_n1 AS
SELECT
    cm.company_id,
    cm.business_line,
    cm.indicator,
    cm.value_total AS per_line,
    cm.value_per_person AS per_person,
    cm.staff_count,
    cm.budget_rate,
    cm.fiscal_year,
    cm.calculated_at
FROM calculated_metrics cm
WHERE cm.metric_type = 'priority_actions'
  AND cm.year_offset = 1;

-- Vue pour Priority Actions N+2
CREATE OR REPLACE VIEW v_priority_actions_n2 AS
SELECT
    cm.company_id,
    cm.business_line,
    cm.indicator,
    cm.value_total AS per_line,
    cm.value_per_person AS per_person,
    cm.staff_count,
    cm.budget_rate,
    cm.fiscal_year,
    cm.calculated_at
FROM calculated_metrics cm
WHERE cm.metric_type = 'priority_actions'
  AND cm.year_offset = 2;

-- Vue pour Priority Actions N+3
CREATE OR REPLACE VIEW v_priority_actions_n3 AS
SELECT
    cm.company_id,
    cm.business_line,
    cm.indicator,
    cm.value_total AS per_line,
    cm.value_per_person AS per_person,
    cm.staff_count,
    cm.budget_rate,
    cm.fiscal_year,
    cm.calculated_at
FROM calculated_metrics cm
WHERE cm.metric_type = 'priority_actions'
  AND cm.year_offset = 3;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE calculated_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs ne voient que les métriques de leur entreprise
DROP POLICY IF EXISTS "Users can view own company metrics" ON calculated_metrics;
CREATE POLICY "Users can view own company metrics"
ON calculated_metrics FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT id FROM companies WHERE owner_user_id = auth.uid()
    )
);

-- Policy: Les modules peuvent insérer des métriques
DROP POLICY IF EXISTS "Modules can insert metrics" ON calculated_metrics;
CREATE POLICY "Modules can insert metrics"
ON calculated_metrics FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT id FROM companies WHERE owner_user_id = auth.uid()
    )
);

-- Policy: Les modules peuvent mettre à jour les métriques
DROP POLICY IF EXISTS "Modules can update metrics" ON calculated_metrics;
CREATE POLICY "Modules can update metrics"
ON calculated_metrics FOR UPDATE
USING (
    company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT id FROM companies WHERE owner_user_id = auth.uid()
    )
);

-- Policy: Les admins peuvent supprimer les métriques
DROP POLICY IF EXISTS "Admins can delete metrics" ON calculated_metrics;
CREATE POLICY "Admins can delete metrics"
ON calculated_metrics FOR DELETE
USING (
    company_id IN (
        SELECT id FROM companies WHERE owner_user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND company_id = calculated_metrics.company_id
          AND role IN ('admin', 'superadmin')
    )
);

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE calculated_metrics IS 'Métriques calculées partagées entre modules HCM - stocke PPR, gains, indicateurs, etc.';
COMMENT ON COLUMN calculated_metrics.metric_type IS 'Type de métrique: priority_actions, gains, prl, var, etc.';
COMMENT ON COLUMN calculated_metrics.source_module IS 'Module source qui a généré la métrique (module1, module2, module3)';
COMMENT ON COLUMN calculated_metrics.year_offset IS '0=N (année courante), 1=N+1, 2=N+2, 3=N+3';
COMMENT ON COLUMN calculated_metrics.value_total IS 'Valeur totale (ex: PPR total pour la ligne)';
COMMENT ON COLUMN calculated_metrics.value_per_person IS 'Valeur par personne (ex: PPR/personne)';
COMMENT ON COLUMN calculated_metrics.value_rate IS 'Taux en pourcentage';
COMMENT ON COLUMN calculated_metrics.metadata IS 'Données additionnelles en JSON pour flexibilité future';
COMMENT ON FUNCTION get_priority_actions_per_person IS 'Récupère les PPR par personne pour une ligne d activité donnée';
COMMENT ON FUNCTION save_priority_actions_metrics IS 'Sauvegarde les métriques Priority Actions depuis les données Module 1';
