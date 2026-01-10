-- ============================================
-- MIGRATION: Fix Recursive RLS on user_roles
-- Date: 2025-12-01
-- Purpose: The existing RLS policy for 'RH_MANAGER' on 'user_roles' table is recursive.
--          It queries 'user_roles' to check if the current user is an 'RH_MANAGER',
--          which triggers the RLS again, causing an infinite loop.
--          We fix this by using a SECURITY DEFINER function to check the role without RLS.
-- ============================================

-- 1. Create a secure function to check user role without triggering RLS
CREATE OR REPLACE FUNCTION public.auth_has_role(
  check_user_id UUID,
  check_role app_role
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER -- Bypasses RLS
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

-- 2. Drop the problematic recursive policies
DROP POLICY IF EXISTS "RH can view company user roles" ON public.user_roles;
DROP POLICY IF EXISTS "RH can update company user roles" ON public.user_roles;

-- 3. Re-create policies using the secure function
-- RH_MANAGERs can view roles of users in their company
CREATE POLICY "RH can view company user roles"
ON public.user_roles
FOR SELECT
USING (
  -- Check if current user is RH_MANAGER using the secure function (no recursion)
  public.auth_has_role(auth.uid(), 'RH_MANAGER')
  AND EXISTS (
    SELECT 1 FROM profiles p1
    INNER JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.id = auth.uid()
    AND p2.id = user_roles.user_id
  )
);

-- RH_MANAGERs can update roles of users in their company
CREATE POLICY "RH can update company user roles"
ON public.user_roles
FOR UPDATE
USING (
  public.auth_has_role(auth.uid(), 'RH_MANAGER')
  AND EXISTS (
    SELECT 1 FROM profiles p1
    INNER JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.id = auth.uid()
    AND p2.id = user_roles.user_id
  )
);

-- 4. Also optimize the profiles policy which might also be recursive if it queries user_roles directly
DROP POLICY IF EXISTS "CEOs and RH can view all company profiles" ON public.profiles;

CREATE POLICY "CEOs and RH can view all company profiles"
ON public.profiles
FOR SELECT
USING (
  company_id = auth.user_company_id()
  AND (
    public.auth_has_role(auth.uid(), 'CEO')
    OR
    public.auth_has_role(auth.uid(), 'RH_MANAGER')
  )
);

-- 5. Optimize companies policy
DROP POLICY IF EXISTS "CEOs can update own company" ON public.companies;

CREATE POLICY "CEOs can update own company"
ON public.companies
FOR UPDATE
USING (
  id = auth.user_company_id()
  AND public.auth_has_role(auth.uid(), 'CEO')
);

-- 6. Optimize consultant policy
DROP POLICY IF EXISTS "Consultants can view client companies" ON public.companies;

CREATE POLICY "Consultants can view client companies"
ON public.companies
FOR SELECT
USING (
  (
    public.auth_has_role(auth.uid(), 'CONSULTANT')
    OR
    public.auth_has_role(auth.uid(), 'BANQUIER')
  )
  AND (
    -- Either it's their own company
    id = auth.user_company_id()
    -- Or they have explicit access grant
    OR EXISTS (
      SELECT 1 FROM banker_access_grants
      WHERE banker_id = auth.uid()
      AND company_id = companies.id
      AND is_active = true
    )
  )
);
