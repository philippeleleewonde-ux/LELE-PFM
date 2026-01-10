-- ============================================
-- MIGRATION: Self-Healing Role Access
-- Date: 2025-12-01
-- Purpose: Upgrade get_my_role to automatically repair missing roles for critical users.
--          This ensures high availability and prevents "Role not defined" errors.
-- ============================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS
STABLE
SET search_path = public
AS $$
DECLARE
  found_role app_role;
  user_email text;
BEGIN
  -- 1. Try to find existing role
  SELECT role INTO found_role FROM public.user_roles WHERE user_id = auth.uid();
  
  IF found_role IS NOT NULL THEN
    RETURN found_role;
  END IF;

  -- 2. If not found, perform emergency self-repair based on email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  -- Logic for CEO
  IF user_email = 'ceo9@gmail.com' THEN
    -- Insert or Update to ensure CEO role
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (auth.uid(), 'CEO')
    ON CONFLICT (user_id) DO UPDATE SET role = 'CEO'
    RETURNING role INTO found_role;
    
    RETURN found_role;
  END IF;

  -- Logic for other missing roles (Default to EMPLOYEE)
  IF user_email IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (auth.uid(), 'EMPLOYEE')
    ON CONFLICT (user_id) DO NOTHING
    RETURNING role INTO found_role;
    
    RETURN found_role;
  END IF;

  RETURN NULL;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated;
