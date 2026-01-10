-- Migration: Multi-Tenant Architecture - Companies Table
-- Purpose: Store tenant companies with dedicated PostgreSQL schemas
-- Created: 2025-11-09

-- ============================================================================
-- 1. CREATE COMPANIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company info
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,

  -- Multi-tenant schema
  schema_name TEXT NOT NULL UNIQUE,

  -- Ownership (who created this company)
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Metadata
  settings JSONB DEFAULT '{}'::jsonb,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_schema_name ON public.companies(schema_name);
CREATE INDEX IF NOT EXISTS idx_companies_owner_user_id ON public.companies(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies(is_active) WHERE is_active = true;

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Allow users to see companies they own or are members of
CREATE POLICY "Users can view their own companies"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    owner_user_id = auth.uid()
    -- TODO: Add OR EXISTS (SELECT 1 FROM company_members WHERE user_id = auth.uid())
  );

-- Allow authenticated users to create companies
CREATE POLICY "Authenticated users can create companies"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_user_id = auth.uid()
  );

-- Allow company owners to update their companies
CREATE POLICY "Company owners can update their companies"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Prevent deletion (soft delete via is_active instead)
CREATE POLICY "Prevent company deletion"
  ON public.companies
  FOR DELETE
  TO authenticated
  USING (false);

-- ============================================================================
-- 4. TRIGGER: Auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. FUNCTION: Generate schema name from slug
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_schema_name(company_slug TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Convert slug to valid PostgreSQL schema name
  -- Example: "acme-corp" → "tenant_acme_corp"
  RETURN 'tenant_' || LOWER(REGEXP_REPLACE(company_slug, '[^a-z0-9_]', '_', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 6. FUNCTION: Create tenant schema automatically
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_tenant_schema()
RETURNS TRIGGER AS $$
BEGIN
  -- Create the schema if it doesn't exist
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', NEW.schema_name);

  -- Grant usage to authenticated users
  EXECUTE format('GRANT USAGE ON SCHEMA %I TO authenticated', NEW.schema_name);

  -- Set search_path to include the new schema
  EXECUTE format('GRANT ALL ON SCHEMA %I TO postgres', NEW.schema_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create schema on company insert
CREATE TRIGGER create_tenant_schema_on_insert
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.create_tenant_schema();

-- ============================================================================
-- 7. FUNCTION: Helper to get current user's company
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_company_schema()
RETURNS TEXT AS $$
DECLARE
  company_schema TEXT;
BEGIN
  SELECT schema_name INTO company_schema
  FROM public.companies
  WHERE owner_user_id = auth.uid()
    AND is_active = true
  LIMIT 1;

  RETURN company_schema;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_company_schema TO authenticated;

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.companies IS 'Multi-tenant companies table - each company gets its own PostgreSQL schema';
COMMENT ON COLUMN public.companies.slug IS 'URL-friendly unique identifier (e.g., acme-corp)';
COMMENT ON COLUMN public.companies.schema_name IS 'PostgreSQL schema name for data isolation (e.g., tenant_acme_corp)';
COMMENT ON COLUMN public.companies.owner_user_id IS 'User who created this company (typically the CEO)';
COMMENT ON COLUMN public.companies.settings IS 'Company-specific settings (branding, features, etc.)';

COMMENT ON FUNCTION public.generate_schema_name IS 'Converts company slug to valid PostgreSQL schema name';
COMMENT ON FUNCTION public.create_tenant_schema IS 'Automatically creates a PostgreSQL schema when a company is inserted';
COMMENT ON FUNCTION public.get_user_company_schema IS 'Returns the schema name for the current authenticated user';

-- ============================================================================
-- 9. EXAMPLE: Seed data for testing (OPTIONAL - comment out for production)
-- ============================================================================

-- Uncomment this block to create a test company during development
/*
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get the first CEO user (replace with actual user ID)
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE user_metadata->>'role' = 'CEO'
  LIMIT 1;

  IF test_user_id IS NOT NULL THEN
    INSERT INTO public.companies (name, slug, schema_name, owner_user_id)
    VALUES (
      'LELE Test Company',
      'lele-test',
      public.generate_schema_name('lele-test'),
      test_user_id
    )
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;
*/
