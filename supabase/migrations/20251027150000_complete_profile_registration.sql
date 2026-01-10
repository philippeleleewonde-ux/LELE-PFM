-- Permet de compléter le profil d'un utilisateur juste après l'inscription
-- Cette fonction est appelée depuis le front avec l'anon key. Elle tourne en SECURITY DEFINER
-- pour contourner les restrictions RLS tant que l'utilisateur n'a pas encore confirmé son compte.

CREATE OR REPLACE FUNCTION public.complete_profile_registration(
  target_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_company_id UUID,
  p_company_name TEXT,
  p_consulting_firm TEXT,
  p_department TEXT,
  p_position TEXT,
  p_employee_id TEXT,
  p_team_name TEXT,
  p_bank_name TEXT,
  p_license_number TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    company_id = COALESCE(p_company_id, company_id),
    company_name = COALESCE(p_company_name, company_name),
    consulting_firm = COALESCE(p_consulting_firm, consulting_firm),
    department = COALESCE(p_department, department),
    position = COALESCE(p_position, position),
    employee_id = COALESCE(p_employee_id, employee_id),
    team_name = COALESCE(p_team_name, team_name),
    bank_name = COALESCE(p_bank_name, bank_name),
    license_number = COALESCE(p_license_number, license_number)
  WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_profile_registration TO anon;
GRANT EXECUTE ON FUNCTION public.complete_profile_registration TO authenticated;
