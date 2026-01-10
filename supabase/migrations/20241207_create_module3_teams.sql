-- ============================================
-- MIGRATION: Create module3_teams table
-- Purpose: Store team entities with names for Module 3 HCM Cost Savings
-- Each business_line can have multiple teams (based on team_count from Module 1)
-- ============================================

-- 1. Create the module3_teams table
CREATE TABLE IF NOT EXISTS module3_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_line_id UUID NOT NULL REFERENCES business_lines(id) ON DELETE CASCADE,
    team_number INTEGER NOT NULL CHECK (team_number >= 1),
    team_name VARCHAR(255) NOT NULL,
    team_mission TEXT,
    team_leader_id UUID REFERENCES module3_team_members(id) ON DELETE SET NULL,
    is_configured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique team numbers per business line
    UNIQUE(business_line_id, team_number)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_module3_teams_business_line ON module3_teams(business_line_id);
CREATE INDEX IF NOT EXISTS idx_module3_teams_team_number ON module3_teams(business_line_id, team_number);

-- 3. Enable RLS
ALTER TABLE module3_teams ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Policy: Users can view teams of their company's business lines
CREATE POLICY "Users can view teams of their company"
ON module3_teams
FOR SELECT
USING (
    business_line_id IN (
        SELECT bl.id FROM business_lines bl
        JOIN profiles p ON bl.company_id = p.company_id
        WHERE p.id = auth.uid()
    )
);

-- Policy: Users can insert teams for their company's business lines
CREATE POLICY "Users can insert teams for their company"
ON module3_teams
FOR INSERT
WITH CHECK (
    business_line_id IN (
        SELECT bl.id FROM business_lines bl
        JOIN profiles p ON bl.company_id = p.company_id
        WHERE p.id = auth.uid()
    )
);

-- Policy: Users can update teams of their company's business lines
CREATE POLICY "Users can update teams of their company"
ON module3_teams
FOR UPDATE
USING (
    business_line_id IN (
        SELECT bl.id FROM business_lines bl
        JOIN profiles p ON bl.company_id = p.company_id
        WHERE p.id = auth.uid()
    )
);

-- Policy: Users can delete teams of their company's business lines
CREATE POLICY "Users can delete teams of their company"
ON module3_teams
FOR DELETE
USING (
    business_line_id IN (
        SELECT bl.id FROM business_lines bl
        JOIN profiles p ON bl.company_id = p.company_id
        WHERE p.id = auth.uid()
    )
);

-- 5. Add team_id foreign key to module3_team_members (link employees to teams)
ALTER TABLE module3_team_members
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES module3_teams(id) ON DELETE SET NULL;

-- 6. Create index for team_id lookups
CREATE INDEX IF NOT EXISTS idx_module3_team_members_team_id ON module3_team_members(team_id);

-- 7. Updated_at trigger
CREATE OR REPLACE FUNCTION update_module3_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_module3_teams_updated_at
    BEFORE UPDATE ON module3_teams
    FOR EACH ROW
    EXECUTE FUNCTION update_module3_teams_updated_at();

-- ============================================
-- SUMMARY:
-- - Table module3_teams created with RLS
-- - Links to business_lines (parent)
-- - Links to module3_team_members (team_leader_id)
-- - module3_team_members now has team_id FK
-- ============================================
