-- ============================================
-- MIGRATION: Fix module3_cost_entries RLS Policies
-- Date: 2025-12-04
-- Purpose: Fix RLS policies that reference non-existent business_lines.user_id
--          Use profiles.company_id instead (same pattern as business_lines RLS fix)
-- ============================================

-- 1. DROP EXISTING PROBLEMATIC POLICIES
DROP POLICY IF EXISTS "Users can insert cost entries for their company" ON module3_cost_entries;
DROP POLICY IF EXISTS "Users can view cost entries from their company" ON module3_cost_entries;
DROP POLICY IF EXISTS "Users can update their own cost entries" ON module3_cost_entries;
DROP POLICY IF EXISTS "Users can delete their own cost entries" ON module3_cost_entries;

-- 2. CREATE FIXED POLICIES

-- Policy: Users can INSERT cost entries for their company
-- Uses profiles table to get user's company_id (avoids recursion/missing column issues)
CREATE POLICY "Users can insert cost entries for their company"
ON module3_cost_entries
FOR INSERT
TO authenticated
WITH CHECK (
    company_id::text IN (
        SELECT company_id::text
        FROM profiles
        WHERE id = auth.uid()
        AND company_id IS NOT NULL
    )
);

-- Policy: Users can SELECT cost entries from their company
CREATE POLICY "Users can view cost entries from their company"
ON module3_cost_entries
FOR SELECT
TO authenticated
USING (
    company_id::text IN (
        SELECT company_id::text
        FROM profiles
        WHERE id = auth.uid()
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

-- 3. VERIFICATION
COMMENT ON POLICY "Users can insert cost entries for their company" ON module3_cost_entries IS
'Fixed 2025-12-04: Uses profiles table to get company_id instead of business_lines.user_id';

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'module3_cost_entries'
ORDER BY policyname;
