-- Fix 5: Drop role column from profiles table (critical security fix)
ALTER TABLE profiles DROP COLUMN IF EXISTS role;

-- Fix 6: Update handle_new_user trigger to NOT set role in profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'EMPLOYEE');
  
  -- Insert into profiles WITHOUT role column
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    first_name,
    last_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  -- Create the subscription by default
  INSERT INTO public.user_subscriptions (user_id, credits_remaining)
  VALUES (NEW.id, 100);
  
  -- Assign role in user_roles table (secure table)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role);
  
  RETURN NEW;
END;
$$;