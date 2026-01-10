-- ============================================
-- MIGRATION: Add Team Leader and Mission to Business Lines
-- Date: 2025-12-03
-- Purpose: Store Team Leader name and Team Mission for each business line
--          Used by Module 3 (Cost Savings) and Data Mapping
-- ============================================

-- 1. ADD team_leader COLUMN to business_lines
ALTER TABLE business_lines
ADD COLUMN IF NOT EXISTS team_leader TEXT;

COMMENT ON COLUMN business_lines.team_leader IS 'Name of the team leader for this business line (Module 3)';

-- 2. ADD team_mission COLUMN to business_lines
ALTER TABLE business_lines
ADD COLUMN IF NOT EXISTS team_mission TEXT;

COMMENT ON COLUMN business_lines.team_mission IS 'Main mission/objective of the team (Module 3)';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check columns added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'business_lines'
  AND column_name IN ('team_leader', 'team_mission');
