-- Fix 1c: Add remaining roles to app_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'RH_MANAGER' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'RH_MANAGER';
  END IF;
END $$;