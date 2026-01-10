-- ============================================
-- 🚨 SCRIPT D'URGENCE - EXÉCUTER DANS SUPABASE
-- ============================================
-- GO TO: https://supabase.com/dashboard/project/yhidlozgpvzsroetjxqb/sql/new
-- PASTE THIS ENTIRE FILE AND CLICK "RUN"
-- ============================================

-- Step 1: Vérifier l'état actuel du rôle CEO
SELECT
  'CURRENT ROLE STATUS' as check_type,
  u.id as user_id,
  u.email,
  ur.role,
  ur.created_at,
  ur.updated_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'ceo9@gmail.com';

-- Step 2: RESTAURER le rôle CEO (UPSERT atomique)
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get CEO user ID
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'ceo9@gmail.com';

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'CEO user not found!';
  END IF;

  -- Delete existing role (if any)
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- Insert CEO role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'CEO');

  RAISE NOTICE 'CEO role restored for user: %', target_user_id;
END $$;

-- Step 3: Vérifier la restauration
SELECT
  'AFTER RESTORATION' as check_type,
  u.id as user_id,
  u.email,
  ur.role,
  ur.created_at,
  ur.updated_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'ceo9@gmail.com';

-- Step 4: Vérifier la fonction get_my_role()
SELECT
  'FUNCTION CHECK' as check_type,
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE proname = 'get_my_role';

-- ============================================
-- SI VOUS VOYEZ "CEO" dans le résultat Step 3:
-- → Refresh votre navigateur et reconnectez-vous
--
-- SI VOUS VOYEZ TOUJOURS NULL ou PAS DE ROLE:
-- → Il y a un problème avec la fonction get_my_role()
-- → Continuez avec le Step 5 ci-dessous
-- ============================================

-- Step 5: RÉPARER la fonction get_my_role() (SI NÉCESSAIRE)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  found_role app_role;
BEGIN
  -- Simple SELECT without any mutation
  SELECT role INTO found_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  RETURN found_role;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated;

-- Step 6: Tester la fonction réparée
SELECT public.get_my_role() as my_role_test;

-- ============================================
-- RÉSULTAT ATTENDU:
-- my_role_test devrait être NULL (car vous n'êtes pas connecté en tant que CEO dans SQL Editor)
-- Mais la fonction ne devrait pas générer d'erreur
--
-- MAINTENANT:
-- 1. Allez sur http://localhost:8080/
-- 2. Déconnectez-vous si connecté
-- 3. Reconnectez-vous avec ceo9@gmail.com
-- 4. Vous devriez accéder au CEO Dashboard
-- ============================================
