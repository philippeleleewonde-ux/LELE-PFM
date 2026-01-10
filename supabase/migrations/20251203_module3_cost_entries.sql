-- ============================================
-- MIGRATION: Module 3 Cost Entries Table
-- Date: 2025-12-03
-- Purpose: Stocker les entrées de coûts pour le contrôle des indicateurs de performance
--          Table utilisée par CostDataEntry.tsx (Section 2 - Cost Savings)
-- ============================================

-- 1. CREATE ENUM FOR KPI TYPES
DO $$ BEGIN
    CREATE TYPE kpi_type_enum AS ENUM ('abs', 'qd', 'oa', 'ddp', 'ekh');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CREATE TABLE module3_cost_entries
CREATE TABLE IF NOT EXISTS module3_cost_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Company & Business Line Context
    company_id TEXT NOT NULL,
    business_line_id UUID NOT NULL REFERENCES business_lines(id) ON DELETE CASCADE,

    -- Employee Reference
    employee_id UUID NOT NULL REFERENCES module3_team_members(id) ON DELETE CASCADE,

    -- KPI Type (Indicator)
    -- abs: Absenteeism (Absentéisme)
    -- qd: Quality Defects (Défauts Qualité)
    -- oa: Occupational Accidents (Accidents de Travail)
    -- ddp: Distances from Direct Productivity (Écarts de Productivité Directe)
    -- ekh: Distances from Know-how (Écarts de Savoir-faire)
    kpi_type TEXT NOT NULL CHECK (kpi_type IN ('abs', 'qd', 'oa', 'ddp', 'ekh')),

    -- Analysis Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Event Details
    event_date DATE NOT NULL,

    -- Duration of Impact
    duration_hours INTEGER NOT NULL DEFAULT 0 CHECK (duration_hours >= 0 AND duration_hours <= 24),
    duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0 AND duration_minutes <= 59),

    -- Financial Impact
    compensation_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (compensation_amount >= 0),

    -- Calculated field: Total duration in minutes (for aggregation)
    total_duration_minutes INTEGER GENERATED ALWAYS AS (duration_hours * 60 + duration_minutes) STORED,

    -- Audit Trail
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT cost_entries_valid_period CHECK (period_end >= period_start),
    CONSTRAINT cost_entries_event_in_period CHECK (event_date >= period_start AND event_date <= period_end)
);

-- 3. CREATE INDEXES for Performance
CREATE INDEX IF NOT EXISTS idx_cost_entries_company_id ON module3_cost_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_business_line_id ON module3_cost_entries(business_line_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_employee_id ON module3_cost_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_kpi_type ON module3_cost_entries(kpi_type);
CREATE INDEX IF NOT EXISTS idx_cost_entries_period ON module3_cost_entries(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_cost_entries_event_date ON module3_cost_entries(event_date);
CREATE INDEX IF NOT EXISTS idx_cost_entries_created_at ON module3_cost_entries(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_cost_entries_company_kpi ON module3_cost_entries(company_id, kpi_type);
CREATE INDEX IF NOT EXISTS idx_cost_entries_line_period ON module3_cost_entries(business_line_id, period_start, period_end);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE module3_cost_entries ENABLE ROW LEVEL SECURITY;

-- 5. CREATE RLS POLICIES

-- Policy: Users can INSERT cost entries for their company
CREATE POLICY "Users can insert cost entries for their company"
ON module3_cost_entries
FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT company_id
        FROM business_lines
        WHERE user_id = auth.uid()
        AND company_id IS NOT NULL
    )
);

-- Policy: Users can SELECT cost entries from their company
CREATE POLICY "Users can view cost entries from their company"
ON module3_cost_entries
FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT company_id
        FROM business_lines
        WHERE user_id = auth.uid()
        AND company_id IS NOT NULL
    )
);

-- Policy: Users can UPDATE cost entries they created
CREATE POLICY "Users can update their own cost entries"
ON module3_cost_entries
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Policy: Users can DELETE cost entries they created
CREATE POLICY "Users can delete their own cost entries"
ON module3_cost_entries
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- 6. CREATE TRIGGER for updated_at
CREATE OR REPLACE FUNCTION update_cost_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cost_entries_updated_at ON module3_cost_entries;
CREATE TRIGGER cost_entries_updated_at
BEFORE UPDATE ON module3_cost_entries
FOR EACH ROW
EXECUTE FUNCTION update_cost_entries_updated_at();

-- 7. CREATE VIEWS for Analytics

-- View: Aggregated costs by KPI and Business Line
CREATE OR REPLACE VIEW module3_cost_summary_by_kpi AS
SELECT
    company_id,
    business_line_id,
    kpi_type,
    COUNT(*) as entry_count,
    COUNT(DISTINCT employee_id) as affected_employees,
    SUM(total_duration_minutes) as total_duration_minutes,
    ROUND(SUM(total_duration_minutes) / 60.0, 2) as total_duration_hours,
    SUM(compensation_amount) as total_compensation,
    AVG(compensation_amount) as avg_compensation,
    MIN(event_date) as first_event,
    MAX(event_date) as last_event
FROM module3_cost_entries
GROUP BY company_id, business_line_id, kpi_type;

-- View: Monthly costs summary
CREATE OR REPLACE VIEW module3_cost_summary_monthly AS
SELECT
    company_id,
    business_line_id,
    kpi_type,
    DATE_TRUNC('month', event_date) as month,
    COUNT(*) as entry_count,
    SUM(total_duration_minutes) as total_duration_minutes,
    SUM(compensation_amount) as total_compensation
FROM module3_cost_entries
GROUP BY company_id, business_line_id, kpi_type, DATE_TRUNC('month', event_date)
ORDER BY month DESC;

-- View: Employee costs ranking
CREATE OR REPLACE VIEW module3_employee_cost_ranking AS
SELECT
    ce.company_id,
    ce.business_line_id,
    ce.employee_id,
    tm.name as employee_name,
    tm.professional_category,
    COUNT(*) as total_incidents,
    SUM(ce.total_duration_minutes) as total_duration_minutes,
    SUM(ce.compensation_amount) as total_compensation,
    ARRAY_AGG(DISTINCT ce.kpi_type) as kpi_types_affected
FROM module3_cost_entries ce
JOIN module3_team_members tm ON ce.employee_id = tm.id
GROUP BY ce.company_id, ce.business_line_id, ce.employee_id, tm.name, tm.professional_category
ORDER BY total_compensation DESC;

-- 8. COMMENTS for Documentation
COMMENT ON TABLE module3_cost_entries IS 'Entrées de coûts pour le contrôle des indicateurs de performance (Module 3 - Cost Savings)';
COMMENT ON COLUMN module3_cost_entries.kpi_type IS 'Type d''indicateur: abs (Absentéisme), qd (Défauts Qualité), oa (Accidents de Travail), ddp (Écarts de Productivité), ekh (Écarts de Savoir-faire)';
COMMENT ON COLUMN module3_cost_entries.period_start IS 'Date de début de la période d''analyse (semaine du...)';
COMMENT ON COLUMN module3_cost_entries.period_end IS 'Date de fin de la période d''analyse (...au...)';
COMMENT ON COLUMN module3_cost_entries.event_date IS 'Date de l''événement/incident';
COMMENT ON COLUMN module3_cost_entries.duration_hours IS 'Durée de l''impact en heures (0-24)';
COMMENT ON COLUMN module3_cost_entries.duration_minutes IS 'Durée de l''impact en minutes (0-59)';
COMMENT ON COLUMN module3_cost_entries.compensation_amount IS 'Montant des compensations payées en euros';
COMMENT ON COLUMN module3_cost_entries.total_duration_minutes IS 'Durée totale calculée en minutes (pour agrégation)';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check table created
SELECT tablename, schemaname
FROM pg_tables
WHERE tablename = 'module3_cost_entries';

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'module3_cost_entries';

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'module3_cost_entries'
ORDER BY policyname;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'module3_cost_entries'
ORDER BY indexname;
