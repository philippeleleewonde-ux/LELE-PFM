-- Migration: Fix app_role enum to align with frontend
-- Created: 2025-11-15
-- Author: elite-saas-developer
-- Issue: Database has 3 roles (admin, user, manager) but frontend expects 6 (CONSULTANT, BANQUIER, CEO, RH_MANAGER, EMPLOYEE, TEAM_LEADER)

-- Step 1: Create new enum with correct values
CREATE TYPE app_role_new AS ENUM (
  'CONSULTANT',
  'BANQUIER',
  'CEO',
  'RH_MANAGER',
  'EMPLOYEE',
  'TEAM_LEADER'
);

-- Step 2: Add temporary column to user_roles table
ALTER TABLE user_roles
ADD COLUMN role_new app_role_new;

-- Step 3: Migrate existing data with safe defaults
-- Map old roles to new roles:
-- admin -> CEO (most privileged)
-- manager -> RH_MANAGER (second most privileged)
-- user -> EMPLOYEE (default user)
UPDATE user_roles
SET role_new = CASE
  WHEN role = 'admin' THEN 'CEO'::app_role_new
  WHEN role = 'manager' THEN 'RH_MANAGER'::app_role_new
  WHEN role = 'user' THEN 'EMPLOYEE'::app_role_new
  ELSE 'EMPLOYEE'::app_role_new -- Fallback to EMPLOYEE for any unexpected values
END;

-- Step 4: Drop old column and rename new column
ALTER TABLE user_roles DROP COLUMN role;
ALTER TABLE user_roles RENAME COLUMN role_new TO role;

-- Step 5: Make role column NOT NULL (it should never be null)
ALTER TABLE user_roles ALTER COLUMN role SET NOT NULL;

-- Step 6: Drop old enum type
DROP TYPE app_role;

-- Step 7: Rename new enum to original name
ALTER TYPE app_role_new RENAME TO app_role;

-- Step 8: Add index on role for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Step 9: Add check constraint to ensure data integrity
ALTER TABLE user_roles
ADD CONSTRAINT valid_app_role CHECK (
  role IN ('CONSULTANT', 'BANQUIER', 'CEO', 'RH_MANAGER', 'EMPLOYEE', 'TEAM_LEADER')
);

-- Verification query (commented out - run manually to verify)
-- SELECT role, COUNT(*) as count FROM user_roles GROUP BY role ORDER BY count DESC;
