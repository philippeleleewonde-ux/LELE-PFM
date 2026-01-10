-- Migration: Multi-Tenant Schema Tables Template
-- Purpose: Create tables in each tenant schema for HCM data
-- Created: 2025-11-09

-- ============================================================================
-- FUNCTION: Create all tables in a tenant schema
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_tenant_tables(tenant_schema TEXT)
RETURNS void AS $$
BEGIN
  -- ============================================================================
  -- 1. EMPLOYEES TABLE
  -- ============================================================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.employees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      -- Employee info
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      employee_id TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,

      -- Role & Position
      role TEXT NOT NULL CHECK (role IN (''CEO'', ''RH_MANAGER'', ''EMPLOYEE'', ''TEAM_LEADER'')),
      department TEXT,
      position TEXT,
      team_name TEXT,
      manager_id UUID REFERENCES %I.employees(id),

      -- Status
      is_active BOOLEAN DEFAULT true,
      hire_date DATE,

      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )', tenant_schema, tenant_schema);

  -- Indexes for employees
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_employees_user_id ON %I.employees(user_id)',
    tenant_schema, tenant_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_employees_email ON %I.employees(email)',
    tenant_schema, tenant_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_employees_role ON %I.employees(role)',
    tenant_schema, tenant_schema);

  -- ============================================================================
  -- 2. PERFORMANCE PLANS TABLE (Module 1)
  -- ============================================================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.performance_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      -- Plan info
      name TEXT NOT NULL,
      description TEXT,

      -- Timeline (3 years)
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,

      -- Financial projections
      initial_cost NUMERIC(12, 2),
      year_1_savings NUMERIC(12, 2),
      year_2_savings NUMERIC(12, 2),
      year_3_savings NUMERIC(12, 2),
      total_projected_savings NUMERIC(12, 2) GENERATED ALWAYS AS (
        COALESCE(year_1_savings, 0) + COALESCE(year_2_savings, 0) + COALESCE(year_3_savings, 0)
      ) STORED,

      -- Ownership
      created_by UUID REFERENCES %I.employees(id),
      assigned_to UUID REFERENCES %I.employees(id),

      -- Status
      status TEXT DEFAULT ''draft'' CHECK (status IN (''draft'', ''active'', ''completed'', ''cancelled'')),

      -- Metadata
      tags TEXT[],

      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )', tenant_schema, tenant_schema, tenant_schema);

  -- Indexes for performance_plans
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_performance_plans_status ON %I.performance_plans(status)',
    tenant_schema, tenant_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_performance_plans_assigned_to ON %I.performance_plans(assigned_to)',
    tenant_schema, tenant_schema);

  -- ============================================================================
  -- 3. COST SAVINGS TABLE (Module 3)
  -- ============================================================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.cost_savings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      -- Link to performance plan
      performance_plan_id UUID REFERENCES %I.performance_plans(id) ON DELETE CASCADE,

      -- Week tracking
      week_start_date DATE NOT NULL,
      week_number INTEGER NOT NULL,
      year INTEGER NOT NULL,

      -- Savings data
      actual_savings NUMERIC(12, 2) NOT NULL,
      projected_savings NUMERIC(12, 2),
      variance NUMERIC(12, 2) GENERATED ALWAYS AS (
        actual_savings - COALESCE(projected_savings, 0)
      ) STORED,

      -- Notes
      notes TEXT,

      -- Validation
      validated_by UUID REFERENCES %I.employees(id),
      validated_at TIMESTAMPTZ,

      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      -- Constraint: one entry per plan per week
      UNIQUE(performance_plan_id, week_start_date)
    )', tenant_schema, tenant_schema, tenant_schema);

  -- Indexes for cost_savings
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cost_savings_plan_id ON %I.cost_savings(performance_plan_id)',
    tenant_schema, tenant_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cost_savings_week ON %I.cost_savings(week_start_date)',
    tenant_schema, tenant_schema);

  -- ============================================================================
  -- 4. PERFORMANCE CARDS TABLE (Module 4)
  -- ============================================================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.performance_cards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      -- Link to employee and plan
      employee_id UUID REFERENCES %I.employees(id) ON DELETE CASCADE,
      performance_plan_id UUID REFERENCES %I.performance_plans(id) ON DELETE CASCADE,

      -- Activity tracking
      activity_name TEXT NOT NULL,
      activity_type TEXT CHECK (activity_type IN (''task'', ''goal'', ''milestone'', ''kpi'')),

      -- Performance metrics
      target_value NUMERIC(12, 2),
      actual_value NUMERIC(12, 2),
      completion_percentage INTEGER CHECK (completion_percentage >= 0 AND completion_percentage <= 100),

      -- Rating
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),

      -- Period
      period_start DATE,
      period_end DATE,

      -- Notes & Feedback
      notes TEXT,
      feedback TEXT,

      -- Status
      status TEXT DEFAULT ''in_progress'' CHECK (status IN (''not_started'', ''in_progress'', ''completed'', ''blocked'')),

      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )', tenant_schema, tenant_schema, tenant_schema);

  -- Indexes for performance_cards
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_performance_cards_employee ON %I.performance_cards(employee_id)',
    tenant_schema, tenant_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_performance_cards_plan ON %I.performance_cards(performance_plan_id)',
    tenant_schema, tenant_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_performance_cards_status ON %I.performance_cards(status)',
    tenant_schema, tenant_schema);

  -- ============================================================================
  -- 5. ENABLE RLS ON ALL TABLES
  -- ============================================================================
  EXECUTE format('ALTER TABLE %I.employees ENABLE ROW LEVEL SECURITY', tenant_schema);
  EXECUTE format('ALTER TABLE %I.performance_plans ENABLE ROW LEVEL SECURITY', tenant_schema);
  EXECUTE format('ALTER TABLE %I.cost_savings ENABLE ROW LEVEL SECURITY', tenant_schema);
  EXECUTE format('ALTER TABLE %I.performance_cards ENABLE ROW LEVEL SECURITY', tenant_schema);

  -- ============================================================================
  -- 6. CREATE RLS POLICIES (Basic - employees can view their own data)
  -- ============================================================================

  -- Employees: users can view all employees in their company
  EXECUTE format('
    CREATE POLICY "Employees can view company employees"
      ON %I.employees
      FOR SELECT
      TO authenticated
      USING (true)
  ', tenant_schema);

  -- Performance Plans: users can view plans
  EXECUTE format('
    CREATE POLICY "Users can view performance plans"
      ON %I.performance_plans
      FOR SELECT
      TO authenticated
      USING (true)
  ', tenant_schema);

  -- Cost Savings: users can view cost savings
  EXECUTE format('
    CREATE POLICY "Users can view cost savings"
      ON %I.cost_savings
      FOR SELECT
      TO authenticated
      USING (true)
  ', tenant_schema);

  -- Performance Cards: users can view their own performance cards
  EXECUTE format('
    CREATE POLICY "Users can view performance cards"
      ON %I.performance_cards
      FOR SELECT
      TO authenticated
      USING (
        employee_id IN (
          SELECT id FROM %I.employees WHERE user_id = auth.uid()
        )
      )
  ', tenant_schema, tenant_schema);

  -- ============================================================================
  -- 7. CREATE TRIGGERS FOR updated_at
  -- ============================================================================
  EXECUTE format('
    CREATE TRIGGER update_employees_updated_at
      BEFORE UPDATE ON %I.employees
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column()
  ', tenant_schema);

  EXECUTE format('
    CREATE TRIGGER update_performance_plans_updated_at
      BEFORE UPDATE ON %I.performance_plans
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column()
  ', tenant_schema);

  EXECUTE format('
    CREATE TRIGGER update_cost_savings_updated_at
      BEFORE UPDATE ON %I.cost_savings
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column()
  ', tenant_schema);

  EXECUTE format('
    CREATE TRIGGER update_performance_cards_updated_at
      BEFORE UPDATE ON %I.performance_cards
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column()
  ', tenant_schema);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_tenant_tables TO authenticated;

-- ============================================================================
-- TRIGGER: Automatically create tables when a new company is created
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_tenant_tables_on_company_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the function to create all tenant tables
  PERFORM public.create_tenant_tables(NEW.schema_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, then create new one
DROP TRIGGER IF EXISTS create_tenant_tables_trigger ON public.companies;

CREATE TRIGGER create_tenant_tables_trigger
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.create_tenant_tables_on_company_insert();
