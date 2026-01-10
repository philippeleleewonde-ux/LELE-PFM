-- Migration: Enable Row-Level Security (RLS) and create tenant isolation policies
-- Created: 2025-11-15
-- Author: elite-saas-developer
-- Issue: No RLS enabled, CEO from Company A can see data from Company B

-- ============================================================================
-- STEP 1: Enable RLS on all critical tables
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on additional tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'banker_access_grants') THEN
    ALTER TABLE banker_access_grants ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_satisfaction_surveys') THEN
    ALTER TABLE employee_satisfaction_surveys ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_reviews') THEN
    ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'strategic_plans') THEN
    ALTER TABLE strategic_plans ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create helper function to get current user's company_id
-- ============================================================================

CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS TEXT AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Create RLS policies for PROFILES table
-- ============================================================================

-- Policy: Users can view profiles from their own company
CREATE POLICY "Users can view profiles from own company"
ON profiles
FOR SELECT
USING (company_id = auth.user_company_id());

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (id = auth.uid());

-- Policy: Users can insert their own profile (during registration)
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- Policy: CEOs and RH_MANAGERs can view all profiles in their company
CREATE POLICY "CEOs and RH can view all company profiles"
ON profiles
FOR SELECT
USING (
  company_id = auth.user_company_id()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('CEO', 'RH_MANAGER')
  )
);

-- Policy: RH_MANAGERs can update profiles in their company
CREATE POLICY "RH can update company profiles"
ON profiles
FOR UPDATE
USING (
  company_id = auth.user_company_id()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'RH_MANAGER'
  )
);

-- ============================================================================
-- STEP 4: Create RLS policies for COMPANIES table
-- ============================================================================

-- Policy: Users can view their own company
CREATE POLICY "Users can view own company"
ON companies
FOR SELECT
USING (id = auth.user_company_id());

-- Policy: CEOs can update their own company
CREATE POLICY "CEOs can update own company"
ON companies
FOR UPDATE
USING (
  id = auth.user_company_id()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'CEO'
  )
);

-- Policy: CONSULTANTs and BANQUIERs can view companies they have access to
CREATE POLICY "Consultants can view client companies"
ON companies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('CONSULTANT', 'BANQUIER')
  )
  AND (
    -- Either it's their own company
    id = auth.user_company_id()
    -- Or they have explicit access grant (for banker_access_grants table)
    OR EXISTS (
      SELECT 1 FROM banker_access_grants
      WHERE banker_id = auth.uid()
      AND company_id = companies.id
      AND is_active = true
    )
  )
);

-- ============================================================================
-- STEP 5: Create RLS policies for USER_ROLES table
-- ============================================================================

-- Policy: Users can view their own roles
CREATE POLICY "Users can view own roles"
ON user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Policy: RH_MANAGERs can view roles of users in their company
CREATE POLICY "RH can view company user roles"
ON user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p1
    INNER JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.id = auth.uid()
    AND p2.id = user_roles.user_id
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'RH_MANAGER'
    )
  )
);

-- Policy: RH_MANAGERs can update roles of users in their company
CREATE POLICY "RH can update company user roles"
ON user_roles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p1
    INNER JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.id = auth.uid()
    AND p2.id = user_roles.user_id
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'RH_MANAGER'
    )
  )
);

-- Policy: Users can insert their own role (during registration)
CREATE POLICY "Users can insert own role"
ON user_roles
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- STEP 6: Create RLS policies for BANKER_ACCESS_GRANTS (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'banker_access_grants') THEN

    -- Policy: Bankers can view their access grants
    EXECUTE 'CREATE POLICY "Bankers can view own access grants"
    ON banker_access_grants
    FOR SELECT
    USING (banker_id = auth.uid())';

    -- Policy: CEOs can view access grants for their company
    EXECUTE 'CREATE POLICY "CEOs can view company access grants"
    ON banker_access_grants
    FOR SELECT
    USING (
      company_id = auth.user_company_id()
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = ''CEO''
      )
    )';

    -- Policy: CEOs can manage access grants for their company
    EXECUTE 'CREATE POLICY "CEOs can manage company access grants"
    ON banker_access_grants
    FOR ALL
    USING (
      company_id = auth.user_company_id()
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = ''CEO''
      )
    )';

  END IF;
END $$;

-- ============================================================================
-- STEP 7: Create RLS policies for MODULE tables (generic pattern)
-- ============================================================================

-- Pattern for employee_satisfaction_surveys
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_satisfaction_surveys') THEN

    -- Users can view own surveys
    EXECUTE 'CREATE POLICY "Users can view own surveys"
    ON employee_satisfaction_surveys
    FOR SELECT
    USING (employee_id = auth.uid())';

    -- RH_MANAGERs can view all surveys in their company
    EXECUTE 'CREATE POLICY "RH can view company surveys"
    ON employee_satisfaction_surveys
    FOR SELECT
    USING (
      company_id = auth.user_company_id()
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = ''RH_MANAGER''
      )
    )';

    -- Note: CEOs CANNOT view satisfaction surveys (as per MODULE_PERMISSIONS)
    -- This is intentional for privacy reasons

  END IF;
END $$;

-- ============================================================================
-- STEP 8: Add audit trigger for compliance (GDPR)
-- ============================================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  user_id UUID NOT NULL,
  company_id TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only RH_MANAGERs and CEOs can view audit logs
CREATE POLICY "Only RH and CEO can view audit logs"
ON audit_logs
FOR SELECT
USING (
  company_id = auth.user_company_id()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('CEO', 'RH_MANAGER')
  )
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (table_name, operation, user_id, company_id, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    auth.uid(),
    COALESCE(NEW.company_id, OLD.company_id),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to profiles table
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
CREATE TRIGGER audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Verification queries (commented out - run manually to verify)
-- SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'companies', 'user_roles');
-- SELECT COUNT(*) FROM audit_logs; -- Should show audit trail
