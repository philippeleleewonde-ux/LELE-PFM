-- Migration: Secure multi-tenant architecture
-- Created: 2025-11-15
-- Author: elite-saas-developer
-- Issue: company_id is nullable, breaking multi-tenant isolation

-- Step 1: Create a default company for orphaned users (if needed)
-- This ensures no data loss during migration
INSERT INTO companies (id, name, created_at)
VALUES (
  'default-company-migration',
  'Migration Default Company',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Update all profiles with NULL company_id to point to default company
-- In production, you should manually assign these users to real companies first
UPDATE profiles
SET company_id = 'default-company-migration'
WHERE company_id IS NULL;

-- Step 3: Make company_id NOT NULL
ALTER TABLE profiles
ALTER COLUMN company_id SET NOT NULL;

-- Step 4: Add foreign key constraint for referential integrity
-- This ensures company_id always points to a valid company
ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_company
FOREIGN KEY (company_id)
REFERENCES companies(id)
ON DELETE CASCADE -- If company deleted, cascade delete all profiles
ON UPDATE CASCADE; -- If company id changes, update all profiles

-- Step 5: Add index on company_id for performance (critical for RLS policies)
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);

-- Step 6: Add unique constraint on email per company (prevent duplicate emails within same company)
-- This allows same email across different companies (common in consulting/banking scenarios)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_company_unique
ON profiles(email, company_id);

-- Step 7: Ensure companies table has required structure
-- Add index on companies(id) if not exists (should already exist as primary key)
CREATE INDEX IF NOT EXISTS idx_companies_id ON companies(id);

-- Step 8: Add company_id to other critical tables if missing

-- For banker_access_grants table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'banker_access_grants') THEN
    -- Ensure banker_access_grants has company_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'banker_access_grants' AND column_name = 'company_id'
    ) THEN
      ALTER TABLE banker_access_grants ADD COLUMN company_id TEXT;
      -- Set default company for existing records
      UPDATE banker_access_grants SET company_id = 'default-company-migration' WHERE company_id IS NULL;
      ALTER TABLE banker_access_grants ALTER COLUMN company_id SET NOT NULL;
      ALTER TABLE banker_access_grants ADD CONSTRAINT fk_banker_access_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
      CREATE INDEX idx_banker_access_company_id ON banker_access_grants(company_id);
    END IF;
  END IF;
END $$;

-- Verification queries (commented out - run manually to verify)
-- SELECT COUNT(*) as orphaned_profiles FROM profiles WHERE company_id IS NULL; -- Should return 0
-- SELECT company_id, COUNT(*) as profile_count FROM profiles GROUP BY company_id ORDER BY profile_count DESC;
-- SELECT * FROM companies WHERE id = 'default-company-migration'; -- Check if default company was created
