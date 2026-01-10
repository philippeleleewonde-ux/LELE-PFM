-- Migration: Création de la table historique pour company_launch_config
-- Date: 2025-12-06
-- Description: Table d'audit pour tracer les modifications et suppressions de configuration

-- Créer la table d'historique
CREATE TABLE IF NOT EXISTS public.company_launch_config_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform_launch_date DATE NOT NULL,
    plan_duration_years INTEGER NOT NULL DEFAULT 3,
    fiscal_year_start_month INTEGER DEFAULT 1,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    previous_launch_date DATE,
    previous_duration INTEGER,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Ajouter des commentaires pour documentation
COMMENT ON TABLE public.company_launch_config_history IS 'Historique des modifications de la configuration de date de lancement';
COMMENT ON COLUMN public.company_launch_config_history.action IS 'Type d''action: CREATE, UPDATE, DELETE';
COMMENT ON COLUMN public.company_launch_config_history.previous_launch_date IS 'Ancienne date de lancement (pour UPDATE)';
COMMENT ON COLUMN public.company_launch_config_history.previous_duration IS 'Ancienne durée du plan (pour UPDATE)';
COMMENT ON COLUMN public.company_launch_config_history.deleted_at IS 'Date de suppression (pour DELETE)';
COMMENT ON COLUMN public.company_launch_config_history.metadata IS 'Métadonnées additionnelles (user agent, IP, etc.)';

-- Créer un index pour les requêtes par company_id
CREATE INDEX IF NOT EXISTS idx_launch_config_history_company_id
ON public.company_launch_config_history(company_id);

-- Créer un index pour les requêtes par date
CREATE INDEX IF NOT EXISTS idx_launch_config_history_created_at
ON public.company_launch_config_history(created_at DESC);

-- Activer RLS (Row Level Security)
ALTER TABLE public.company_launch_config_history ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leur propre historique
CREATE POLICY "Users can view their own launch config history"
ON public.company_launch_config_history
FOR SELECT
USING (auth.uid() = company_id);

-- Politique pour permettre l'insertion (via le service)
CREATE POLICY "Users can insert their own launch config history"
ON public.company_launch_config_history
FOR INSERT
WITH CHECK (auth.uid() = company_id);

-- Fonction trigger pour archiver automatiquement les modifications
CREATE OR REPLACE FUNCTION archive_launch_config_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO public.company_launch_config_history (
            company_id,
            platform_launch_date,
            plan_duration_years,
            fiscal_year_start_month,
            action,
            previous_launch_date,
            previous_duration
        ) VALUES (
            NEW.company_id,
            NEW.platform_launch_date,
            NEW.plan_duration_years,
            NEW.fiscal_year_start_month,
            'UPDATE',
            OLD.platform_launch_date,
            OLD.plan_duration_years
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.company_launch_config_history (
            company_id,
            platform_launch_date,
            plan_duration_years,
            fiscal_year_start_month,
            action,
            deleted_at
        ) VALUES (
            OLD.company_id,
            OLD.platform_launch_date,
            OLD.plan_duration_years,
            OLD.fiscal_year_start_month,
            'DELETE',
            now()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table principale
DROP TRIGGER IF EXISTS trigger_archive_launch_config ON public.company_launch_config;
CREATE TRIGGER trigger_archive_launch_config
AFTER UPDATE OR DELETE ON public.company_launch_config
FOR EACH ROW
EXECUTE FUNCTION archive_launch_config_change();

-- Grant permissions
GRANT SELECT, INSERT ON public.company_launch_config_history TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
