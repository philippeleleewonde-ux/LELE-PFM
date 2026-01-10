-- Créer la table companies
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  employees_count INTEGER,
  invitation_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter les nouveaux champs à la table profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'EMPLOYEE' CHECK (role IN ('CONSULTANT', 'CEO', 'RH_MANAGER', 'EMPLOYEE', 'TEAM_LEADER', 'admin', 'user')),
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS consulting_firm TEXT,
  ADD COLUMN IF NOT EXISTS team_name TEXT,
  ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- Ajouter la colonne role dans user_roles si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'role') THEN
    ALTER TABLE public.user_roles ADD COLUMN role TEXT NOT NULL DEFAULT 'EMPLOYEE' CHECK (role IN ('CONSULTANT', 'CEO', 'RH_MANAGER', 'EMPLOYEE', 'TEAM_LEADER', 'admin', 'user'));
  END IF;
END $$;

-- Mettre à jour full_name à partir de first_name et last_name si nécessaire
UPDATE public.profiles 
SET first_name = COALESCE(split_part(full_name, ' ', 1), ''),
    last_name = COALESCE(split_part(full_name, ' ', 2), '')
WHERE first_name IS NULL AND full_name IS NOT NULL;

-- Enable RLS sur companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour companies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'companies' AND policyname = 'Users can view their own company') THEN
    CREATE POLICY "Users can view their own company" 
      ON public.companies 
      FOR SELECT 
      USING (
        id IN (
          SELECT company_id FROM public.profiles WHERE id = auth.uid()
        ) OR
        auth.uid() IN (
          SELECT user_id FROM public.user_roles WHERE role = 'admin'
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'companies' AND policyname = 'Users can insert their own company') THEN
    CREATE POLICY "Users can insert their own company" 
      ON public.companies 
      FOR INSERT 
      WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'companies' AND policyname = 'Company admins can update their company') THEN
    CREATE POLICY "Company admins can update their company" 
      ON public.companies 
      FOR UPDATE 
      USING (
        id IN (
          SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Mettre à jour la policy profiles pour inclure company_id
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (
    auth.uid() = id OR
    (company_id IS NOT NULL AND company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ))
  );

-- Fonction pour générer un code d'invitation unique
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    code := 'HCM-' || 
            LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0') || '-' ||
            LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    
    SELECT EXISTS(SELECT 1 FROM public.companies WHERE invitation_code = code) INTO exists_code;
    
    EXIT WHEN NOT exists_code;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Mettre à jour la fonction handle_new_user pour gérer les nouveaux champs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    first_name,
    last_name,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'EMPLOYEE')
  );
  
  -- Créer la subscription par défaut
  INSERT INTO public.user_subscriptions (user_id, credits_remaining)
  VALUES (NEW.id, 100);
  
  -- Assigner le rôle par défaut
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'EMPLOYEE'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction pour vérifier le code d'invitation
CREATE OR REPLACE FUNCTION verify_invitation_code(code TEXT)
RETURNS UUID AS $$
DECLARE
  company_uuid UUID;
BEGIN
  SELECT id INTO company_uuid 
  FROM public.companies 
  WHERE invitation_code = code;
  
  RETURN company_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour updated_at sur companies
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();