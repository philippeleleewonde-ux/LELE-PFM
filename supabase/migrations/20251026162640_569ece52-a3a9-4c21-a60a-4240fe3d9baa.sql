-- Fonction pour permettre aux admins de changer le rôle d'un utilisateur
CREATE OR REPLACE FUNCTION update_user_role(
  target_user_id UUID,
  new_role app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur qui appelle est un admin ou consultant
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'CONSULTANT'::app_role)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and consultants can change user roles';
  END IF;

  -- Mettre à jour le rôle
  UPDATE user_roles
  SET role = new_role
  WHERE user_id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User role not found for user_id: %', target_user_id;
  END IF;
END;
$$;

-- Correction temporaire : Mettre à jour consultant@google.com en CONSULTANT
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  SELECT id INTO user_uuid 
  FROM auth.users 
  WHERE email = 'consultant@google.com';
  
  IF user_uuid IS NOT NULL THEN
    UPDATE user_roles 
    SET role = 'CONSULTANT'
    WHERE user_id = user_uuid;
  END IF;
END;
$$;