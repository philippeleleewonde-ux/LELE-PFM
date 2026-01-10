-- ============================================
-- MIGRATION: fiscal_periods
-- Date: 2025-12-06
-- Description: Table de calendrier fiscal pour la plateforme LELE HCM
--
-- Cette table permet de:
-- 1. Définir les périodes fiscales de chaque entreprise (trimestres, mois, semaines)
-- 2. Synchroniser les données calculées avec le calendrier réel
-- 3. Suivre la période courante pour les dashboards
-- ============================================

-- Créer le type ENUM pour les types de périodes
DO $$ BEGIN
    CREATE TYPE period_type_enum AS ENUM ('YEAR', 'QUARTER', 'MONTH', 'WEEK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table principale des périodes fiscales
CREATE TABLE IF NOT EXISTS fiscal_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Identification de la période
    fiscal_year INT NOT NULL,                          -- 2024, 2025, 2026, etc.
    period_type VARCHAR(10) NOT NULL,                  -- 'YEAR', 'QUARTER', 'MONTH', 'WEEK'
    period_number INT NOT NULL,                        -- 1-4 pour trimestres, 1-12 pour mois, 1-52 pour semaines
    period_label VARCHAR(30),                          -- 'Q1 2025', 'Jan 2025', 'W01 2025'

    -- Dates réelles
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Métadonnées
    is_current BOOLEAN DEFAULT FALSE,                  -- Période courante
    is_closed BOOLEAN DEFAULT FALSE,                   -- Période clôturée (comptablement)

    -- Planning N+1, N+2, N+3
    year_offset INT DEFAULT 0,                         -- 0 = N (année courante), 1 = N+1, 2 = N+2, 3 = N+3

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contrainte d'unicité
    CONSTRAINT unique_fiscal_period
        UNIQUE (company_id, fiscal_year, period_type, period_number)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_company
    ON fiscal_periods(company_id);

CREATE INDEX IF NOT EXISTS idx_fiscal_periods_company_year
    ON fiscal_periods(company_id, fiscal_year);

CREATE INDEX IF NOT EXISTS idx_fiscal_periods_current
    ON fiscal_periods(company_id, is_current)
    WHERE is_current = TRUE;

CREATE INDEX IF NOT EXISTS idx_fiscal_periods_date_range
    ON fiscal_periods(company_id, start_date, end_date);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_fiscal_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_fiscal_periods_updated_at ON fiscal_periods;
CREATE TRIGGER trigger_fiscal_periods_updated_at
    BEFORE UPDATE ON fiscal_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_fiscal_periods_updated_at();

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour obtenir la période courante d'une entreprise
CREATE OR REPLACE FUNCTION get_current_fiscal_period(
    p_company_id UUID,
    p_period_type VARCHAR DEFAULT 'QUARTER'
)
RETURNS TABLE (
    id UUID,
    fiscal_year INT,
    period_type VARCHAR,
    period_number INT,
    period_label VARCHAR,
    start_date DATE,
    end_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fp.id,
        fp.fiscal_year,
        fp.period_type::VARCHAR,
        fp.period_number,
        fp.period_label::VARCHAR,
        fp.start_date,
        fp.end_date
    FROM fiscal_periods fp
    WHERE fp.company_id = p_company_id
      AND fp.period_type = p_period_type
      AND CURRENT_DATE BETWEEN fp.start_date AND fp.end_date
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction pour générer automatiquement le calendrier fiscal sur 3 ans
CREATE OR REPLACE FUNCTION generate_fiscal_calendar(
    p_company_id UUID,
    p_base_year INT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
    v_base_year INT;
    v_year INT;
    v_quarter INT;
    v_month INT;
    v_start_date DATE;
    v_end_date DATE;
    v_count INT := 0;
    v_year_offset INT;
BEGIN
    -- Utiliser l'année courante si non spécifiée
    v_base_year := COALESCE(p_base_year, EXTRACT(YEAR FROM CURRENT_DATE)::INT);

    -- Supprimer les anciennes périodes pour cette entreprise (optionnel)
    -- DELETE FROM fiscal_periods WHERE company_id = p_company_id;

    -- Générer pour 4 années: N, N+1, N+2, N+3
    FOR v_year_offset IN 0..3 LOOP
        v_year := v_base_year + v_year_offset;

        -- Générer l'année complète
        INSERT INTO fiscal_periods (
            company_id, fiscal_year, period_type, period_number, period_label,
            start_date, end_date, year_offset, is_current
        ) VALUES (
            p_company_id, v_year, 'YEAR', 1, v_year::VARCHAR,
            DATE(v_year || '-01-01'), DATE(v_year || '-12-31'),
            v_year_offset,
            (EXTRACT(YEAR FROM CURRENT_DATE) = v_year)
        )
        ON CONFLICT (company_id, fiscal_year, period_type, period_number)
        DO UPDATE SET
            period_label = EXCLUDED.period_label,
            start_date = EXCLUDED.start_date,
            end_date = EXCLUDED.end_date,
            year_offset = EXCLUDED.year_offset,
            is_current = EXCLUDED.is_current,
            updated_at = NOW();
        v_count := v_count + 1;

        -- Générer les 4 trimestres
        FOR v_quarter IN 1..4 LOOP
            v_start_date := DATE(v_year || '-' || ((v_quarter - 1) * 3 + 1)::VARCHAR || '-01');
            v_end_date := (DATE(v_year || '-' || (v_quarter * 3)::VARCHAR || '-01') + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

            INSERT INTO fiscal_periods (
                company_id, fiscal_year, period_type, period_number, period_label,
                start_date, end_date, year_offset, is_current
            ) VALUES (
                p_company_id, v_year, 'QUARTER', v_quarter, 'Q' || v_quarter || ' ' || v_year,
                v_start_date, v_end_date,
                v_year_offset,
                (CURRENT_DATE BETWEEN v_start_date AND v_end_date)
            )
            ON CONFLICT (company_id, fiscal_year, period_type, period_number)
            DO UPDATE SET
                period_label = EXCLUDED.period_label,
                start_date = EXCLUDED.start_date,
                end_date = EXCLUDED.end_date,
                year_offset = EXCLUDED.year_offset,
                is_current = EXCLUDED.is_current,
                updated_at = NOW();
            v_count := v_count + 1;
        END LOOP;

        -- Générer les 12 mois
        FOR v_month IN 1..12 LOOP
            v_start_date := DATE(v_year || '-' || LPAD(v_month::VARCHAR, 2, '0') || '-01');
            v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

            INSERT INTO fiscal_periods (
                company_id, fiscal_year, period_type, period_number, period_label,
                start_date, end_date, year_offset, is_current
            ) VALUES (
                p_company_id, v_year, 'MONTH', v_month,
                TO_CHAR(v_start_date, 'Mon') || ' ' || v_year,
                v_start_date, v_end_date,
                v_year_offset,
                (CURRENT_DATE BETWEEN v_start_date AND v_end_date)
            )
            ON CONFLICT (company_id, fiscal_year, period_type, period_number)
            DO UPDATE SET
                period_label = EXCLUDED.period_label,
                start_date = EXCLUDED.start_date,
                end_date = EXCLUDED.end_date,
                year_offset = EXCLUDED.year_offset,
                is_current = EXCLUDED.is_current,
                updated_at = NOW();
            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs ne voient que les périodes de leur entreprise
DROP POLICY IF EXISTS "Users can view own company fiscal periods" ON fiscal_periods;
CREATE POLICY "Users can view own company fiscal periods"
ON fiscal_periods FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT id FROM companies WHERE owner_user_id = auth.uid()
    )
);

-- Policy: Seuls les admins/owners peuvent insérer des périodes
DROP POLICY IF EXISTS "Admins can insert fiscal periods" ON fiscal_periods;
CREATE POLICY "Admins can insert fiscal periods"
ON fiscal_periods FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT id FROM companies WHERE owner_user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND company_id = fiscal_periods.company_id
          AND role IN ('admin', 'superadmin')
    )
);

-- Policy: Seuls les admins/owners peuvent modifier
DROP POLICY IF EXISTS "Admins can update fiscal periods" ON fiscal_periods;
CREATE POLICY "Admins can update fiscal periods"
ON fiscal_periods FOR UPDATE
USING (
    company_id IN (
        SELECT id FROM companies WHERE owner_user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND company_id = fiscal_periods.company_id
          AND role IN ('admin', 'superadmin')
    )
);

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE fiscal_periods IS 'Calendrier fiscal pour chaque entreprise - gère les périodes N, N+1, N+2, N+3';
COMMENT ON COLUMN fiscal_periods.fiscal_year IS 'Année fiscale (ex: 2025)';
COMMENT ON COLUMN fiscal_periods.period_type IS 'Type de période: YEAR, QUARTER, MONTH, WEEK';
COMMENT ON COLUMN fiscal_periods.period_number IS 'Numéro de la période (1-4 pour Q, 1-12 pour M, 1-52 pour W)';
COMMENT ON COLUMN fiscal_periods.year_offset IS '0=N (année courante), 1=N+1, 2=N+2, 3=N+3';
COMMENT ON COLUMN fiscal_periods.is_current IS 'TRUE si la date du jour est dans cette période';
COMMENT ON COLUMN fiscal_periods.is_closed IS 'TRUE si la période est clôturée comptablement';
COMMENT ON FUNCTION generate_fiscal_calendar IS 'Génère automatiquement le calendrier fiscal sur 4 ans (N à N+3)';
