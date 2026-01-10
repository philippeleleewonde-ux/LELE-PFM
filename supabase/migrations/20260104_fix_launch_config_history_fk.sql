-- Migration: Correction de la contrainte FK dans company_launch_config_history
-- Date: 2026-01-04
-- Description: La FK pointait vers auth.users au lieu de companies

-- 1. Supprimer l'ancienne contrainte FK incorrecte
ALTER TABLE public.company_launch_config_history
DROP CONSTRAINT IF EXISTS company_launch_config_history_company_id_fkey;

-- 2. Ajouter la nouvelle contrainte FK correcte vers companies
ALTER TABLE public.company_launch_config_history
ADD CONSTRAINT company_launch_config_history_company_id_fkey
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- 3. Mettre à jour les politiques RLS pour utiliser la bonne table
DROP POLICY IF EXISTS "Users can view their own launch config history" ON public.company_launch_config_history;
DROP POLICY IF EXISTS "Users can insert their own launch config history" ON public.company_launch_config_history;

-- Politique pour SELECT - les utilisateurs peuvent voir l'historique de leur company
CREATE POLICY "Users can view their company launch config history"
ON public.company_launch_config_history
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.users WHERE id = auth.uid()
  )
);

-- Politique pour INSERT - via le trigger (SECURITY DEFINER)
CREATE POLICY "System can insert launch config history"
ON public.company_launch_config_history
FOR INSERT
WITH CHECK (true);

-- 4. S'assurer que la fonction trigger a les bonnes permissions
ALTER FUNCTION archive_launch_config_change() SECURITY DEFINER;
