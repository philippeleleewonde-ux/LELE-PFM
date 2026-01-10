-- Migration: Fix RLS policies for companies and scores
-- Date: 2025-11-30
-- Description: Unblocks INSERT/UPDATE operations by adding RLS policies for authenticated users.

-- 1. Ensure RLS is enabled
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_performance_scores ENABLE ROW LEVEL SECURITY;

-- 2. Policies for 'companies' table
-- Allow any authenticated user to create a company
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;
CREATE POLICY "Authenticated users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to view companies (needed for the check existing logic)
DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;
CREATE POLICY "Authenticated users can view companies"
ON public.companies
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update companies
DROP POLICY IF EXISTS "Authenticated users can update companies" ON public.companies;
CREATE POLICY "Authenticated users can update companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (true);

-- 3. Policies for 'company_performance_scores' table
-- Allow insert
DROP POLICY IF EXISTS "Authenticated users can insert scores" ON public.company_performance_scores;
CREATE POLICY "Authenticated users can insert scores"
ON public.company_performance_scores
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow select
DROP POLICY IF EXISTS "Authenticated users can view scores" ON public.company_performance_scores;
CREATE POLICY "Authenticated users can view scores"
ON public.company_performance_scores
FOR SELECT
TO authenticated
USING (true);
