# 🤖 PROMPT POUR COMET AI - Synchronisation Employés Module 3

## 📋 CONTEXTE DU PROJET

Tu travailles sur **LELE HCM Portal V2**, une plateforme SaaS multi-tenant de gestion RH construite avec:
- **Frontend**: React + TypeScript + Vite + Supabase
- **Backend**: PostgreSQL avec architecture multi-tenant (1 schéma par entreprise)
- **Auth**: Supabase Auth avec RLS (Row-Level Security)

### Architecture Multi-Tenant

```
public.companies (table commune)
  ├─ id, name, slug
  ├─ schema_name: "tenant_entreprise_abc"
  └─ owner_user_id (le CEO)

{schema_entreprise}.employees (table isolée par entreprise)
  ├─ id (UUID)
  ├─ employee_id (EMP-12345)
  ├─ first_name, last_name
  ├─ email
  ├─ role, department, position
  └─ hire_date

public.business_lines (lignes d'activité)
  ├─ id
  ├─ user_id (propriétaire)
  └─ activity_name

public.module3_team_members (membres d'équipe Module 3)
  ├─ id
  ├─ business_line_id (FK → business_lines)
  ├─ name
  ├─ professional_category
  ├─ tech_level, handicap_shape, etc.
  └─ employee_id (NULL actuellement) ← À REMPLIR
```

---

## 🎯 OBJECTIF DE LA TÂCHE

**Appliquer une migration SQL pour synchroniser automatiquement les employés du Module 3 vers la table principale `employees` de leur entreprise.**

### Ce que tu DOIS faire:

1. ✅ **Appliquer la migration SQL** fournie dans Supabase
2. ✅ **Vérifier que le trigger fonctionne** correctement
3. ✅ **Tester avec des données réelles** (si une entreprise existe déjà)
4. ✅ **Documenter les résultats** de l'application

### Ce que tu NE DOIS PAS faire:

❌ **NE PAS modifier le code frontend** (React/TypeScript)
❌ **NE PAS modifier la structure des tables existantes** (sauf ajout de colonne `employee_id`)
❌ **NE PAS supprimer de données** existantes
❌ **NE PAS désactiver RLS** (Row-Level Security)
❌ **NE PAS toucher aux policies RLS** existantes
❌ **NE PAS créer de nouvelles tables**
❌ **NE PAS modifier les fonctions existantes** (`get_my_role`, `create_tenant_tables`, etc.)
❌ **NE PAS changer les noms de colonnes** existantes

---

## 📄 SCRIPT SQL À APPLIQUER

Voici la migration complète à exécuter dans **Supabase SQL Editor**:

```sql
-- ============================================
-- MIGRATION: Synchronize Module 3 Team Members with Company Employees
-- Date: 2025-12-02
-- Purpose: Link module3_team_members to tenant schema employees table
--          Enable cross-module employee data sharing
-- ============================================

-- ============================================================================
-- 1. ADD employee_id COLUMN to module3_team_members
-- ============================================================================

ALTER TABLE public.module3_team_members
ADD COLUMN IF NOT EXISTS employee_id UUID;

COMMENT ON COLUMN public.module3_team_members.employee_id IS 'Reference to employee in tenant schema {schema}.employees';

-- ============================================================================
-- 2. CREATE FUNCTION: Sync Module3 Member to Company Employees Table
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_module3_member_to_employees()
RETURNS TRIGGER AS $$
DECLARE
  company_schema TEXT;
  business_line_record RECORD;
  generated_employee_id UUID;
  employee_email TEXT;
  name_parts TEXT[];
BEGIN
  -- Get the business line info to find user_id
  SELECT user_id INTO business_line_record
  FROM public.business_lines
  WHERE id = NEW.business_line_id;

  IF business_line_record IS NULL THEN
    RAISE EXCEPTION 'Business line not found: %', NEW.business_line_id;
  END IF;

  -- Get company schema for this user
  SELECT schema_name INTO company_schema
  FROM public.companies
  WHERE owner_user_id = business_line_record.user_id
    AND is_active = true
  LIMIT 1;

  IF company_schema IS NULL THEN
    RAISE NOTICE 'No active company found for user - skipping employee sync';
    RETURN NEW;
  END IF;

  -- Generate email from name (replace spaces with dots, lowercase, add domain)
  employee_email := LOWER(REPLACE(NEW.name, ' ', '.')) || '@company.local';

  -- Split name into first_name and last_name
  name_parts := string_to_array(NEW.name, ' ');

  -- Generate UUID for new employee
  generated_employee_id := gen_random_uuid();

  -- Insert employee into tenant schema employees table
  EXECUTE format('
    INSERT INTO %I.employees (
      id,
      employee_id,
      first_name,
      last_name,
      email,
      role,
      department,
      position,
      is_active,
      hire_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (email) DO UPDATE
    SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      position = EXCLUDED.position,
      updated_at = NOW()
    RETURNING id
  ', company_schema)
  USING
    generated_employee_id,
    'EMP-' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0'),  -- Random employee ID
    name_parts[1],                                            -- first_name
    COALESCE(name_parts[2], ''),                             -- last_name (empty if single name)
    employee_email,
    'EMPLOYEE',                                               -- default role
    'Module 3 - Cost Savings',                               -- department
    NEW.professional_category,                                -- position from category
    true,                                                     -- is_active
    CURRENT_DATE;                                            -- hire_date

  -- Update module3_team_members with the employee_id
  NEW.employee_id := generated_employee_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to sync employee to schema %: %', company_schema, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. CREATE TRIGGER: Auto-sync on Insert
-- ============================================================================

DROP TRIGGER IF EXISTS sync_module3_member_trigger ON public.module3_team_members;

CREATE TRIGGER sync_module3_member_trigger
  BEFORE INSERT ON public.module3_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_module3_member_to_employees();

-- ============================================================================
-- 4. CREATE FUNCTION: Get Employee Details from Module3 Member
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_module3_member_employee_details(member_id UUID)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  employee_email TEXT,
  employee_department TEXT,
  employee_position TEXT,
  tech_level TEXT,
  handicap_shape TEXT,
  incapacity_rate NUMERIC
) AS $$
DECLARE
  company_schema TEXT;
  member_record RECORD;
BEGIN
  -- Get the module3 member
  SELECT * INTO member_record
  FROM public.module3_team_members
  WHERE id = member_id;

  IF member_record IS NULL THEN
    RETURN;
  END IF;

  -- Get company schema via business_line
  SELECT c.schema_name INTO company_schema
  FROM public.companies c
  JOIN public.business_lines bl ON c.owner_user_id = bl.user_id
  WHERE bl.id = member_record.business_line_id
    AND c.is_active = true
  LIMIT 1;

  IF company_schema IS NULL THEN
    RETURN;
  END IF;

  -- Query employee from tenant schema
  RETURN QUERY EXECUTE format('
    SELECT
      e.id,
      e.first_name || '' '' || e.last_name AS name,
      e.email,
      e.department,
      e.position,
      $1 AS tech_level,
      $2 AS handicap_shape,
      $3 AS incapacity_rate
    FROM %I.employees e
    WHERE e.id = $4
  ', company_schema)
  USING
    member_record.tech_level,
    member_record.handicap_shape,
    member_record.incapacity_rate,
    member_record.employee_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_module3_member_employee_details TO authenticated;

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.sync_module3_member_to_employees IS 'Automatically sync module3_team_members to tenant employees table on insert';
COMMENT ON FUNCTION public.get_module3_member_employee_details IS 'Get full employee details including Module 3 specific data';
```

---

## ✅ ÉTAPES D'EXÉCUTION

### Étape 1: Vérifier les Prérequis

Avant d'appliquer la migration, vérifie que ces tables existent:

```sql
-- Vérifier que les tables nécessaires existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('companies', 'business_lines', 'module3_team_members')
ORDER BY table_name;
```

**Résultat attendu**: 3 lignes (companies, business_lines, module3_team_members)

### Étape 2: Appliquer la Migration

1. Ouvre **Supabase Dashboard** → **SQL Editor**
2. Copie-colle **TOUT le script SQL** ci-dessus
3. Clique sur **"Run"**
4. Attends la confirmation de succès

### Étape 3: Vérifier l'Application

```sql
-- 1. Vérifier que la colonne employee_id a été ajoutée
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'module3_team_members'
AND column_name = 'employee_id';

-- Résultat attendu: 1 ligne
-- column_name: employee_id, data_type: uuid, is_nullable: YES

-- 2. Vérifier que le trigger existe et est activé
SELECT tgname, tgenabled, tgtype
FROM pg_trigger
WHERE tgname = 'sync_module3_member_trigger';

-- Résultat attendu: 1 ligne
-- tgname: sync_module3_member_trigger, tgenabled: O (enabled)

-- 3. Vérifier que les fonctions existent
SELECT proname, prosrc IS NOT NULL as has_source
FROM pg_proc
WHERE proname IN ('sync_module3_member_to_employees', 'get_module3_member_employee_details');

-- Résultat attendu: 2 lignes
```

### Étape 4: Tester avec des Données Existantes (OPTIONNEL)

Si des entreprises et business_lines existent déjà:

```sql
-- Vérifier s'il y a des données existantes
SELECT COUNT(*) as total_companies FROM public.companies;
SELECT COUNT(*) as total_business_lines FROM public.business_lines;
SELECT COUNT(*) as total_members FROM public.module3_team_members;

-- Si total_members > 0, on peut tester la sync manuellement
-- (le trigger ne s'applique QUE sur les nouveaux INSERTs)
```

**Note importante**: Le trigger ne s'applique **QUE sur les nouveaux employés créés après la migration**. Les employés existants dans `module3_team_members` ne seront PAS synchronisés automatiquement (leur `employee_id` restera NULL).

### Étape 5: Test de Synchronisation (Simulation)

Pour tester que le trigger fonctionne, on peut insérer un employé test:

```sql
-- ATTENTION: N'exécute cette requête QUE si une business_line existe
-- Remplace 'your-business-line-id' par un vrai UUID

-- 1. Récupérer un business_line_id existant
SELECT id, user_id, activity_name
FROM public.business_lines
LIMIT 1;

-- 2. Insérer un employé test (remplace le UUID)
INSERT INTO public.module3_team_members (
  business_line_id,
  name,
  professional_category,
  tech_level,
  handicap_shape,
  incapacity_rate,
  versatility_f1,
  versatility_f2,
  versatility_f3
)
VALUES (
  'REMPLACE-PAR-BUSINESS-LINE-ID',  -- ⚠️ REMPLACE ICI
  'Test Employee',
  'Executives',
  'Standard',
  'The employee is not handicaped',
  0,
  'Confirmed (autonomous)',
  'Apprentice (learning)',
  'Does not make / does not know'
)
RETURNING id, name, employee_id;

-- 3. Vérifier que employee_id n'est PAS NULL
-- Résultat attendu: 1 ligne avec employee_id = un UUID généré
```

### Étape 6: Vérifier la Synchronisation dans la Table Employees

```sql
-- Récupérer le schema_name de l'entreprise
SELECT schema_name, owner_user_id
FROM public.companies
LIMIT 1;

-- Vérifier que l'employé a été créé dans {schema}.employees
-- REMPLACE 'tenant_xxx' par le vrai schema_name
SELECT
  id,
  employee_id,
  first_name,
  last_name,
  email,
  department,
  position,
  hire_date
FROM tenant_xxx.employees
WHERE department = 'Module 3 - Cost Savings'
ORDER BY created_at DESC
LIMIT 5;

-- Résultat attendu: Au moins 1 employé avec:
-- - first_name: 'Test'
-- - last_name: 'Employee'
-- - email: 'test.employee@company.local'
-- - department: 'Module 3 - Cost Savings'
-- - position: 'Executives'
```

---

## 📊 RÉSULTATS ATTENDUS

Après avoir appliqué la migration avec succès, tu devrais obtenir:

### ✅ Résultat 1: Colonne Ajoutée
```
table_name: module3_team_members
column_name: employee_id
data_type: uuid
is_nullable: YES
```

### ✅ Résultat 2: Trigger Créé
```
tgname: sync_module3_member_trigger
tgenabled: O (enabled)
```

### ✅ Résultat 3: Fonctions Créées
```
1. sync_module3_member_to_employees (TRIGGER FUNCTION)
2. get_module3_member_employee_details (HELPER FUNCTION)
```

### ✅ Résultat 4: Test de Synchronisation
Si tu as inséré un employé test, tu devrais voir:
- Dans `module3_team_members`: `employee_id` rempli avec un UUID
- Dans `{schema}.employees`: Un nouvel employé créé automatiquement

---

## 🚨 ERREURS POSSIBLES ET SOLUTIONS

### Erreur 1: "relation module3_team_members does not exist"

**Cause**: La table n'existe pas dans la base de données.

**Solution**: Vérifie que tu es connecté à la bonne base Supabase et que la table a été créée par Lovable/précédentes migrations.

### Erreur 2: "column employee_id already exists"

**Cause**: La migration a déjà été appliquée.

**Solution**: C'est OK! Passe à l'étape de vérification.

### Erreur 3: "schema tenant_xxx does not exist"

**Cause**: Aucune entreprise n'a encore été créée, donc aucun schéma tenant.

**Solution**: C'est normal si aucun CEO n'a encore créé son entreprise. La synchronisation fonctionnera automatiquement quand une entreprise sera créée.

### Erreur 4: Trigger ne se déclenche pas

**Cause**: Le trigger est désactivé ou mal configuré.

**Solution**:
```sql
-- Vérifier le statut
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'sync_module3_member_trigger';

-- Si tgenabled = 'D' (disabled), réactiver:
ALTER TABLE public.module3_team_members ENABLE TRIGGER sync_module3_member_trigger;
```

---

## 📝 RAPPORT À FOURNIR

Une fois la migration appliquée, fournis ce rapport:

```markdown
# RAPPORT D'APPLICATION - Migration Employee Sync

## ✅ Étapes Exécutées

1. [ ] Vérification des prérequis
   - Tables présentes: companies, business_lines, module3_team_members

2. [ ] Application de la migration SQL
   - Script exécuté sans erreur

3. [ ] Vérifications post-migration
   - Colonne employee_id ajoutée: [OUI/NON]
   - Trigger créé et activé: [OUI/NON]
   - Fonctions créées: [2 fonctions]

4. [ ] Test de synchronisation
   - Employé test inséré: [OUI/NON/SKIP]
   - employee_id généré: [UUID ou NULL]
   - Employé créé dans schema tenant: [OUI/NON/SKIP]

## 📊 Résultats SQL

### Colonne employee_id
```
[Coller le résultat de la requête SELECT column_name...]
```

### Trigger
```
[Coller le résultat de la requête SELECT tgname...]
```

### Fonctions
```
[Coller le résultat de la requête SELECT proname...]
```

## 🐛 Erreurs Rencontrées

[Lister les erreurs et comment elles ont été résolues, ou "Aucune"]

## 💡 Recommandations

[Si des problèmes ou suggestions]

## ✅ Status Final

Migration appliquée avec succès: [OUI/NON]
Prêt pour utilisation en production: [OUI/NON]
```

---

## 🎯 RÉCAPITULATIF DES OBJECTIFS

### Ce que cette migration fait:

1. ✅ Ajoute une colonne `employee_id` à `module3_team_members`
2. ✅ Crée un trigger automatique qui synchronise les nouveaux employés
3. ✅ Génère automatiquement un email: `prenom.nom@company.local`
4. ✅ Crée un `employee_id` unique: `EMP-12345`
5. ✅ Stocke l'employé dans `{schema_entreprise}.employees`
6. ✅ Gère les doublons (UPDATE si email existe)
7. ✅ Fourni une fonction helper pour récupérer les détails

### Ce que cette migration NE fait PAS:

❌ Ne synchronise PAS les employés existants (seulement les nouveaux)
❌ Ne modifie PAS le code frontend React
❌ Ne crée PAS de comptes utilisateurs (auth.users)
❌ Ne supprime PAS de données
❌ Ne modifie PAS les RLS policies

---

## 📌 IMPORTANT: SÉCURITÉ

- ✅ La fonction utilise `SECURITY DEFINER` pour contourner RLS de manière sécurisée
- ✅ Les erreurs sont catchées pour ne pas bloquer l'insertion
- ✅ Chaque entreprise reste isolée dans son propre schéma
- ✅ Les GRANT sont limités aux utilisateurs `authenticated`

---

**Bonne chance avec l'application de cette migration!** 🚀

Si tu rencontres un problème, fournis:
1. Le message d'erreur complet
2. La requête SQL qui a échoué
3. Le résultat des requêtes de vérification

**Date**: 2025-12-02
**Version**: 1.0.0
**Auteur**: Claude Code (elite-saas-developer)
