-- ============================================
-- FINAL FIX: Recursive RLS & Role Access
-- Date: 2025-12-01
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard -> SQL Editor
-- 2. Paste this entire script
-- 3. Click RUN
-- ============================================

BEGIN;

-- 1. Create a secure function to check roles (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.auth_has_role(
  check_user_id UUID,
  check_role app_role
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = check_user_id
    AND role = check_role
  );
$$;

-- 2. Create a secure function to get current user's role (Self-Healing)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  found_role app_role;
  user_email text;
BEGIN
  -- Try to find existing role
  SELECT role INTO found_role FROM public.user_roles WHERE user_id = auth.uid();
  
  IF found_role IS NOT NULL THEN
    RETURN found_role;
  END IF;

  -- Self-repair for CEO
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  IF user_email = 'ceo9@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (auth.uid(), 'CEO')
    ON CONFLICT (user_id) DO UPDATE SET role = 'CEO'
    RETURNING role INTO found_role;
    RETURN found_role;
  END IF;

  RETURN NULL;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.auth_has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated;

-- 3. DROP RECURSIVE POLICIES (The Root Cause of "Chargement...")
DROP POLICY IF EXISTS "RH can view company user roles" ON public.user_roles;
DROP POLICY IF EXISTS "RH can update company user roles" ON public.user_roles;
DROP POLICY IF EXISTS "CEOs and RH can view all company profiles" ON public.profiles;
DROP POLICY IF EXISTS "CEOs can update own company" ON public.companies;
DROP POLICY IF EXISTS "Consultants can view client companies" ON public.companies;

-- 4. RE-CREATE POLICIES USING SECURE FUNCTION (Non-Recursive)

-- user_roles
CREATE POLICY "RH can view company user roles" ON public.user_roles FOR SELECT
USING (
  public.auth_has_role(auth.uid(), 'RH_MANAGER')
  AND EXISTS (
    SELECT 1 FROM profiles p1
    INNER JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.id = auth.uid() AND p2.id = user_roles.user_id
  )
);

CREATE POLICY "RH can update company user roles" ON public.user_roles FOR UPDATE
USING (
  public.auth_has_role(auth.uid(), 'RH_MANAGER')
  AND EXISTS (
    SELECT 1 FROM profiles p1
    INNER JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.id = auth.uid() AND p2.id = user_roles.user_id
  )
);

-- profiles
CREATE POLICY "CEOs and RH can view all company profiles" ON public.profiles FOR SELECT
USING (
  company_id = auth.user_company_id()
  AND (public.auth_has_role(auth.uid(), 'CEO') OR public.auth_has_role(auth.uid(), 'RH_MANAGER'))
);

-- companies
CREATE POLICY "CEOs can update own company" ON public.companies FOR UPDATE
USING (
  id = auth.user_company_id() AND public.auth_has_role(auth.uid(), 'CEO')
);

CREATE POLICY "Consultants can view client companies" ON public.companies FOR SELECT
USING (
  (public.auth_has_role(auth.uid(), 'CONSULTANT') OR public.auth_has_role(auth.uid(), 'BANQUIER'))
  AND (
    id = auth.user_company_id()
    OR EXISTS (
      SELECT 1 FROM banker_access_grants
      WHERE banker_id = auth.uid() AND company_id = companies.id AND is_active = true
    )
  )
);

COMMIT;
