-- ============================================
-- MIGRATION: Business Lines Table
-- Date: 2025-11-27
-- Purpose: Centraliser le stockage des lignes d'activité
--          Utilisé par Module 1 (Performance Plan) et Module 3 (Cost Savings)
-- ============================================

-- 1. CREATE TABLE business_lines
-- Stockage des lignes d'activité par entreprise
CREATE TABLE IF NOT EXISTS business_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company & User info
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id TEXT, -- ID entreprise saisi manuellement par le CEO

  -- Business Line Info
  activity_name TEXT NOT NULL,
  staff_count INTEGER NOT NULL DEFAULT 0,
  team_count INTEGER NOT NULL DEFAULT 0,
  budget NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- Calculated fields
  budget_rate NUMERIC(5, 2), -- Pourcentage du budget total
  staff_rate NUMERIC(5, 2),  -- Pourcentage du staff total

  -- Display order (pour tri)
  display_order INTEGER,

  -- Metadata
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'datascanner', 'import')),
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT business_lines_name_length CHECK (char_length(activity_name) > 0),
  CONSTRAINT business_lines_positive_counts CHECK (staff_count >= 0 AND team_count >= 0),
  CONSTRAINT business_lines_positive_budget CHECK (budget >= 0)
);

-- 2. CREATE INDEXES
CREATE INDEX idx_business_lines_user_id ON business_lines(user_id);
CREATE INDEX idx_business_lines_company_id ON business_lines(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_business_lines_active ON business_lines(is_active) WHERE is_active = true;
CREATE INDEX idx_business_lines_created_at ON business_lines(created_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE business_lines ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES

-- Policy: Users can INSERT their own business lines
CREATE POLICY "Users can insert their own business lines"
ON business_lines
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can SELECT their own business lines
CREATE POLICY "Users can view their own business lines"
ON business_lines
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can UPDATE their own business lines
CREATE POLICY "Users can update their own business lines"
ON business_lines
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can DELETE their own business lines
CREATE POLICY "Users can delete their own business lines"
ON business_lines
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can SELECT business lines from same company
-- (pour partage entre employés d'une même entreprise)
CREATE POLICY "Users can view same company business lines"
ON business_lines
FOR SELECT
TO authenticated
USING (
  company_id IS NOT NULL
  AND company_id IN (
    SELECT company_id
    FROM business_lines
    WHERE user_id = auth.uid()
    AND company_id IS NOT NULL
  )
);

-- 5. CREATE TRIGGER for updated_at
CREATE OR REPLACE FUNCTION update_business_lines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_lines_updated_at
BEFORE UPDATE ON business_lines
FOR EACH ROW
EXECUTE FUNCTION update_business_lines_updated_at();

-- 6. CREATE VIEW for aggregated stats
CREATE OR REPLACE VIEW business_lines_stats AS
SELECT
  user_id,
  company_id,
  COUNT(*) as total_lines,
  SUM(staff_count) as total_staff,
  SUM(team_count) as total_teams,
  SUM(budget) as total_budget,
  AVG(budget) as avg_budget,
  MAX(created_at) as last_created_at
FROM business_lines
WHERE is_active = true
GROUP BY user_id, company_id;

-- 7. COMMENTS
COMMENT ON TABLE business_lines IS 'Stockage centralisé des lignes d''activité pour Module 1 et Module 3';
COMMENT ON COLUMN business_lines.company_id IS 'ID entreprise saisi manuellement par le CEO (non UUID)';
COMMENT ON COLUMN business_lines.source IS 'Origine de la donnée: manual, datascanner, import';
COMMENT ON COLUMN business_lines.display_order IS 'Ordre d''affichage dans les listes';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check table created
SELECT tablename, schemaname
FROM pg_tables
WHERE tablename = 'business_lines';

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'business_lines';

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'business_lines'
ORDER BY policyname;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'business_lines'
ORDER BY indexname;
