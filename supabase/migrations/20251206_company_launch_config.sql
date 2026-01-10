-- ============================================
-- Migration: company_launch_config
-- Date: 2025-12-06
-- Description: Table pour stocker la date de lancement de la plateforme par entreprise
-- ============================================

-- CETTE MIGRATION EST OPTIONNELLE
-- Exécutez-la uniquement quand vous êtes prêt à utiliser le calendrier intelligent

-- Créer la table company_launch_config
CREATE TABLE IF NOT EXISTS public.company_launch_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL UNIQUE,
    platform_launch_date DATE NOT NULL,
    plan_duration_years INTEGER NOT NULL DEFAULT 3,
    fiscal_year_start_month INTEGER NOT NULL DEFAULT 1 CHECK (fiscal_year_start_month >= 1 AND fiscal_year_start_month <= 12),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour recherche rapide par company_id
CREATE INDEX IF NOT EXISTS idx_company_launch_config_company_id
ON public.company_launch_config(company_id);

-- Commentaires sur la table
COMMENT ON TABLE public.company_launch_config IS 'Configuration de la date de lancement de la plateforme par entreprise';
COMMENT ON COLUMN public.company_launch_config.platform_launch_date IS 'Date à laquelle l entreprise commence à utiliser la plateforme';
COMMENT ON COLUMN public.company_launch_config.plan_duration_years IS 'Durée du plan de performance en années (défaut: 3)';
COMMENT ON COLUMN public.company_launch_config.fiscal_year_start_month IS 'Mois de début de l année fiscale (1=janvier, défaut: 1)';

-- Activer RLS (Row Level Security)
ALTER TABLE public.company_launch_config ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir la config de leur entreprise
CREATE POLICY "Users can view their company launch config"
ON public.company_launch_config
FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- Politique: Les CEO peuvent modifier la config de leur entreprise
CREATE POLICY "CEO can manage their company launch config"
ON public.company_launch_config
FOR ALL
USING (
    company_id IN (
        SELECT p.company_id
        FROM public.profiles p
        JOIN public.user_roles ur ON ur.user_id = p.id
        WHERE p.id = auth.uid() AND ur.role = 'CEO'
    )
)
WITH CHECK (
    company_id IN (
        SELECT p.company_id
        FROM public.profiles p
        JOIN public.user_roles ur ON ur.user_id = p.id
        WHERE p.id = auth.uid() AND ur.role = 'CEO'
    )
);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_company_launch_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_company_launch_config_updated_at ON public.company_launch_config;
CREATE TRIGGER trigger_update_company_launch_config_updated_at
    BEFORE UPDATE ON public.company_launch_config
    FOR EACH ROW
    EXECUTE FUNCTION update_company_launch_config_updated_at();

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
