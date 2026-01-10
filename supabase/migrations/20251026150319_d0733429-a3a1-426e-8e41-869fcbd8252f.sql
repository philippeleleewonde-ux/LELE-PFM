-- Fix 1b: Add CONSULTANT role to app_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CONSULTANT' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'CONSULTANT';
  END IF;
END $$;