# 🚀 Guide d'Exécution des Migrations - Étape par Étape

> **Date**: 2025-11-15
> **Backup créé**: ✅ Oui (backups/2025-11-15T19-33-15)
> **Projet**: yhidlozgpvzsroetjxqb
> **Statut**: Prêt pour exécution

---

## ⚠️ VÉRIFICATION AVANT DE COMMENCER

✅ **Backup créé**: Oui (voir dossier `backups/`)
✅ **Migrations prêtes**: 3 fichiers SQL dans `supabase/migrations/`
✅ **Edge Function prête**: `supabase/functions/get-stats/index.ts`

---

## 📋 ÉTAPES D'EXÉCUTION

### ÉTAPE 1: Accéder au SQL Editor Supabase

1. Ouvrir votre navigateur
2. Aller sur: **https://supabase.com/dashboard/project/yhidlozgpvzsroetjxqb**
3. Se connecter avec vos identifiants Supabase
4. Dans le menu de gauche, cliquer sur **"SQL Editor"**
5. Cliquer sur **"New Query"** (bouton en haut à droite)

---

### ÉTAPE 2: Exécuter Migration 1 - Fix app_role enum

#### 2.1 Ouvrir le fichier de migration

Ouvrir le fichier: `supabase/migrations/20251115000001_fix_app_role_enum.sql`

#### 2.2 Copier le contenu

Copier **TOUT le contenu** du fichier (environ 60 lignes)

#### 2.3 Coller dans SQL Editor

1. Dans le SQL Editor Supabase, coller le SQL copié
2. Vérifier que tout le code est bien présent
3. Nommer la query: "Migration 1 - Fix app_role enum"

#### 2.4 Exécuter

1. Cliquer sur le bouton **"Run"** (ou Ctrl+Enter / Cmd+Enter)
2. Attendre l'exécution (environ 5-10 secondes)
3. Vérifier le résultat:
   - ✅ **Succès**: Message "Success" en vert
   - ❌ **Erreur**: Lire le message d'erreur et me contacter

#### 2.5 Vérifier le résultat

Dans une nouvelle query, exécuter:

```sql
-- Vérifier que les 6 nouveaux rôles existent
SELECT unnest(enum_range(NULL::app_role))::text;
```

**Résultat attendu**:
```
CONSULTANT
BANQUIER
CEO
RH_MANAGER
EMPLOYEE
TEAM_LEADER
```

✅ **Si vous voyez ces 6 rôles, Migration 1 = SUCCÈS!**

---

### ÉTAPE 3: Exécuter Migration 2 - Secure multi-tenant

#### 3.1 Ouvrir le fichier de migration

Ouvrir le fichier: `supabase/migrations/20251115000002_secure_multi_tenant.sql`

#### 3.2 Copier le contenu

Copier **TOUT le contenu** du fichier (environ 120 lignes)

#### 3.3 Coller dans SQL Editor

1. Créer une **nouvelle query** (bouton "New Query")
2. Coller le SQL copié
3. Nommer la query: "Migration 2 - Secure multi-tenant"

#### 3.4 Exécuter

1. Cliquer sur **"Run"**
2. Attendre l'exécution (environ 10-15 secondes)
3. Vérifier le résultat:
   - ✅ **Succès**: Message "Success"
   - ❌ **Erreur**: Lire le message d'erreur

#### 3.5 Vérifier le résultat

Dans une nouvelle query, exécuter:

```sql
-- Vérifier qu'aucun profile n'a company_id NULL
SELECT COUNT(*) as profiles_sans_company
FROM profiles
WHERE company_id IS NULL;
```

**Résultat attendu**: `0` (zéro profiles sans company)

```sql
-- Vérifier que la foreign key existe
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as references_table
FROM pg_constraint
WHERE conname = 'fk_profiles_company';
```

**Résultat attendu**: Une ligne avec `fk_profiles_company`

✅ **Si ces vérifications passent, Migration 2 = SUCCÈS!**

---

### ÉTAPE 4: Exécuter Migration 3 - Enable RLS

#### 4.1 Ouvrir le fichier de migration

Ouvrir le fichier: `supabase/migrations/20251115000003_enable_rls_policies.sql`

⚠️ **ATTENTION**: Ce fichier est le plus important (290 lignes). Prenez votre temps.

#### 4.2 Copier le contenu

Copier **TOUT le contenu** du fichier (environ 290 lignes)

#### 4.3 Coller dans SQL Editor

1. Créer une **nouvelle query**
2. Coller le SQL copié
3. Nommer la query: "Migration 3 - Enable RLS"

#### 4.4 Exécuter

1. Cliquer sur **"Run"**
2. Attendre l'exécution (environ 15-30 secondes)
   - Cette migration crée 15+ policies, cela peut prendre un peu de temps
3. Vérifier le résultat:
   - ✅ **Succès**: Message "Success"
   - ❌ **Erreur**: Lire le message d'erreur

#### 4.5 Vérifier le résultat

Dans une nouvelle query, exécuter:

```sql
-- Vérifier que RLS est activé sur les tables critiques
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'companies', 'user_roles')
ORDER BY tablename;
```

**Résultat attendu**:
```
tablename     | rls_enabled
--------------|------------
companies     | t
profiles      | t
user_roles    | t
```

```sql
-- Vérifier le nombre de policies créées
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';
```

**Résultat attendu**: Au moins 15 policies

```sql
-- Vérifier que la table audit_logs existe
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'audit_logs';
```

**Résultat attendu**: Une ligne avec `audit_logs`

✅ **Si toutes ces vérifications passent, Migration 3 = SUCCÈS!**

---

### ÉTAPE 5: Déployer l'Edge Function (Analytics)

⚠️ **NOTE**: Cette étape nécessite un accès aux Functions dans Supabase Dashboard

#### 5.1 Accéder aux Functions

1. Dans le Dashboard Supabase, cliquer sur **"Edge Functions"** (menu de gauche)
2. Cliquer sur **"Deploy a new function"**

#### 5.2 Configuration de la function

1. **Function name**: `get-stats`
2. **Region**: Sélectionner la région la plus proche (ex: `eu-west-1`)

#### 5.3 Copier le code

1. Ouvrir le fichier: `supabase/functions/get-stats/index.ts`
2. Copier **TOUT le contenu** (environ 280 lignes)

#### 5.4 Coller et déployer

1. Dans l'éditeur de la function, coller le code
2. Cliquer sur **"Deploy function"**
3. Attendre le déploiement (environ 30 secondes - 1 minute)

#### 5.5 Vérifier le déploiement

L'URL de la function sera:
```
https://yhidlozgpvzsroetjxqb.supabase.co/functions/v1/get-stats
```

Pour tester (nécessite un JWT token valide):
```bash
curl -X POST 'https://yhidlozgpvzsroetjxqb.supabase.co/functions/v1/get-stats' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json'
```

✅ **Si la function est déployée, ÉTAPE 5 = SUCCÈS!**

---

### ÉTAPE 6: Régénérer les Types TypeScript

Cette étape se fait en LOCAL (pas sur Supabase Dashboard)

#### Option A: Via CLI Supabase (si installé)

```bash
npx supabase gen types typescript --project-id yhidlozgpvzsroetjxqb > src/integrations/supabase/types.ts
```

#### Option B: Utiliser le fichier de référence (temporaire)

Si la CLI ne fonctionne pas, vous pouvez temporairement utiliser:

```bash
cd "/Users/onclephilbasket/Documents/Sauvergarde docs Macbookair15/Projet Modules HCM ACCOUNTING/HCM-PORTAL V2"
cp src/integrations/supabase/types-updated.ts src/integrations/supabase/types.ts
```

⚠️ **Note**: Cette option est temporaire. Il faudra régénérer les vrais types plus tard.

---

## ✅ CHECKLIST FINALE

Après avoir exécuté toutes les étapes, vérifier:

- [ ] **Migration 1**: Enum app_role a 6 rôles ✅
- [ ] **Migration 2**: company_id est NOT NULL + Foreign key existe ✅
- [ ] **Migration 3**: RLS activé + 15+ policies + audit_logs table existe ✅
- [ ] **Edge Function**: get-stats déployée ✅
- [ ] **Types TypeScript**: Régénérés ou fichier de référence utilisé ✅

---

## 🧪 TESTS POST-MIGRATION

### Test 1: Créer un utilisateur CEO

Via le frontend ou SQL:

```sql
-- Créer une company
INSERT INTO companies (id, name) VALUES ('test-company', 'Test Company');

-- Créer un profile
INSERT INTO profiles (id, email, company_id, full_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ceo@test.com',
  'test-company',
  'CEO Test'
);

-- Assigner le rôle CEO (NOUVEAU!)
INSERT INTO user_roles (user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'CEO');
```

**Résultat attendu**: Aucune erreur (le rôle CEO est maintenant accepté!)

### Test 2: Vérifier RLS

Créer 2 companies et vérifier qu'un CEO ne voit que sa company:

```sql
-- Simuler une query en tant que CEO de test-company
SET SESSION "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';

-- Cette query NE DOIT retourner QUE test-company
SELECT company_id, COUNT(*)
FROM profiles
GROUP BY company_id;
```

**Résultat attendu**: Une seule ligne avec `test-company`

---

## 🔄 ROLLBACK (en cas de problème)

Si une migration échoue ou cause des problèmes:

### Rollback complet (URGENCE)

1. Aller sur Supabase Dashboard → Settings → Database → Backups
2. Sélectionner le backup manuel que vous avez créé
3. Cliquer sur "Restore"
4. Attendre la restauration (quelques minutes)

### Rollback partiel (désactiver RLS temporairement)

Si RLS bloque tout:

```sql
-- URGENCE: Désactiver RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
```

⚠️ **DANGER**: Cela retire la sécurité multi-tenant. À utiliser uniquement en urgence!

---

## 📞 SUPPORT

**En cas de problème**:

1. **Vérifier les logs**: Dashboard → Logs → Database logs
2. **Consulter la documentation**:
   - `docs/ADR-003-MULTI-TENANT-SECURITY-2025-11-15.md`
   - `supabase/migrations/README.md`
3. **Backup existe**: `backups/2025-11-15T19-33-15/`
4. **Contacter Supabase**: https://supabase.com/support

---

## 🎯 PROCHAINES ÉTAPES APRÈS SUCCÈS

1. ✅ **Tester le frontend**:
   - Login en tant que CEO
   - Vérifier que seuls les profils de sa company sont visibles
   - Créer un employé (company_id auto-assigné)

2. ✅ **Appeler l'endpoint analytics**:
   - Depuis le CEO Dashboard
   - Vérifier que `/functions/v1/get-stats` retourne les données

3. ✅ **Nettoyer la default company** (si vide):
   ```sql
   -- Vérifier
   SELECT COUNT(*) FROM profiles WHERE company_id = 'default-company-migration';

   -- Si 0, supprimer
   DELETE FROM companies WHERE id = 'default-company-migration';
   ```

4. ✅ **Monitoring**:
   - Activer Sentry error tracking
   - Surveiller les logs Supabase
   - Vérifier les performances des queries (RLS overhead)

---

**Bonne chance! 🚀**

**Créé**: 2025-11-15
**Auteur**: Claude (elite-saas-developer)
**Projet**: LELE HCM Portal V2
