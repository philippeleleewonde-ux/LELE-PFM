-- ============================================
-- MIGRATION: Vue agrégée des temps N2
-- Date: 2026-01-13
-- But: Corriger l'écart M3-Données de temps N2 (DK6)
--
-- ÉCART CORRIGÉ:
-- Excel (DK6): =SI(ESTERREUR('20-Tri-NIVEAU2-LIGNES'!$S$37>0);0;(...))
-- TypeScript: const tempsCollecteN2 = tempsCollecte; // COPIE N1
--
-- SOLUTION: Agrégation automatique des données N1 par ligne d'activité
-- ============================================

-- 1. Vue agrégée des temps N2 par ligne d'activité
-- Équivalent de S37 = SUM(S29:S36) dans Excel
CREATE OR REPLACE VIEW v_niveau2_temps_aggregated AS
SELECT
    company_id,
    business_line_id,
    kpi_type,
    period_start,
    period_end,
    -- Total en heures décimales (équivalent S37)
    COALESCE(SUM(total_duration_minutes) / 60.0, 0) as total_temps_n2_hours,
    -- Total frais N2
    COALESCE(SUM(compensation_amount), 0) as total_fees_n2,
    -- Métadonnées
    COUNT(*) as entries_count
FROM module3_cost_entries
GROUP BY company_id, business_line_id, kpi_type, period_start, period_end;

-- 2. Fonction RPC pour récupérer temps N2
-- Équivalent: =SI(ESTERREUR('20-Tri-NIVEAU2-LIGNES'!$S$37>0);0;(...))
CREATE OR REPLACE FUNCTION get_temps_n2_aggregated(
    p_company_id TEXT,
    p_business_line_id UUID,
    p_kpi_type TEXT,
    p_period_start DATE,
    p_period_end DATE
) RETURNS NUMERIC AS $$
BEGIN
    RETURN COALESCE(
        (SELECT total_temps_n2_hours
         FROM v_niveau2_temps_aggregated
         WHERE company_id = p_company_id
           AND business_line_id = p_business_line_id
           AND kpi_type = p_kpi_type
           AND period_start = p_period_start
           AND period_end = p_period_end),
        0  -- Fallback 0 comme ESTERREUR dans Excel
    );
EXCEPTION WHEN OTHERS THEN
    RETURN 0; -- Gestion d'erreur = ESTERREUR
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Fonction RPC pour récupérer frais N2
CREATE OR REPLACE FUNCTION get_fees_n2_aggregated(
    p_company_id TEXT,
    p_business_line_id UUID,
    p_kpi_type TEXT,
    p_period_start DATE,
    p_period_end DATE
) RETURNS NUMERIC AS $$
BEGIN
    RETURN COALESCE(
        (SELECT total_fees_n2
         FROM v_niveau2_temps_aggregated
         WHERE company_id = p_company_id
           AND business_line_id = p_business_line_id
           AND kpi_type = p_kpi_type
           AND period_start = p_period_start
           AND period_end = p_period_end),
        0
    );
EXCEPTION WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Fonction batch pour récupérer tous les temps N2 d'une company/période
-- Optimisation: évite les appels multiples par business_line/kpi
CREATE OR REPLACE FUNCTION get_all_temps_n2_aggregated(
    p_company_id TEXT,
    p_period_start DATE,
    p_period_end DATE
) RETURNS TABLE (
    business_line_id UUID,
    kpi_type TEXT,
    total_temps_n2_hours NUMERIC,
    total_fees_n2 NUMERIC,
    entries_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.business_line_id,
        v.kpi_type,
        v.total_temps_n2_hours,
        v.total_fees_n2,
        v.entries_count
    FROM v_niveau2_temps_aggregated v
    WHERE v.company_id = p_company_id
      AND v.period_start = p_period_start
      AND v.period_end = p_period_end;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Commentaires
COMMENT ON VIEW v_niveau2_temps_aggregated IS
    'Vue agrégée des temps N2 par ligne activité - Équivalent S37=SUM(S29:S36) Excel';

COMMENT ON FUNCTION get_temps_n2_aggregated IS
    'Récupère temps N2 agrégé - Équivalent =SI(ESTERREUR(...);0;(...)) Excel DK6';

COMMENT ON FUNCTION get_all_temps_n2_aggregated IS
    'Récupère tous les temps N2 en une requête (optimisation batch)';

-- ============================================
-- VÉRIFICATION
-- ============================================
-- SELECT * FROM v_niveau2_temps_aggregated LIMIT 10;
-- SELECT get_temps_n2_aggregated('company_id', 'bl_id'::uuid, 'ddp', '2026-01-01', '2026-01-07');
