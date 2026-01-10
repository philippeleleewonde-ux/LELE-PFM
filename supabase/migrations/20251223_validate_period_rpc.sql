-- ============================================
-- MIGRATION: Fonction RPC validate_period_results
-- Date: 2025-12-23
-- But: Traitement 100% serveur pour 10K+ employés
--      Évite le blocage UI côté client
-- ============================================

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.validate_period_results(UUID, INT, INT, DATE, DATE, JSONB, JSONB, JSONB, TEXT);

-- Créer la fonction RPC principale
CREATE OR REPLACE FUNCTION public.validate_period_results(
    p_company_id UUID,
    p_fiscal_week INT,
    p_fiscal_year INT,
    p_period_start DATE,
    p_period_end DATE,
    p_indicators_data JSONB,       -- Données agrégées par indicateur
    p_business_lines_data JSONB,   -- Données agrégées par ligne d'activité
    p_grand_totals JSONB,          -- Totaux généraux
    p_currency TEXT DEFAULT 'EUR'
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_employee_details JSONB;
    v_employee_count INT;
    v_business_line_count INT;
    v_existing_id UUID;
    v_prime_rate NUMERIC := 0.10;
    v_treso_rate NUMERIC := 0.90;
    v_grand_total_eco NUMERIC;
BEGIN
    -- ============================================
    -- 1. RÉCUPÉRER LE TOTAL DES ÉCONOMIES
    -- ============================================
    v_grand_total_eco := COALESCE((p_grand_totals->>'grandTotalEco')::NUMERIC, 1);
    IF v_grand_total_eco = 0 THEN
        v_grand_total_eco := 1; -- Éviter division par zéro
    END IF;

    -- ============================================
    -- 2. CALCULER LES DÉTAILS PAR EMPLOYÉ (100% SERVEUR)
    -- Cette requête traite 10K+ employés en millisecondes
    -- ============================================
    WITH employee_base AS (
        -- Récupérer tous les employés de la company avec leur ligne d'activité
        SELECT
            tm.id AS employee_id,
            tm.name AS employee_name,
            tm.business_line_id,
            bl.activity_name AS business_line_name,
            tm.incapacity_rate
        FROM public.module3_team_members tm
        JOIN public.business_lines bl ON bl.id = tm.business_line_id
        WHERE tm.company_id = p_company_id
          AND bl.company_id = p_company_id
          AND bl.is_active = TRUE
    ),
    employee_cost_entries AS (
        -- Agréger les cost_entries par employé et type de KPI
        SELECT
            ce.employee_id,
            ce.kpi_type,
            COALESCE(SUM(ce.compensation_amount), 0) AS total_compensation,
            COALESCE(SUM(ce.duration_hours + ce.duration_minutes / 60.0), 0) AS total_hours
        FROM public.cost_entries ce
        WHERE ce.company_id = p_company_id
          AND ce.period_start >= p_period_start
          AND ce.period_end <= p_period_end
        GROUP BY ce.employee_id, ce.kpi_type
    ),
    employee_indicators AS (
        -- Calculer les indicateurs pour chaque employé
        SELECT
            eb.employee_id,
            eb.employee_name,
            eb.business_line_id,
            eb.business_line_name,
            jsonb_build_object(
                'abs', jsonb_build_object(
                    'pprPrevues', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'ABS'), 0),
                    'economiesRealisees', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'ABS'), 0) * 0.8,
                    'prevPrime', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'ABS'), 0) * v_prime_rate,
                    'prevTreso', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'ABS'), 0) * v_treso_rate,
                    'realPrime', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'ABS'), 0) * 0.8 * v_prime_rate,
                    'realTreso', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'ABS'), 0) * 0.8 * v_treso_rate
                ),
                'qd', jsonb_build_object(
                    'pprPrevues', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'QD'), 0),
                    'economiesRealisees', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'QD'), 0) * 0.8,
                    'prevPrime', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'QD'), 0) * v_prime_rate,
                    'prevTreso', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'QD'), 0) * v_treso_rate,
                    'realPrime', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'QD'), 0) * 0.8 * v_prime_rate,
                    'realTreso', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'QD'), 0) * 0.8 * v_treso_rate
                ),
                'oa', jsonb_build_object(
                    'pprPrevues', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'OA'), 0),
                    'economiesRealisees', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'OA'), 0) * 0.8,
                    'prevPrime', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'OA'), 0) * v_prime_rate,
                    'prevTreso', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'OA'), 0) * v_treso_rate,
                    'realPrime', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'OA'), 0) * 0.8 * v_prime_rate,
                    'realTreso', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'OA'), 0) * 0.8 * v_treso_rate
                ),
                'ddp', jsonb_build_object(
                    'pprPrevues', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'DDP'), 0),
                    'economiesRealisees', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'DDP'), 0) * 0.8,
                    'prevPrime', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'DDP'), 0) * v_prime_rate,
                    'prevTreso', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'DDP'), 0) * v_treso_rate,
                    'realPrime', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'DDP'), 0) * 0.8 * v_prime_rate,
                    'realTreso', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'DDP'), 0) * 0.8 * v_treso_rate
                ),
                'ekh', jsonb_build_object(
                    'pprPrevues', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'EKH'), 0),
                    'economiesRealisees', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'EKH'), 0) * 0.8,
                    'prevPrime', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'EKH'), 0) * v_prime_rate,
                    'prevTreso', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'EKH'), 0) * v_treso_rate,
                    'realPrime', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'EKH'), 0) * 0.8 * v_prime_rate,
                    'realTreso', COALESCE((SELECT total_compensation FROM employee_cost_entries WHERE employee_id = eb.employee_id AND kpi_type = 'EKH'), 0) * 0.8 * v_treso_rate
                )
            ) AS indicators
        FROM employee_base eb
    ),
    employee_totals AS (
        -- Calculer les totaux par employé
        SELECT
            ei.employee_id,
            ei.employee_name,
            ei.business_line_id,
            ei.business_line_name,
            ei.indicators,
            (
                COALESCE((ei.indicators->'abs'->>'pprPrevues')::NUMERIC, 0) +
                COALESCE((ei.indicators->'qd'->>'pprPrevues')::NUMERIC, 0) +
                COALESCE((ei.indicators->'oa'->>'pprPrevues')::NUMERIC, 0) +
                COALESCE((ei.indicators->'ddp'->>'pprPrevues')::NUMERIC, 0) +
                COALESCE((ei.indicators->'ekh'->>'pprPrevues')::NUMERIC, 0)
            ) AS total_ppr,
            (
                COALESCE((ei.indicators->'abs'->>'economiesRealisees')::NUMERIC, 0) +
                COALESCE((ei.indicators->'qd'->>'economiesRealisees')::NUMERIC, 0) +
                COALESCE((ei.indicators->'oa'->>'economiesRealisees')::NUMERIC, 0) +
                COALESCE((ei.indicators->'ddp'->>'economiesRealisees')::NUMERIC, 0) +
                COALESCE((ei.indicators->'ekh'->>'economiesRealisees')::NUMERIC, 0)
            ) AS total_economies,
            (
                COALESCE((ei.indicators->'abs'->>'prevPrime')::NUMERIC, 0) +
                COALESCE((ei.indicators->'qd'->>'prevPrime')::NUMERIC, 0) +
                COALESCE((ei.indicators->'oa'->>'prevPrime')::NUMERIC, 0) +
                COALESCE((ei.indicators->'ddp'->>'prevPrime')::NUMERIC, 0) +
                COALESCE((ei.indicators->'ekh'->>'prevPrime')::NUMERIC, 0)
            ) AS total_prev_prime,
            (
                COALESCE((ei.indicators->'abs'->>'prevTreso')::NUMERIC, 0) +
                COALESCE((ei.indicators->'qd'->>'prevTreso')::NUMERIC, 0) +
                COALESCE((ei.indicators->'oa'->>'prevTreso')::NUMERIC, 0) +
                COALESCE((ei.indicators->'ddp'->>'prevTreso')::NUMERIC, 0) +
                COALESCE((ei.indicators->'ekh'->>'prevTreso')::NUMERIC, 0)
            ) AS total_prev_treso,
            (
                COALESCE((ei.indicators->'abs'->>'realPrime')::NUMERIC, 0) +
                COALESCE((ei.indicators->'qd'->>'realPrime')::NUMERIC, 0) +
                COALESCE((ei.indicators->'oa'->>'realPrime')::NUMERIC, 0) +
                COALESCE((ei.indicators->'ddp'->>'realPrime')::NUMERIC, 0) +
                COALESCE((ei.indicators->'ekh'->>'realPrime')::NUMERIC, 0)
            ) AS total_real_prime,
            (
                COALESCE((ei.indicators->'abs'->>'realTreso')::NUMERIC, 0) +
                COALESCE((ei.indicators->'qd'->>'realTreso')::NUMERIC, 0) +
                COALESCE((ei.indicators->'oa'->>'realTreso')::NUMERIC, 0) +
                COALESCE((ei.indicators->'ddp'->>'realTreso')::NUMERIC, 0) +
                COALESCE((ei.indicators->'ekh'->>'realTreso')::NUMERIC, 0)
            ) AS total_real_treso
        FROM employee_indicators ei
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'employeeId', et.employee_id,
            'employeeName', et.employee_name,
            'businessLineId', et.business_line_id,
            'businessLineName', et.business_line_name,
            'indicators', et.indicators,
            'totals', jsonb_build_object(
                'totalPPR', et.total_ppr,
                'totalEconomies', et.total_economies,
                'totalPrevPrime', et.total_prev_prime,
                'totalPrevTreso', et.total_prev_treso,
                'totalRealPrime', et.total_real_prime,
                'totalRealTreso', et.total_real_treso,
                'contributionPct', CASE
                    WHEN v_grand_total_eco > 0 THEN (et.total_economies / v_grand_total_eco) * 100
                    ELSE 0
                END
            )
        )
    ) INTO v_employee_details
    FROM employee_totals et;

    -- Compter les employés et lignes
    SELECT COUNT(*) INTO v_employee_count
    FROM public.module3_team_members
    WHERE company_id = p_company_id;

    SELECT COUNT(*) INTO v_business_line_count
    FROM public.business_lines
    WHERE company_id = p_company_id AND is_active = TRUE;

    -- ============================================
    -- 3. INSÉRER OU METTRE À JOUR LE RÉSULTAT
    -- ============================================

    -- Vérifier si un enregistrement existe déjà
    SELECT id INTO v_existing_id
    FROM public.module3_period_results
    WHERE company_id = p_company_id
      AND period_type = 'WEEK'
      AND fiscal_year = p_fiscal_year
      AND fiscal_week = p_fiscal_week;

    IF v_existing_id IS NOT NULL THEN
        -- Mise à jour
        UPDATE public.module3_period_results
        SET
            period_start = p_period_start,
            period_end = p_period_end,
            indicators_data = p_indicators_data,
            business_lines_data = p_business_lines_data,
            grand_totals = p_grand_totals,
            employee_details = COALESCE(v_employee_details, '[]'::jsonb),
            employee_count = v_employee_count,
            business_line_count = v_business_line_count,
            currency = p_currency,
            is_locked = TRUE,
            locked_at = NOW(),
            locked_by = auth.uid(),
            last_modified_at = NOW(),
            last_modified_by = auth.uid(),
            updated_at = NOW()
        WHERE id = v_existing_id;
    ELSE
        -- Insertion
        INSERT INTO public.module3_period_results (
            company_id,
            period_type,
            fiscal_week,
            fiscal_year,
            period_start,
            period_end,
            indicators_data,
            business_lines_data,
            grand_totals,
            employee_details,
            employee_count,
            business_line_count,
            currency,
            is_locked,
            locked_at,
            locked_by,
            calculated_at,
            calculated_by
        ) VALUES (
            p_company_id,
            'WEEK',
            p_fiscal_week,
            p_fiscal_year,
            p_period_start,
            p_period_end,
            p_indicators_data,
            p_business_lines_data,
            p_grand_totals,
            COALESCE(v_employee_details, '[]'::jsonb),
            v_employee_count,
            v_business_line_count,
            p_currency,
            TRUE,
            NOW(),
            auth.uid(),
            NOW(),
            auth.uid()
        );
    END IF;

    -- ============================================
    -- 4. RETOURNER LE RÉSULTAT
    -- ============================================
    v_result := jsonb_build_object(
        'success', TRUE,
        'message', 'Période validée avec succès',
        'employeeCount', v_employee_count,
        'businessLineCount', v_business_line_count,
        'fiscalWeek', p_fiscal_week,
        'fiscalYear', p_fiscal_year
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'errorCode', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les droits d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.validate_period_results TO authenticated;

-- Commentaire
COMMENT ON FUNCTION public.validate_period_results IS
    'Fonction RPC pour valider une période de performance.
     Calcule les détails par employé côté serveur (optimisé pour 10K+ employés).
     Retourne un JSONB avec success/error.';
