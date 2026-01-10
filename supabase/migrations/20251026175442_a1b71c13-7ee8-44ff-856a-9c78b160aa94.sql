-- Table pour gérer les accès délégués aux banquiers
CREATE TABLE IF NOT EXISTS public.banker_access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  banker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_number INTEGER NOT NULL CHECK (module_number IN (1, 3)),
  access_type TEXT NOT NULL DEFAULT 'reports_only' CHECK (access_type = 'reports_only'),
  is_active BOOLEAN DEFAULT true,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, banker_user_id, module_number)
);

-- Table de scoring pour banquiers
CREATE TABLE IF NOT EXISTS public.company_performance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_number INTEGER NOT NULL CHECK (module_number IN (1, 3)),
  score_value DECIMAL NOT NULL CHECK (score_value >= 0 AND score_value <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  recommended_rate DECIMAL,
  calculation_date TIMESTAMPTZ DEFAULT NOW(),
  factors JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.banker_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_performance_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour banker_access_grants
CREATE POLICY "Only CEO can grant banker access"
ON public.banker_access_grants FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'CEO'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND company_id = banker_access_grants.company_id
  )
);

CREATE POLICY "CEO and banker can view their grants"
ON public.banker_access_grants FOR SELECT
USING (
  granted_by_user_id = auth.uid() OR 
  banker_user_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Only CEO can update grants"
ON public.banker_access_grants FOR UPDATE
USING (
  granted_by_user_id = auth.uid() AND
  has_role(auth.uid(), 'CEO'::app_role)
);

CREATE POLICY "Only CEO can delete grants"
ON public.banker_access_grants FOR DELETE
USING (
  granted_by_user_id = auth.uid() AND
  has_role(auth.uid(), 'CEO'::app_role)
);

-- RLS Policies pour company_performance_scores
CREATE POLICY "Bankers with access can view scores"
ON public.company_performance_scores FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'BANQUIER'::app_role) AND
   EXISTS (
     SELECT 1 FROM public.banker_access_grants
     WHERE banker_user_id = auth.uid()
       AND company_id = company_performance_scores.company_id
       AND module_number = company_performance_scores.module_number
       AND is_active = true
   )) OR
  (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) AND (has_role(auth.uid(), 'CEO'::app_role) OR has_role(auth.uid(), 'CONSULTANT'::app_role)))
);

CREATE POLICY "CEO and CONSULTANT can insert scores"
ON public.company_performance_scores FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) AND (has_role(auth.uid(), 'CEO'::app_role) OR has_role(auth.uid(), 'CONSULTANT'::app_role))
);

CREATE POLICY "CEO and CONSULTANT can update scores"
ON public.company_performance_scores FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) AND (has_role(auth.uid(), 'CEO'::app_role) OR has_role(auth.uid(), 'CONSULTANT'::app_role))
);

-- Trigger pour updated_at
CREATE TRIGGER update_banker_access_grants_updated_at
BEFORE UPDATE ON public.banker_access_grants
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_banker_access_grants_banker_user 
ON public.banker_access_grants(banker_user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_banker_access_grants_company 
ON public.banker_access_grants(company_id, is_active);

CREATE INDEX IF NOT EXISTS idx_company_performance_scores_company 
ON public.company_performance_scores(company_id, module_number);

-- Ajouter champs spécifiques BANQUIER dans profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT;