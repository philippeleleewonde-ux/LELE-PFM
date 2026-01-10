-- ============================================
-- MIGRATION: Fix Business Lines RLS Recursion
-- Date: 2025-12-01
-- Purpose: Fix 500 Error caused by infinite recursion in "Users can view same company business lines" policy
-- ============================================

-- 1. Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view same company business lines" ON business_lines;

-- 2. Create the new safe policy
-- Instead of querying business_lines (recursion), we query the profiles table
-- to check if the user belongs to the same company.
CREATE POLICY "Users can view same company business lines"
ON business_lines
FOR SELECT
TO authenticated
USING (
  -- Cast both to text to ensure compatibility if types differ (UUID vs TEXT)
  company_id::text IN (
    SELECT company_id::text
    FROM profiles
    WHERE id = auth.uid()
  )
);

-- 3. Verification Comment
COMMENT ON POLICY "Users can view same company business lines" ON business_lines IS 'Fixed: Uses profiles table to avoid recursion';
