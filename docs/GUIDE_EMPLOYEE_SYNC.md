# 📋 Guide: Synchronisation Employés Module 3 → Table Principale

## 🎯 Objectif

Synchroniser automatiquement les employés créés dans **Module 3 (HCM Cost Savings)** vers la **table principale `employees`** de l'entreprise, pour les rendre disponibles dans tous les modules.

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  Module 3: Team Members                 │
│  public.module3_team_members            │
│  ├─ name                                 │
│  ├─ professional_category               │
│  ├─ tech_level                          │
│  ├─ handicap_shape                      │
│  └─ employee_id (NEW) ──────────┐       │
└─────────────────────────────────────────┘
                                  │
                                  │  TRIGGER
                                  │  sync_module3_member_to_employees()
                                  ▼
┌─────────────────────────────────────────┐
│  Entreprise: Employés Principaux        │
│  {schema_entreprise}.employees          │
│  ├─ id (UUID)                           │
│  ├─ employee_id (EMP-12345)             │
│  ├─ first_name                          │
│  ├─ last_name                           │
│  ├─ email                               │
│  ├─ role                                │
│  ├─ department                          │
│  └─ position                            │
└─────────────────────────────────────────┘
```

## 📝 Étape 1: Appliquer la Migration SQL

### Option A: Via Supabase Dashboard (Recommandé)

1. Connectez-vous à **Supabase Dashboard**
2. Allez dans **SQL Editor**
3. Copiez le contenu de `supabase/migrations/20251202_sync_module3_employees.sql`
4. Cliquez sur **Run**

### Option B: Via Supabase CLI

```bash
# Déployer la migration
supabase db push

# OU appliquer manuellement
supabase db execute -f supabase/migrations/20251202_sync_module3_employees.sql
```

## ✅ Étape 2: Vérifier l'Installation

Exécutez cette requête dans SQL Editor pour vérifier:

```sql
-- Vérifier que la colonne employee_id existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'module3_team_members'
AND column_name = 'employee_id';

-- Vérifier que le trigger existe
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'sync_module3_member_trigger';

-- Vérifier que les fonctions existent
SELECT proname
FROM pg_proc
WHERE proname IN ('sync_module3_member_to_employees', 'get_module3_member_employee_details');
```

**Résultat attendu:**
- ✅ 1 colonne `employee_id` de type `uuid`
- ✅ 1 trigger `sync_module3_member_trigger` enabled
- ✅ 2 fonctions

## 🚀 Étape 3: Test de Synchronisation

### Test 1: Créer un Employé DEMO

1. Connectez-vous en tant que CEO
2. Allez dans **Module 3 - HCM Cost Savings**
3. Créez une ligne d'activité
4. Cliquez sur **"Generate DEMO"**
5. Vérifiez que 5 employés sont créés

### Test 2: Vérifier la Synchronisation

Exécutez cette requête pour voir les employés synchronisés:

```sql
-- Remplacez 'tenant_votre_entreprise' par votre schéma
SELECT
  e.id,
  e.employee_id,
  e.first_name,
  e.last_name,
  e.email,
  e.position,
  e.department,
  e.hire_date
FROM tenant_votre_entreprise.employees e
WHERE e.department = 'Module 3 - Cost Savings'
ORDER BY e.created_at DESC;
```

**Résultat attendu:** 5 employés avec les noms:
- Marie Dubois
- Thomas Martin
- Sophie Bernard
- Pierre Lefevre
- Claire Moreau

## 🔍 Étape 4: Vérifier le Lien

Vérifiez que `module3_team_members.employee_id` pointe vers `employees.id`:

```sql
SELECT
  m.id as member_id,
  m.name as member_name,
  m.employee_id,
  e.first_name || ' ' || e.last_name as employee_name,
  e.email
FROM public.module3_team_members m
LEFT JOIN tenant_votre_entreprise.employees e ON m.employee_id = e.id
WHERE m.business_line_id = 'your-business-line-id'
LIMIT 5;
```

## 📊 Fonctionnalités

### Synchronisation Automatique

Quand vous créez un employé dans Module 3:

1. **Trigger se déclenche** automatiquement
2. **Récupère le schéma** de l'entreprise via `business_line_id`
3. **Crée l'employé** dans `{schema}.employees`:
   - `first_name` + `last_name` extraits du nom
   - `email` généré: `prenom.nom@company.local`
   - `employee_id` unique: `EMP-12345`
   - `role`: `EMPLOYEE` (par défaut)
   - `department`: `Module 3 - Cost Savings`
   - `position`: Catégorie professionnelle (Executive, Supervisor, etc.)
4. **Stocke le lien** dans `module3_team_members.employee_id`

### Gestion des Doublons

Si un employé avec le même email existe déjà:
- ✅ **Mise à jour** au lieu de créer un doublon
- ✅ Met à jour: `first_name`, `last_name`, `position`
- ✅ Préserve: `role`, `hire_date`, autres données

## 🎁 Fonction Helper

Utilisez cette fonction pour récupérer les détails complets d'un employé:

```sql
-- Récupérer les détails d'un member avec ses infos employé
SELECT * FROM public.get_module3_member_employee_details('member-uuid-here');
```

**Retourne:**
- Données de base: `employee_id`, `name`, `email`, `department`, `position`
- Données Module 3: `tech_level`, `handicap_shape`, `incapacity_rate`

## 🔐 Sécurité

- ✅ **RLS activé** sur la table `employees`
- ✅ **Isolation multi-tenant** via schémas PostgreSQL
- ✅ **Fonction SECURITY DEFINER** pour bypass RLS de manière sécurisée
- ✅ Chaque entreprise voit uniquement ses propres employés

## 🛠️ Dépannage

### Problème: Trigger ne se déclenche pas

```sql
-- Vérifier que le trigger est activé
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'sync_module3_member_trigger';

-- Réactiver si nécessaire
ALTER TABLE public.module3_team_members
ENABLE TRIGGER sync_module3_member_trigger;
```

### Problème: Erreur "schema does not exist"

Cela signifie que l'entreprise n'a pas de schéma créé.

**Solution:**
```sql
-- Vérifier que l'entreprise existe
SELECT id, name, schema_name, owner_user_id
FROM public.companies
WHERE owner_user_id = 'your-user-id';

-- Si aucune entreprise, en créer une
INSERT INTO public.companies (name, slug, schema_name, owner_user_id)
VALUES (
  'Ma Société',
  'ma-societe',
  public.generate_schema_name('ma-societe'),
  'your-user-id'
);
```

### Problème: employee_id reste NULL

Vérifier les logs PostgreSQL:

```sql
-- Voir les warnings de la dernière heure
SELECT * FROM pg_stat_statements
WHERE query LIKE '%sync_module3%'
ORDER BY last_exec DESC
LIMIT 10;
```

## 📈 Utilisation Future

Les employés synchronisés seront disponibles pour:

- ✅ **Module 4**: Performance Cards (évaluations)
- ✅ **Module 5**: Reporting global
- ✅ **Module 6**: Gestion des équipes
- ✅ **Dashboard RH**: Vue d'ensemble des employés
- ✅ **Export de données**: Rapports consolidés

## 🎯 Prochaines Étapes

1. ✅ Migration appliquée
2. ✅ Tests de synchronisation réussis
3. 🔜 Créer une interface UI pour gérer les employés
4. 🔜 Ajouter la possibilité d'inviter des employés (créer compte auth)
5. 🔜 Importer des employés en masse (CSV/Excel)

---

**Date de création**: 2025-12-02
**Version**: 1.0.0
**Auteur**: Claude Code (elite-saas-developer)
