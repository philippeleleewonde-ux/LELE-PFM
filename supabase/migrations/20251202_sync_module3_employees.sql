-- ============================================
-- MIGRATION: Synchronize Module 3 Team Members with Company Employees
-- Date: 2025-12-02
-- Purpose: Link module3_team_members to tenant schema employees table
--          Enable cross-module employee data sharing
-- ============================================

-- ============================================================================
-- 1. ADD employee_id COLUMN to module3_team_members
-- ============================================================================

ALTER TABLE public.module3_team_members
ADD COLUMN IF NOT EXISTS employee_id UUID;

COMMENT ON COLUMN public.module3_team_members.employee_id IS 'Reference to employee in tenant schema {schema}.employees';

-- ============================================================================
-- 2. CREATE FUNCTION: Sync Module3 Member to Company Employees Table
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_module3_member_to_employees()
RETURNS TRIGGER AS $$
DECLARE
  company_schema TEXT;
  business_line_record RECORD;
  generated_employee_id UUID;
  employee_email TEXT;
  name_parts TEXT[];
BEGIN
  -- Get the business line info to find user_id
  SELECT user_id INTO business_line_record
  FROM public.business_lines
  WHERE id = NEW.business_line_id;

  IF business_line_record IS NULL THEN
    RAISE EXCEPTION 'Business line not found: %', NEW.business_line_id;
  END IF;

  -- Get company schema for this user
  SELECT schema_name INTO company_schema
  FROM public.companies
  WHERE owner_user_id = business_line_record.user_id
    AND is_active = true
  LIMIT 1;

  IF company_schema IS NULL THEN
    RAISE NOTICE 'No active company found for user - skipping employee sync';
    RETURN NEW;
  END IF;

  -- Generate email from name (replace spaces with dots, lowercase, add domain)
  employee_email := LOWER(REPLACE(NEW.name, ' ', '.')) || '@company.local';

  -- Split name into first_name and last_name
  name_parts := string_to_array(NEW.name, ' ');

  -- Generate UUID for new employee
  generated_employee_id := gen_random_uuid();

  -- Insert employee into tenant schema employees table
  EXECUTE format('
    INSERT INTO %I.employees (
      id,
      employee_id,
      first_name,
      last_name,
      email,
      role,
      department,
      position,
      is_active,
      hire_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (email) DO UPDATE
    SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      position = EXCLUDED.position,
      updated_at = NOW()
    RETURNING id
  ', company_schema)
  USING
    generated_employee_id,
    'EMP-' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0'),  -- Random employee ID
    name_parts[1],                                            -- first_name
    COALESCE(name_parts[2], ''),                             -- last_name (empty if single name)
    employee_email,
    'EMPLOYEE',                                               -- default role
    'Module 3 - Cost Savings',                               -- department
    NEW.professional_category,                                -- position from category
    true,                                                     -- is_active
    CURRENT_DATE;                                            -- hire_date

  -- Update module3_team_members with the employee_id
  NEW.employee_id := generated_employee_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to sync employee to schema %: %', company_schema, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. CREATE TRIGGER: Auto-sync on Insert
-- ============================================================================

DROP TRIGGER IF EXISTS sync_module3_member_trigger ON public.module3_team_members;

CREATE TRIGGER sync_module3_member_trigger
  BEFORE INSERT ON public.module3_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_module3_member_to_employees();

-- ============================================================================
-- 4. CREATE FUNCTION: Get Employee Details from Module3 Member
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_module3_member_employee_details(member_id UUID)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  employee_email TEXT,
  employee_department TEXT,
  employee_position TEXT,
  tech_level TEXT,
  handicap_shape TEXT,
  incapacity_rate NUMERIC
) AS $$
DECLARE
  company_schema TEXT;
  member_record RECORD;
BEGIN
  -- Get the module3 member
  SELECT * INTO member_record
  FROM public.module3_team_members
  WHERE id = member_id;

  IF member_record IS NULL THEN
    RETURN;
  END IF;

  -- Get company schema via business_line
  SELECT c.schema_name INTO company_schema
  FROM public.companies c
  JOIN public.business_lines bl ON c.owner_user_id = bl.user_id
  WHERE bl.id = member_record.business_line_id
    AND c.is_active = true
  LIMIT 1;

  IF company_schema IS NULL THEN
    RETURN;
  END IF;

  -- Query employee from tenant schema
  RETURN QUERY EXECUTE format('
    SELECT
      e.id,
      e.first_name || '' '' || e.last_name AS name,
      e.email,
      e.department,
      e.position,
      $1 AS tech_level,
      $2 AS handicap_shape,
      $3 AS incapacity_rate
    FROM %I.employees e
    WHERE e.id = $4
  ', company_schema)
  USING
    member_record.tech_level,
    member_record.handicap_shape,
    member_record.incapacity_rate,
    member_record.employee_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_module3_member_employee_details TO authenticated;

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.sync_module3_member_to_employees IS 'Automatically sync module3_team_members to tenant employees table on insert';
COMMENT ON FUNCTION public.get_module3_member_employee_details IS 'Get full employee details including Module 3 specific data';

-- ============================================================================
-- 6. VERIFICATION QUERIES
-- ============================================================================

-- Check trigger exists
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'sync_module3_member_trigger';

-- Check function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname IN ('sync_module3_member_to_employees', 'get_module3_member_employee_details');
