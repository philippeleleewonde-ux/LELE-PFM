-- ============================================
-- MIGRATION: Add KPI-Specific Columns to module3_cost_entries
-- Date: 2025-12-03
-- Purpose: Ajouter les colonnes spécifiques pour chaque type de KPI
--          - QD (Quality Defects): defect_types
--          - OA (Occupational Accidents): responsibility_level
--          - DDP (Direct Productivity): selected_days, recovered_time, saved_expenses
-- ============================================

-- =========================================
-- 1. QUALITY DEFECTS (QD) - Défauts Qualité
-- =========================================

-- Colonne pour stocker les types de défauts sélectionnés (array)
-- Valeurs possibles: 'retouch', 'rubbish', 'repair', 'dropout', 'return', 'other'
ALTER TABLE module3_cost_entries
ADD COLUMN IF NOT EXISTS defect_types TEXT[] DEFAULT '{}';

COMMENT ON COLUMN module3_cost_entries.defect_types IS
'Types de défauts qualité sélectionnés (QD): retouch, rubbish, repair, dropout, return, other';

-- Index GIN pour recherche efficace dans l'array
CREATE INDEX IF NOT EXISTS idx_cost_entries_defect_types
ON module3_cost_entries USING GIN (defect_types);


-- =========================================
-- 2. OCCUPATIONAL ACCIDENTS (OA) - Accidents de Travail
-- =========================================

-- Colonne pour le niveau de responsabilité (0-5)
-- none=0, little=1, insufficient=2, average=3, partial=4, total=5
ALTER TABLE module3_cost_entries
ADD COLUMN IF NOT EXISTS responsibility_level TEXT DEFAULT NULL;

COMMENT ON COLUMN module3_cost_entries.responsibility_level IS
'Niveau de responsabilité de l''employé (OA): none, little, insufficient, average, partial, total';

-- Index pour filtrage par niveau de responsabilité
CREATE INDEX IF NOT EXISTS idx_cost_entries_responsibility_level
ON module3_cost_entries(responsibility_level)
WHERE responsibility_level IS NOT NULL;


-- =========================================
-- 3. DIRECT PRODUCTIVITY (DDP) - Écarts de Productivité
-- =========================================

-- Colonne pour les jours sélectionnés (array)
-- Valeurs possibles: 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
ALTER TABLE module3_cost_entries
ADD COLUMN IF NOT EXISTS selected_days TEXT[] DEFAULT '{}';

COMMENT ON COLUMN module3_cost_entries.selected_days IS
'Jours de la semaine sélectionnés (DDP): monday, tuesday, wednesday, thursday, friday, saturday, sunday';

-- Index GIN pour recherche dans les jours
CREATE INDEX IF NOT EXISTS idx_cost_entries_selected_days
ON module3_cost_entries USING GIN (selected_days);

-- Colonnes pour le temps récupéré
ALTER TABLE module3_cost_entries
ADD COLUMN IF NOT EXISTS recovered_time_hours INTEGER DEFAULT 0
CHECK (recovered_time_hours >= 0 AND recovered_time_hours <= 24);

ALTER TABLE module3_cost_entries
ADD COLUMN IF NOT EXISTS recovered_time_minutes INTEGER DEFAULT 0
CHECK (recovered_time_minutes >= 0 AND recovered_time_minutes <= 59);

COMMENT ON COLUMN module3_cost_entries.recovered_time_hours IS
'Heures de temps récupéré et réalloué (DDP)';
COMMENT ON COLUMN module3_cost_entries.recovered_time_minutes IS
'Minutes de temps récupéré et réalloué (DDP)';

-- Colonne calculée pour le temps récupéré total en minutes
ALTER TABLE module3_cost_entries
ADD COLUMN IF NOT EXISTS total_recovered_minutes INTEGER
GENERATED ALWAYS AS (COALESCE(recovered_time_hours, 0) * 60 + COALESCE(recovered_time_minutes, 0)) STORED;

COMMENT ON COLUMN module3_cost_entries.total_recovered_minutes IS
'Temps total récupéré en minutes (calculé automatiquement)';

-- Colonne pour les économies réalisées
ALTER TABLE module3_cost_entries
ADD COLUMN IF NOT EXISTS saved_expenses NUMERIC(12, 2) DEFAULT 0
CHECK (saved_expenses >= 0);

COMMENT ON COLUMN module3_cost_entries.saved_expenses IS
'Montant des économies réalisées en euros (DDP)';


-- =========================================
-- 4. UPDATE ANALYTICS VIEWS
-- =========================================

-- Vue: Résumé des défauts qualité par type
CREATE OR REPLACE VIEW module3_quality_defects_summary AS
SELECT
    company_id,
    business_line_id,
    UNNEST(defect_types) as defect_type,
    COUNT(*) as occurrence_count,
    SUM(compensation_amount) as total_compensation,
    AVG(total_duration_minutes) as avg_duration_minutes
FROM module3_cost_entries
WHERE kpi_type = 'qd' AND defect_types IS NOT NULL AND array_length(defect_types, 1) > 0
GROUP BY company_id, business_line_id, UNNEST(defect_types)
ORDER BY occurrence_count DESC;

-- Vue: Résumé des accidents par niveau de responsabilité
CREATE OR REPLACE VIEW module3_accidents_by_responsibility AS
SELECT
    company_id,
    business_line_id,
    responsibility_level,
    COUNT(*) as accident_count,
    COUNT(DISTINCT employee_id) as affected_employees,
    SUM(compensation_amount) as total_compensation,
    SUM(total_duration_minutes) as total_duration_minutes
FROM module3_cost_entries
WHERE kpi_type = 'oa' AND responsibility_level IS NOT NULL
GROUP BY company_id, business_line_id, responsibility_level
ORDER BY
    CASE responsibility_level
        WHEN 'total' THEN 5
        WHEN 'partial' THEN 4
        WHEN 'average' THEN 3
        WHEN 'insufficient' THEN 2
        WHEN 'little' THEN 1
        WHEN 'none' THEN 0
        ELSE -1
    END DESC;

-- Vue: Résumé de la productivité par jour de semaine
CREATE OR REPLACE VIEW module3_productivity_by_day AS
SELECT
    company_id,
    business_line_id,
    UNNEST(selected_days) as weekday,
    COUNT(*) as entry_count,
    SUM(total_duration_minutes) as total_planned_minutes,
    SUM(total_recovered_minutes) as total_recovered_minutes,
    SUM(compensation_amount) as total_planned_expenses,
    SUM(saved_expenses) as total_saved_expenses,
    ROUND(
        CASE
            WHEN SUM(compensation_amount) > 0
            THEN (SUM(saved_expenses) / SUM(compensation_amount)) * 100
            ELSE 0
        END, 2
    ) as savings_percentage
FROM module3_cost_entries
WHERE kpi_type = 'ddp' AND selected_days IS NOT NULL AND array_length(selected_days, 1) > 0
GROUP BY company_id, business_line_id, UNNEST(selected_days)
ORDER BY
    CASE UNNEST(selected_days)
        WHEN 'monday' THEN 1
        WHEN 'tuesday' THEN 2
        WHEN 'wednesday' THEN 3
        WHEN 'thursday' THEN 4
        WHEN 'friday' THEN 5
        WHEN 'saturday' THEN 6
        WHEN 'sunday' THEN 7
        ELSE 8
    END;

-- Vue: Résumé global DDP avec métriques de productivité
CREATE OR REPLACE VIEW module3_productivity_summary AS
SELECT
    company_id,
    business_line_id,
    COUNT(*) as entry_count,
    SUM(total_duration_minutes) as total_planned_minutes,
    SUM(total_recovered_minutes) as total_recovered_minutes,
    ROUND(
        CASE
            WHEN SUM(total_duration_minutes) > 0
            THEN (SUM(total_recovered_minutes)::NUMERIC / SUM(total_duration_minutes)) * 100
            ELSE 0
        END, 2
    ) as time_recovery_percentage,
    SUM(compensation_amount) as total_planned_expenses,
    SUM(saved_expenses) as total_saved_expenses,
    ROUND(
        CASE
            WHEN SUM(compensation_amount) > 0
            THEN (SUM(saved_expenses) / SUM(compensation_amount)) * 100
            ELSE 0
        END, 2
    ) as expense_savings_percentage
FROM module3_cost_entries
WHERE kpi_type = 'ddp'
GROUP BY company_id, business_line_id;


-- =========================================
-- 5. VERIFICATION
-- =========================================

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'module3_cost_entries'
AND column_name IN (
    'defect_types',
    'responsibility_level',
    'selected_days',
    'recovered_time_hours',
    'recovered_time_minutes',
    'total_recovered_minutes',
    'saved_expenses'
)
ORDER BY column_name;

-- Vérifier les index créés
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'module3_cost_entries'
AND indexname LIKE '%defect%' OR indexname LIKE '%responsibility%' OR indexname LIKE '%selected%'
ORDER BY indexname;
