-- ============================================
-- MIGRATION: Add team_number column to module3_team_members
-- Purpose: Allow filtering employees by team within a business line
-- ============================================

-- 1. Add team_number column to module3_team_members
ALTER TABLE module3_team_members
ADD COLUMN IF NOT EXISTS team_number INTEGER DEFAULT 1;

-- 2. Add constraint to ensure team_number is positive
ALTER TABLE module3_team_members
ADD CONSTRAINT check_team_number_positive CHECK (team_number >= 1);

-- 3. Create index for faster team filtering
CREATE INDEX IF NOT EXISTS idx_module3_team_members_team_number
ON module3_team_members(business_line_id, team_number);

-- 4. Add comment for documentation
COMMENT ON COLUMN module3_team_members.team_number IS 'Team number within the business line (1, 2, 3...). Used to filter employees by team.';

-- ============================================
-- SUMMARY:
-- - Added team_number column (INTEGER, default 1)
-- - Added CHECK constraint for positive values
-- - Added index for performance
-- ============================================
