-- ============================================
-- MIGRATION: Optimize Business Lines RLS
-- Date: 2025-12-01
-- Purpose: Optimize the RLS policy by removing redundant casting to allow index usage
-- ============================================

-- 1. Drop the previous policy
DROP POLICY IF EXISTS "Users can view same company business lines" ON business_lines;

-- 2. Create the optimized policy
-- We remove the ::text cast on the left side (business_lines.company_id)
-- because the column is already TEXT. This allows Postgres to use the index.
-- We keep the cast on the right side (profiles.company_id) because that column is UUID.
CREATE POLICY "Users can view same company business lines"
ON business_lines
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id::text
    FROM profiles
    WHERE id = auth.uid()
  )
);

-- 3. Verification Comment
COMMENT ON POLICY "Users can view same company business lines" ON business_lines IS 'Optimized: Uses index on company_id by removing redundant cast';
