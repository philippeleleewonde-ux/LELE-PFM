# Migrations Supabase - LELE HCM Portal V2

> **Date**: 2025-11-15
> **Author**: elite-saas-developer
> **Status**: ✅ Ready for Execution
> **Project**: yhidlozgpvzsroetjxqb

---

## 🎯 OBJECTIF

Corriger **4 erreurs critiques** identifiées par l'audit backend (elite-backend-architect):

1. ❌ **Multi-tenant cassé**: company_id nullable
2. ❌ **Rôles incompatibles**: DB a 3 rôles, frontend en attend 6
3. ❌ **Pas de RLS**: CEO Company A voit données Company B
4. ❌ **Pas de GDPR**: Aucun audit trail

---

## 📋 MIGRATIONS À EXÉCUTER

### Migration 1: Fix app_role enum (30 min)
**Fichier**: `20251115000001_fix_app_role_enum.sql`

**Changements**:
- Migre enum de `("admin", "user", "manager")` vers `("CONSULTANT", "BANQUIER", "CEO", "RH_MANAGER", "EMPLOYEE", "TEAM_LEADER")`
- Mappe les données existantes: admin → CEO, manager → RH_MANAGER, user → EMPLOYEE
- Ajoute contrainte de validation

**Impact**: ✅ Le rôle CEO peut maintenant être sauvegardé en base

---

### Migration 2: Secure multi-tenant (1 heure)
**Fichier**: `20251115000002_secure_multi_tenant.sql`

**Changements**:
- Crée une company par défaut pour les profils orphelins
- Met à jour tous les company_id NULL
- Rend company_id NOT NULL
- Ajoute foreign key: profiles.company_id → companies.id
- Ajoute index unique: (email, company_id)

**Impact**: ✅ Architecture multi-tenant sécurisée, isolation garantie

---

### Migration 3: Enable RLS (1 heure)
**Fichier**: `20251115000003_enable_rls_policies.sql`

**Changements**:
- Active RLS sur: profiles, companies, user_roles, banker_access_grants
- Crée fonction helper: `auth.user_company_id()`
- Crée 15+ policies RLS pour isolation tenant
- Crée table audit_logs (GDPR compliance)
- Ajoute trigger audit sur profiles

**Impact**: ✅ Isolation des données par company_id au niveau base de données

---

### Edge Function: Analytics endpoint (30 min)
**Fichier**: `supabase/functions/get-stats/index.ts`

**Changements**:
- Endpoint `/functions/v1/get-stats`
- Retourne: totalUsers, usersByRole, usersByCompany, recentUsers
- Sécurité: Accessible uniquement par CEO et RH_MANAGER, scoped à company_id

**Impact**: ✅ Analytics sécurisées avec RLS enforcement

---

## ⚠️ AVANT D'EXÉCUTER (CRITIQUE)

### 1. Backup de la base de données

**Option A - Via Supabase CLI** (recommandé):
```bash
# Installer Supabase CLI si pas déjà fait
npm install -g supabase

# Se connecter
supabase login

# Dump complet
supabase db dump --project-ref yhidlozgpvzsroetjxqb > backup_2025_11_15.sql
```

**Option B - Via interface Supabase**:
1. Aller sur https://supabase.com/dashboard/project/yhidlozgpvzsroetjxqb
2. Settings → Database → Backups
3. Créer un backup manuel

**Option C - Export CSV manuel**:
```sql
-- Depuis Supabase SQL Editor
COPY profiles TO '/tmp/profiles_backup.csv' DELIMITER ',' CSV HEADER;
COPY user_roles TO '/tmp/user_roles_backup.csv' DELIMITER ',' CSV HEADER;
COPY companies TO '/tmp/companies_backup.csv' DELIMITER ',' CSV HEADER;
```

### 2. Vérifier l'état actuel

```sql
-- Combien de profils sans company_id?
SELECT COUNT(*) FROM profiles WHERE company_id IS NULL;

-- Quels rôles existent actuellement?
SELECT DISTINCT role FROM user_roles;

-- RLS est-il déjà activé?
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

---

## 🚀 EXÉCUTION

### Méthode 1: Via Supabase CLI (recommandé)

```bash
# 1. Naviguer vers le dossier projet
cd "/Users/onclephilbasket/Documents/Sauvergarde docs Macbookair15/Projet Modules HCM ACCOUNTING/HCM-PORTAL V2"

# 2. Se connecter à Supabase
supabase login

# 3. Link au projet
supabase link --project-ref yhidlozgpvzsroetjxqb

# 4. Exécuter les migrations dans l'ordre
supabase db push

# Alternative: Exécuter une par une
supabase db push supabase/migrations/20251115000001_fix_app_role_enum.sql
supabase db push supabase/migrations/20251115000002_secure_multi_tenant.sql
supabase db push supabase/migrations/20251115000003_enable_rls_policies.sql

# 5. Déployer l'Edge Function
supabase functions deploy get-stats --project-ref yhidlozgpvzsroetjxqb
```

### Méthode 2: Via Supabase Dashboard (manuel)

1. Aller sur https://supabase.com/dashboard/project/yhidlozgpvzsroetjxqb
2. SQL Editor → New Query
3. Copier-coller le contenu de `20251115000001_fix_app_role_enum.sql`
4. Cliquer "Run"
5. Vérifier le résultat
6. Répéter pour Migration 2 et 3
7. Functions → Deploy new function → Copier `supabase/functions/get-stats/index.ts`

---

## ✅ VÉRIFICATION POST-MIGRATION

### Test 1: Vérifier enum roles
```sql
-- Doit retourner 6 rôles uniquement
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

---

### Test 2: Vérifier company_id NOT NULL
```sql
-- Doit retourner 0
SELECT COUNT(*) FROM profiles WHERE company_id IS NULL;
```

**Résultat attendu**: `0`

---

### Test 3: Vérifier RLS activé
```sql
-- Doit retourner 't' (true) pour toutes les tables critiques
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'companies', 'user_roles');
```

**Résultat attendu**:
```
tablename    | rowsecurity
-------------|------------
profiles     | t
companies    | t
user_roles   | t
```

---

### Test 4: Vérifier policies RLS créées
```sql
-- Doit retourner 15+ policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Résultat attendu**: Au moins 15 policies listées

---

### Test 5: Tester isolation tenant (IMPORTANT)

**Prérequis**: Avoir au moins 2 companies avec des profils

```sql
-- En tant que CEO Company A (remplacer <CEO_A_UUID> par vrai UUID)
SET SESSION "request.jwt.claim.sub" = '<CEO_A_UUID>';

-- Cette requête NE DOIT retourner QUE les profils de Company A
SELECT company_id, COUNT(*)
FROM profiles
GROUP BY company_id;
```

**Résultat attendu**: Une seule ligne avec company_id de Company A

---

### Test 6: Tester Edge Function
```bash
# Récupérer un token JWT valide (CEO ou RH_MANAGER)
# Via Supabase Auth dans le frontend ou:
curl -X POST 'https://yhidlozgpvzsroetjxqb.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: <SUPABASE_ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"email":"ceo@example.com","password":"password"}'

# Appeler l'endpoint get-stats
curl -X POST 'https://yhidlozgpvzsroetjxqb.supabase.co/functions/v1/get-stats' \
  -H 'Authorization: Bearer <JWT_TOKEN>' \
  -H 'Content-Type: application/json'
```

**Résultat attendu**:
```json
{
  "totalUsers": 47,
  "usersByRole": {
    "CEO": 1,
    "RH_MANAGER": 2,
    "EMPLOYEE": 35,
    "TEAM_LEADER": 9
  },
  "usersByCompany": [
    { "companyName": "Acme Corp", "userCount": 47 }
  ],
  "recentUsers": [ /* 10 utilisateurs récents */ ]
}
```

---

## 🔄 ROLLBACK EN CAS D'ERREUR

### Si Migration 1 échoue
```sql
-- Restaurer depuis backup
-- Via Supabase Dashboard: Settings → Database → Backups → Restore

-- Ou via psql:
psql $DATABASE_URL < backup_2025_11_15.sql
```

### Si Migration 2 échoue
```sql
-- Remettre company_id nullable (temporaire)
ALTER TABLE profiles ALTER COLUMN company_id DROP NOT NULL;

-- Supprimer foreign key
ALTER TABLE profiles DROP CONSTRAINT fk_profiles_company;

-- Restaurer depuis backup complet
```

### Si Migration 3 échoue (RLS bloque tout)
```sql
-- URGENCE: Désactiver RLS temporairement
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Investiguer le problème
-- Corriger les policies
-- Réactiver RLS
```

---

## 📊 IMPACT ATTENDU

| Métrique | Avant | Après |
|----------|-------|-------|
| **Isolation multi-tenant** | ❌ Cassée | ✅ Garantie (RLS) |
| **CEO peut sauvegarder son rôle** | ❌ Non | ✅ Oui |
| **CEO voit autres companies** | 🔴 OUI (BUG) | ✅ NON (sécurisé) |
| **Audit trail GDPR** | ❌ Aucun | ✅ Oui (audit_logs) |
| **Queries analytics** | ❌ Impossible | ✅ Endpoint sécurisé |

---

## 📞 SUPPORT

**En cas de problème**:
1. Vérifier les logs Supabase: Dashboard → Logs
2. Consulter l'ADR: `docs/ADR-003-MULTI-TENANT-SECURITY-2025-11-15.md`
3. Restaurer le backup si erreur critique
4. Contacter l'équipe Supabase: https://supabase.com/support

---

## 🎯 PROCHAINES ÉTAPES APRÈS MIGRATION

### 1. Régénérer les types TypeScript
```bash
npx supabase gen types typescript --project-id yhidlozgpvzsroetjxqb > src/integrations/supabase/types.ts
```

### 2. Tester le frontend
- [ ] Login en tant que CEO
- [ ] Vérifier que seuls les profils de sa company sont visibles
- [ ] Créer un nouvel employé (company_id auto-assigné)
- [ ] Appeler `/functions/v1/get-stats` depuis le dashboard

### 3. Nettoyer la company par défaut (si applicable)
```sql
-- Vérifier combien de profils utilisent encore la default company
SELECT COUNT(*) FROM profiles WHERE company_id = 'default-company-migration';

-- Si 0, la supprimer
DELETE FROM companies WHERE id = 'default-company-migration';
```

### 4. Monitoring
- Activer Sentry error tracking
- Surveiller les logs RLS (Supabase Dashboard)
- Créer des alertes si queries lentes (RLS overhead)

---

**Créé**: 2025-11-15
**Dernière mise à jour**: 2025-11-15
**Statut**: ✅ Prêt pour exécution
**Approuvé par**: User (execute option a: corrige toutes les erreurs)
