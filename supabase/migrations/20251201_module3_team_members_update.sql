-- Add tech_level column to module3_team_members
ALTER TABLE module3_team_members 
ADD COLUMN IF NOT EXISTS tech_level TEXT DEFAULT 'Standard'; -- 'Standard', 'IA', 'Cobot', 'Autonomous'

-- Add comment to explain the column
COMMENT ON COLUMN module3_team_members.tech_level IS 'Technological reinforcement level: Standard, IA, Cobot, or Autonomous Agent';
