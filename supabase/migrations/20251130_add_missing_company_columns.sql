-- Migration: Add missing columns to companies table
-- Date: 2025-11-30
-- Description: Adds industry, employees_count, and invitation_code to align DB with Frontend.

-- 1. Add 'industry' column
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS industry TEXT;

-- 2. Add 'employees_count' column
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS employees_count INTEGER DEFAULT 0;

-- 3. Add 'invitation_code' column
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS invitation_code TEXT;

-- 4. Add index for invitation_code for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_companies_invitation_code ON public.companies(invitation_code);

-- 5. Comment on columns for documentation
COMMENT ON COLUMN public.companies.industry IS 'Sector of activity (e.g., Banking, Insurance)';
COMMENT ON COLUMN public.companies.employees_count IS 'Total number of employees in the company';
COMMENT ON COLUMN public.companies.invitation_code IS 'Unique code for inviting other users to this company';
