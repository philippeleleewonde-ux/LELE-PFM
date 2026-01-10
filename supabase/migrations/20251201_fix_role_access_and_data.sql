-- ============================================
-- MIGRATION: Fix Role Access and Repair Data
-- Date: 2025-12-01
-- Purpose: 
-- 1. Create a secure RPC function to fetch user role (bypassing RLS issues).
-- 2. Repair data for 'ceo9@gmail.com' to ensure they have a role.
-- ============================================

-- 1. Create secure function to get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated;

-- 2. Repair data for ceo9@gmail.com (Idempotent)
DO $$
DECLARE
  target_email TEXT := 'ceo9@gmail.com';
  target_user_id UUID;
  target_company_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NOT NULL THEN
    
    -- Ensure Profile Exists
    SELECT company_id INTO target_company_id FROM public.profiles WHERE id = target_user_id;
    
    IF target_company_id IS NULL THEN
      -- Get or create company
      SELECT id INTO target_company_id FROM public.companies LIMIT 1;
      IF target_company_id IS NULL THEN
        INSERT INTO public.companies (name, slug) VALUES ('LELE HCM Default', 'lele-hcm-default') RETURNING id INTO target_company_id;
      END IF;
      
      -- Insert Profile
      INSERT INTO public.profiles (id, email, first_name, last_name, company_id)
      VALUES (target_user_id, target_email, 'CEO', 'User', target_company_id)
      ON CONFLICT (id) DO UPDATE SET company_id = EXCLUDED.company_id;
    END IF;

    -- Ensure Role Exists
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id) THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'CEO');
    ELSE
      UPDATE public.user_roles SET role = 'CEO' WHERE user_id = target_user_id;
    END IF;

  END IF;
END $$;
