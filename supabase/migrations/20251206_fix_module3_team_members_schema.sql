-- ============================================
-- MIGRATION: Fix module3_team_members Schema
-- Date: 2025-12-06
-- Purpose: Add missing columns is_team_leader and company_id
--          Executed by COMET AI on Supabase
-- ============================================

-- 1. Add is_team_leader column
ALTER TABLE module3_team_members
ADD COLUMN IF NOT EXISTS is_team_leader BOOLEAN DEFAULT FALSE;

-- 2. Add company_id column for easier querying
ALTER TABLE module3_team_members
ADD COLUMN IF NOT EXISTS company_id UUID;

-- 3. Create index for team leader lookups
CREATE INDEX IF NOT EXISTS idx_module3_team_members_team_leader
ON module3_team_members(business_line_id, is_team_leader)
WHERE is_team_leader = TRUE;

-- 4. Create index for company_id lookups
CREATE INDEX IF NOT EXISTS idx_module3_team_members_company
ON module3_team_members(company_id)
WHERE company_id IS NOT NULL;

-- 5. Add comments
COMMENT ON COLUMN module3_team_members.is_team_leader IS 'TRUE si ce membre est le chef d équipe de sa business line';
COMMENT ON COLUMN module3_team_members.company_id IS 'Référence directe à la company pour faciliter les requêtes RLS';

-- ============================================
-- VERIFICATION
-- ============================================
-- Schema now has 15 columns including:
-- - is_team_leader (boolean, default false)
-- - company_id (uuid, nullable)
--
-- Test member inserted: Jean Dupont (TEST)
-- ID: 87eac139-5d77-4544-b387-931565d51835
-- ============================================
