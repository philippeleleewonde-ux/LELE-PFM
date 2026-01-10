-- ============================================
-- MIGRATION: Table des résultats de période validés
-- Date: 2025-12-21
-- But: Stocker les résultats DÉFINITIFS après validation
--      Éviter les recalculs - lecture seule après validation
-- ============================================

-- 1. Table principale des résultats par période
CREATE TABLE IF NOT EXISTS public.module3_period_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- ============================================
    -- IDENTIFICATION DE LA PÉRIODE
    -- ============================================
    period_type TEXT NOT NULL CHECK (period_type IN ('WEEK', 'MONTH', 'QUARTER', 'YEAR')),
    fiscal_week INT,           -- Semaine fiscale (1-53)
    fiscal_month INT,          -- Mois fiscal (1-12)
    fiscal_quarter INT,        -- Trimestre (1-4)
    fiscal_year INT NOT NULL,  -- Année fiscale
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- ============================================
    -- DONNÉES CALCULÉES (JSONB pour flexibilité)
    -- ============================================

    -- Bloc 1 & 3: Données par indicateur (5 indicateurs)
    -- Structure: [{ key, label, pprPrevues, totalEconomies, totalPrevPrime, totalPrevTreso, totalRealPrime, totalRealTreso, partPct }]
    indicators_data JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Bloc 2 & 4: Données par ligne d'activité
    -- Structure: [{ businessLineId, businessLineName, objectif, economiesRealisees, employeeCount, prevPrime, prevTreso, realPrime, realTreso }]
    business_lines_data JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Totaux généraux
    -- Structure: { grandTotalPPR, grandTotalEco, grandTotalPrevPrime, grandTotalPrevTreso, grandTotalRealPrime, grandTotalRealTreso }
    grand_totals JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Détail par employé (pour drill-down si nécessaire)
    -- Structure: [{ employeeId, employeeName, businessLineId, indicators: {...}, totals: {...} }]
    employee_details JSONB DEFAULT '[]'::jsonb,

    -- Métadonnées de calcul
    employee_count INT DEFAULT 0,
    business_line_count INT DEFAULT 0,
    currency TEXT DEFAULT 'EUR',

    -- ============================================
    -- VERROUILLAGE ET AUDIT
    -- ============================================
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMPTZ,
    locked_by UUID REFERENCES auth.users(id),
    unlock_reason TEXT,  -- Raison si déverrouillé par admin

    -- Audit complet
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    calculated_by UUID REFERENCES auth.users(id),
    last_modified_at TIMESTAMPTZ,
    last_modified_by UUID REFERENCES auth.users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ============================================
    -- CONTRAINTES
    -- ============================================
    -- Une seule entrée par company/période
    UNIQUE(company_id, period_type, fiscal_year, fiscal_week),
    UNIQUE(company_id, period_type, fiscal_year, fiscal_month),
    UNIQUE(company_id, period_type, fiscal_year, fiscal_quarter)
);

-- 2. Index pour performances de requête
CREATE INDEX IF NOT EXISTS idx_period_results_company
    ON public.module3_period_results(company_id);

CREATE INDEX IF NOT EXISTS idx_period_results_period
    ON public.module3_period_results(period_type, fiscal_year, fiscal_week);

CREATE INDEX IF NOT EXISTS idx_period_results_locked
    ON public.module3_period_results(company_id, is_locked);

CREATE INDEX IF NOT EXISTS idx_period_results_year_month
    ON public.module3_period_results(company_id, fiscal_year, fiscal_month);

-- 3. Activer RLS
ALTER TABLE public.module3_period_results ENABLE ROW LEVEL SECURITY;

-- 4. Policies RLS

-- Lecture: Tous les utilisateurs de la company peuvent voir
CREATE POLICY "Users can view own company period results"
    ON public.module3_period_results FOR SELECT
    USING (
        company_id IN (
            SELECT p.company_id::uuid FROM public.profiles p WHERE p.id = auth.uid()
        )
    );

-- Insertion: Tous les utilisateurs authentifiés de la company peuvent créer
CREATE POLICY "Users can insert own company period results"
    ON public.module3_period_results FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT p.company_id::uuid FROM public.profiles p WHERE p.id = auth.uid()
        )
    );

-- Mise à jour: Seulement si non verrouillé OU si admin/CEO
CREATE POLICY "Users can update unlocked period results"
    ON public.module3_period_results FOR UPDATE
    USING (
        company_id IN (
            SELECT p.company_id::uuid FROM public.profiles p WHERE p.id = auth.uid()
        )
        AND (
            -- Soit non verrouillé
            is_locked = FALSE
            -- Soit l'utilisateur est CEO/Admin
            OR EXISTS (
                SELECT 1 FROM public.profiles p
                JOIN public.user_roles ur ON ur.user_id::text = p.id::text
                WHERE p.id = auth.uid()
                AND ur.role IN ('CEO', 'admin', 'ADMIN')
            )
        )
    );

-- Suppression: Seulement CEO/Admin
CREATE POLICY "Only admins can delete period results"
    ON public.module3_period_results FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.user_roles ur ON ur.user_id::text = p.id::text
            WHERE p.id = auth.uid()
            AND p.company_id::uuid = module3_period_results.company_id
            AND ur.role IN ('CEO', 'admin', 'ADMIN')
        )
    );

-- 5. Trigger pour mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_period_results_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_period_results_timestamp ON public.module3_period_results;
CREATE TRIGGER trigger_update_period_results_timestamp
    BEFORE UPDATE ON public.module3_period_results
    FOR EACH ROW
    EXECUTE FUNCTION update_period_results_timestamp();

-- 6. Fonction pour verrouiller une période
CREATE OR REPLACE FUNCTION lock_period_results(
    p_company_id UUID,
    p_period_type TEXT,
    p_fiscal_year INT,
    p_fiscal_week INT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.module3_period_results
    SET
        is_locked = TRUE,
        locked_at = NOW(),
        locked_by = auth.uid()
    WHERE
        company_id = p_company_id
        AND period_type = p_period_type
        AND fiscal_year = p_fiscal_year
        AND (p_fiscal_week IS NULL OR fiscal_week = p_fiscal_week);

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fonction pour déverrouiller une période (admin only - vérifié par RLS)
CREATE OR REPLACE FUNCTION unlock_period_results(
    p_company_id UUID,
    p_period_type TEXT,
    p_fiscal_year INT,
    p_fiscal_week INT DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.module3_period_results
    SET
        is_locked = FALSE,
        unlock_reason = p_reason,
        last_modified_at = NOW(),
        last_modified_by = auth.uid()
    WHERE
        company_id = p_company_id
        AND period_type = p_period_type
        AND fiscal_year = p_fiscal_year
        AND (p_fiscal_week IS NULL OR fiscal_week = p_fiscal_week);

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Vue pour faciliter les requêtes de reporting par période
CREATE OR REPLACE VIEW public.v_period_results_summary AS
SELECT
    pr.id,
    pr.company_id,
    c.name as company_name,
    pr.period_type,
    pr.fiscal_week,
    pr.fiscal_month,
    pr.fiscal_quarter,
    pr.fiscal_year,
    pr.period_start,
    pr.period_end,
    pr.employee_count,
    pr.business_line_count,
    pr.is_locked,
    pr.locked_at,
    pr.calculated_at,
    (pr.grand_totals->>'grandTotalPPR')::numeric as total_ppr,
    (pr.grand_totals->>'grandTotalEco')::numeric as total_economies,
    (pr.grand_totals->>'grandTotalPrevPrime')::numeric as total_prev_prime,
    (pr.grand_totals->>'grandTotalRealPrime')::numeric as total_real_prime,
    (pr.grand_totals->>'grandTotalPrevTreso')::numeric as total_prev_treso,
    (pr.grand_totals->>'grandTotalRealTreso')::numeric as total_real_treso,
    pr.currency
FROM public.module3_period_results pr
LEFT JOIN public.companies c ON c.id = pr.company_id;

-- 9. Commentaires
COMMENT ON TABLE public.module3_period_results IS
    'Résultats DÉFINITIFS des calculs de performance par période.
     Après validation, les données sont verrouillées et en lecture seule.
     Seuls les CEO/Admin peuvent déverrouiller.';

COMMENT ON COLUMN public.module3_period_results.indicators_data IS
    'Données par indicateur (Bloc 1 & 3): abs, qd, oa, ddp, ekh';

COMMENT ON COLUMN public.module3_period_results.business_lines_data IS
    'Données par ligne activité (Bloc 2 & 4): objectifs, économies, primes, trésorerie';

COMMENT ON COLUMN public.module3_period_results.is_locked IS
    'TRUE = période validée, données en lecture seule';
