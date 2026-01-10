-- ============================================
-- EMERGENCY FIX: Self-Healing Role System
-- Apply this SQL directly in Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Create the self-healing get_my_role function
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

-- 2. Fix CEO user immediately (find by email and assign role)
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get CEO user ID
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'ceo9@gmail.com';

  IF target_user_id IS NOT NULL THEN
    -- Upsert CEO role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'CEO')
    ON CONFLICT (user_id) DO UPDATE SET role = 'CEO';

    RAISE NOTICE 'CEO role assigned to user: %', target_user_id;
  ELSE
    RAISE WARNING 'CEO user (ceo9@gmail.com) not found in auth.users';
  END IF;
END $$;

-- 3. Verify
SELECT
  u.email,
  ur.role,
  ur.created_at,
  ur.updated_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'ceo9@gmail.com';
