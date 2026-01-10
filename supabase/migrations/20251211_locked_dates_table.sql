-- ============================================
-- Migration: locked_dates_table
-- Date: 2025-12-11
-- Description: Ajoute le support pour les dates verrouillées (mode CASCADE)
-- ============================================

-- 1. Créer la table company_locked_dates
CREATE TABLE IF NOT EXISTS public.company_locked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('YEAR', 'QUARTER', 'MONTH', 'WEEK')),
    period_key TEXT NOT NULL,
    year_offset INTEGER NOT NULL CHECK (year_offset >= 0 AND year_offset <= 10),
    period_number INTEGER,
    locked_date DATE NOT NULL,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_by UUID REFERENCES auth.users(id),
    cascade_mode TEXT DEFAULT 'CASCADE' CHECK (cascade_mode IN ('CASCADE', 'INDEPENDENT', 'CHAIN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, period_type, period_key)
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_locked_dates_company_id ON public.company_locked_dates(company_id);
CREATE INDEX IF NOT EXISTS idx_locked_dates_period_type ON public.company_locked_dates(period_type);
CREATE INDEX IF NOT EXISTS idx_locked_dates_year_offset ON public.company_locked_dates(year_offset);

-- 3. Activer RLS
ALTER TABLE public.company_locked_dates ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer anciennes policies si existent
DROP POLICY IF EXISTS "Users can view their company locked dates" ON public.company_locked_dates;
DROP POLICY IF EXISTS "CEO can manage their company locked dates" ON public.company_locked_dates;

-- 5. Créer policies CORRIGÉES avec EXISTS (évite erreur uuid = text)
CREATE POLICY "Users can view their company locked dates"
ON public.company_locked_dates FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.company_id = company_locked_dates.company_id
    )
);

CREATE POLICY "CEO can manage their company locked dates"
ON public.company_locked_dates FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.user_roles ur ON ur.user_id::text = p.id::text
        WHERE p.id = auth.uid()
        AND ur.role = 'CEO'
        AND p.company_id = company_locked_dates.company_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.user_roles ur ON ur.user_id::text = p.id::text
        WHERE p.id = auth.uid()
        AND ur.role = 'CEO'
        AND p.company_id = company_locked_dates.company_id
    )
);

-- 6. Trigger pour mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_locked_dates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_locked_dates_updated_at ON public.company_locked_dates;
CREATE TRIGGER trigger_update_locked_dates_updated_at
    BEFORE UPDATE ON public.company_locked_dates
    FOR EACH ROW
    EXECUTE FUNCTION update_locked_dates_updated_at();

-- 7. Ajouter colonnes à company_launch_config pour stocker les dates verrouillées
ALTER TABLE public.company_launch_config
ADD COLUMN IF NOT EXISTS locked_dates_json JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.company_launch_config
ADD COLUMN IF NOT EXISTS cascade_mode TEXT DEFAULT 'CASCADE';
