-- Corriger les fonctions avec search_path mutable

CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION verify_invitation_code(code TEXT)
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_uuid UUID;
BEGIN
  SELECT id INTO company_uuid 
  FROM public.companies 
  WHERE invitation_code = code;
  
  RETURN company_uuid;
END;
$$;