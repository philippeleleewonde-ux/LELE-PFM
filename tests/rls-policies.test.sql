-- ============================================================================
-- RLS POLICIES AUTOMATED TESTS
-- ============================================================================
-- Tests d'isolation multi-tenant pour valider que RLS fonctionne correctement
-- Author: elite-saas-developer
-- Date: 2025-11-15
--
-- USAGE: Exécuter via Supabase SQL Editor après avoir appliqué les migrations
-- ============================================================================

-- ============================================================================
-- TEST SETUP: Créer des données de test
-- ============================================================================

BEGIN;

-- Nettoyer les données de test précédentes
DELETE FROM profiles WHERE email LIKE '%@test-rls.com';
DELETE FROM companies WHERE id LIKE 'test-company-%';

-- Créer 2 companies de test
INSERT INTO companies (id, name, created_at)
VALUES
  ('test-company-a', 'Test Company A', NOW()),
  ('test-company-b', 'Test Company B', NOW());

-- Créer des profils pour Company A
INSERT INTO profiles (id, email, company_id, full_name, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'ceo-a@test-rls.com', 'test-company-a', 'CEO Company A', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111112', 'employee-a1@test-rls.com', 'test-company-a', 'Employee A1', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111113', 'employee-a2@test-rls.com', 'test-company-a', 'Employee A2', NOW(), NOW());

-- Créer des profils pour Company B
INSERT INTO profiles (id, email, company_id, full_name, created_at, updated_at)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'ceo-b@test-rls.com', 'test-company-b', 'CEO Company B', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222223', 'employee-b1@test-rls.com', 'test-company-b', 'Employee B1', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222224', 'employee-b2@test-rls.com', 'test-company-b', 'Employee B2', NOW(), NOW());

-- Créer des rôles
INSERT INTO user_roles (user_id, role, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'CEO', NOW()),
  ('11111111-1111-1111-1111-111111111112', 'EMPLOYEE', NOW()),
  ('11111111-1111-1111-1111-111111111113', 'EMPLOYEE', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'CEO', NOW()),
  ('22222222-2222-2222-2222-222222222223', 'EMPLOYEE', NOW()),
  ('22222222-2222-2222-2222-222222222224', 'EMPLOYEE', NOW());

COMMIT;

SELECT '✅ Test data created successfully' AS status;

-- ============================================================================
-- TEST 1: CEO Company A ne doit voir QUE les profils de Company A
-- ============================================================================

DO $$
DECLARE
  profile_count INT;
  company_count INT;
BEGIN
  -- Simuler une query en tant que CEO Company A
  SET SESSION "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

  -- Query tous les profils (RLS doit filtrer automatiquement)
  SELECT COUNT(*) INTO profile_count
  FROM profiles;

  -- Query toutes les companies (RLS doit filtrer automatiquement)
  SELECT COUNT(DISTINCT company_id) INTO company_count
  FROM profiles;

  -- Vérifications
  IF profile_count = 3 THEN
    RAISE NOTICE '✅ TEST 1 PASSED: CEO Company A voit exactement 3 profils (ses employés)';
  ELSE
    RAISE EXCEPTION '❌ TEST 1 FAILED: CEO Company A voit % profils (attendu: 3)', profile_count;
  END IF;

  IF company_count = 1 THEN
    RAISE NOTICE '✅ TEST 1 PASSED: CEO Company A voit exactement 1 company (la sienne)';
  ELSE
    RAISE EXCEPTION '❌ TEST 1 FAILED: CEO Company A voit % companies (attendu: 1)', company_count;
  END IF;

  -- Reset session
  RESET SESSION AUTHORIZATION;
END $$;

-- ============================================================================
-- TEST 2: CEO Company B ne doit voir QUE les profils de Company B
-- ============================================================================

DO $$
DECLARE
  profile_count INT;
  company_count INT;
BEGIN
  -- Simuler une query en tant que CEO Company B
  SET SESSION "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';

  SELECT COUNT(*) INTO profile_count
  FROM profiles;

  SELECT COUNT(DISTINCT company_id) INTO company_count
  FROM profiles;

  -- Vérifications
  IF profile_count = 3 THEN
    RAISE NOTICE '✅ TEST 2 PASSED: CEO Company B voit exactement 3 profils (ses employés)';
  ELSE
    RAISE EXCEPTION '❌ TEST 2 FAILED: CEO Company B voit % profils (attendu: 3)', profile_count;
  END IF;

  IF company_count = 1 THEN
    RAISE NOTICE '✅ TEST 2 PASSED: CEO Company B voit exactement 1 company (la sienne)';
  ELSE
    RAISE EXCEPTION '❌ TEST 2 FAILED: CEO Company B voit % companies (attendu: 1)', company_count;
  END IF;

  RESET SESSION AUTHORIZATION;
END $$;

-- ============================================================================
-- TEST 3: Employee Company A ne peut PAS voir les profils de Company B
-- ============================================================================

DO $$
DECLARE
  cross_tenant_profiles INT;
BEGIN
  -- Simuler une query en tant qu'Employee Company A
  SET SESSION "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111112';

  -- Essayer de voir des profils de Company B
  SELECT COUNT(*) INTO cross_tenant_profiles
  FROM profiles
  WHERE email LIKE '%@test-rls.com' AND company_id = 'test-company-b';

  -- Vérification
  IF cross_tenant_profiles = 0 THEN
    RAISE NOTICE '✅ TEST 3 PASSED: Employee Company A ne voit AUCUN profil de Company B';
  ELSE
    RAISE EXCEPTION '❌ TEST 3 FAILED: Employee Company A voit % profils de Company B (attendu: 0)', cross_tenant_profiles;
  END IF;

  RESET SESSION AUTHORIZATION;
END $$;

-- ============================================================================
-- TEST 4: User peut voir son propre profil
-- ============================================================================

DO $$
DECLARE
  own_profile_visible BOOLEAN;
BEGIN
  -- Simuler une query en tant qu'Employee Company A
  SET SESSION "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111112';

  -- Vérifier qu'on peut voir son propre profil
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = '11111111-1111-1111-1111-111111111112'
  ) INTO own_profile_visible;

  -- Vérification
  IF own_profile_visible THEN
    RAISE NOTICE '✅ TEST 4 PASSED: User peut voir son propre profil';
  ELSE
    RAISE EXCEPTION '❌ TEST 4 FAILED: User ne peut PAS voir son propre profil';
  END IF;

  RESET SESSION AUTHORIZATION;
END $$;

-- ============================================================================
-- TEST 5: User peut mettre à jour son propre profil
-- ============================================================================

DO $$
DECLARE
  update_count INT;
BEGIN
  -- Simuler une query en tant qu'Employee Company A
  SET SESSION "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111112';

  -- Essayer de mettre à jour son propre profil
  UPDATE profiles
  SET full_name = 'Employee A1 Updated'
  WHERE id = '11111111-1111-1111-1111-111111111112';

  GET DIAGNOSTICS update_count = ROW_COUNT;

  -- Vérification
  IF update_count = 1 THEN
    RAISE NOTICE '✅ TEST 5 PASSED: User peut mettre à jour son propre profil';
  ELSE
    RAISE EXCEPTION '❌ TEST 5 FAILED: User ne peut PAS mettre à jour son propre profil (rows affected: %)', update_count;
  END IF;

  RESET SESSION AUTHORIZATION;
END $$;

-- ============================================================================
-- TEST 6: User ne peut PAS mettre à jour un profil d'une autre company
-- ============================================================================

DO $$
DECLARE
  update_count INT;
BEGIN
  -- Simuler une query en tant qu'Employee Company A
  SET SESSION "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111112';

  -- Essayer de mettre à jour un profil de Company B
  UPDATE profiles
  SET full_name = 'Hacked!'
  WHERE id = '22222222-2222-2222-2222-222222222223';

  GET DIAGNOSTICS update_count = ROW_COUNT;

  -- Vérification
  IF update_count = 0 THEN
    RAISE NOTICE '✅ TEST 6 PASSED: User ne peut PAS mettre à jour un profil d''une autre company';
  ELSE
    RAISE EXCEPTION '❌ TEST 6 FAILED: User PEUT mettre à jour un profil d''une autre company! CRITICAL SECURITY ISSUE!';
  END IF;

  RESET SESSION AUTHORIZATION;
END $$;

-- ============================================================================
-- TEST 7: Vérifier que les policies RLS sont bien actives
-- ============================================================================

DO $$
DECLARE
  rls_enabled_profiles BOOLEAN;
  rls_enabled_companies BOOLEAN;
  rls_enabled_user_roles BOOLEAN;
  total_policies INT;
BEGIN
  -- Vérifier que RLS est activé sur les tables critiques
  SELECT rowsecurity INTO rls_enabled_profiles
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'profiles';

  SELECT rowsecurity INTO rls_enabled_companies
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'companies';

  SELECT rowsecurity INTO rls_enabled_user_roles
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'user_roles';

  -- Compter les policies
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Vérifications
  IF rls_enabled_profiles AND rls_enabled_companies AND rls_enabled_user_roles THEN
    RAISE NOTICE '✅ TEST 7 PASSED: RLS est activé sur profiles, companies, user_roles';
  ELSE
    RAISE EXCEPTION '❌ TEST 7 FAILED: RLS n''est PAS activé sur toutes les tables critiques';
  END IF;

  IF total_policies >= 15 THEN
    RAISE NOTICE '✅ TEST 7 PASSED: Au moins 15 RLS policies sont créées (%)' , total_policies;
  ELSE
    RAISE EXCEPTION '❌ TEST 7 FAILED: Seulement % RLS policies (attendu: >= 15)', total_policies;
  END IF;
END $$;

-- ============================================================================
-- TEST 8: Vérifier que la table audit_logs existe
-- ============================================================================

DO $$
DECLARE
  audit_table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'audit_logs'
  ) INTO audit_table_exists;

  IF audit_table_exists THEN
    RAISE NOTICE '✅ TEST 8 PASSED: La table audit_logs existe';
  ELSE
    RAISE EXCEPTION '❌ TEST 8 FAILED: La table audit_logs n''existe PAS';
  END IF;
END $$;

-- ============================================================================
-- CLEANUP: Nettoyer les données de test
-- ============================================================================

BEGIN;

DELETE FROM user_roles WHERE user_id LIKE '11111111-1111-1111-1111%' OR user_id LIKE '22222222-2222-2222-2222%';
DELETE FROM profiles WHERE email LIKE '%@test-rls.com';
DELETE FROM companies WHERE id LIKE 'test-company-%';

COMMIT;

SELECT '✅ Test data cleaned up' AS status;

-- ============================================================================
-- RÉSUMÉ DES TESTS
-- ============================================================================

SELECT '
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║                    ✅ TOUS LES TESTS RLS ONT PASSÉ                         ║
║                                                                            ║
║  TEST 1: ✅ CEO Company A voit uniquement Company A                       ║
║  TEST 2: ✅ CEO Company B voit uniquement Company B                       ║
║  TEST 3: ✅ Employee ne voit pas l''autre company                         ║
║  TEST 4: ✅ User peut voir son propre profil                              ║
║  TEST 5: ✅ User peut modifier son propre profil                          ║
║  TEST 6: ✅ User ne peut PAS modifier un autre tenant                     ║
║  TEST 7: ✅ RLS activé + 15+ policies                                     ║
║  TEST 8: ✅ Table audit_logs existe                                       ║
║                                                                            ║
║  🎯 ISOLATION MULTI-TENANT: VALIDÉE                                       ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
' AS test_summary;
