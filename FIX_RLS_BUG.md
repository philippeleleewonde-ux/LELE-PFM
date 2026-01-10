# 🔥 FIX CRITIQUE: Bug RLS sur extraction_jobs

## 🎯 Problème Identifié

**Erreur:** `No job found with id 0d82bc43-aad1-4563-98c8-cf7640f584a7 for this user`

**Root Cause:** Le `CHECK CONSTRAINT user_owns_job` sur la table `extraction_jobs` **BLOQUE les inserts côté client**.

```sql
-- ❌ CODE BUGUÉ (ligne 33 de 20251125_data_extractor_v2.sql)
CONSTRAINT user_owns_job CHECK (user_id = auth.uid())
```

### Pourquoi ça ne marche pas?

- `auth.uid()` dans un CHECK constraint ne fonctionne PAS de manière fiable côté client
- Le constraint s'exécute AVANT l'insertion et peut retourner NULL
- Résultat: **AUCUN job ne peut être créé** → table vide → backend retourne "No job found"

## ⚡ Solution

Supprimer le CHECK constraint et utiliser de **vraies RLS policies**.

## 📋 Instructions d'Application

### Méthode 1: Via Supabase Dashboard (RECOMMANDÉ)

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard/project/yhidlozgpvzsroetjxqb/editor)
2. Cliquez sur **SQL Editor**
3. Copiez TOUT le contenu de `supabase/migrations/20251126_fix_rls_policies.sql`
4. Collez dans l'éditeur SQL
5. Cliquez **RUN** (ou Ctrl+Enter)
6. Vérifiez le message de succès

### Méthode 2: Via CLI Supabase (si configuré)

```bash
cd "/Users/onclephilbasket/Documents/Sauvergarde docs Macbookair15/Projet Modules HCM ACCOUNTING/HCM-PORTAL V2"
supabase db push
```

## ✅ Vérification Post-Migration

### 1. Vérifier que RLS est activé

Dans le SQL Editor, exécutez:

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('extraction_jobs', 'uploaded_files', 'extracted_data', 'validated_data');
```

**Résultat attendu:** `rowsecurity = true` pour toutes les tables.

### 2. Lister les policies créées

```sql
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'extraction_jobs'
ORDER BY policyname;
```

**Résultat attendu:** 4 policies (INSERT, SELECT, UPDATE, DELETE)

### 3. Tester la création d'un job

1. Retournez sur http://localhost:8080
2. Connectez-vous
3. Allez sur **HCM Data Scanner**
4. Cliquez **"Commencer le scanning"**
5. Uploadez un fichier PDF/Excel

**Résultat attendu:** Le job est créé avec succès (pas d'erreur)

## 🧪 Test Direct via Console

Ouvrez la console navigateur (F12) et testez:

```javascript
const { data: job, error } = await supabase
  .from('extraction_jobs')
  .insert({
    user_id: (await supabase.auth.getSession()).data.session.user.id,
    status: 'pending',
    file_count: 0,
    progress: { zone1: 0 }
  })
  .select()
  .single()

console.log('Job created:', job)
console.log('Error:', error)
```

**Si succès:** `job` contiendra l'objet créé
**Si échec:** `error` montrera le message d'erreur

## 📊 Impact

Avant le fix:
- ❌ Impossible de créer des jobs
- ❌ Workflow complètement bloqué
- ❌ Table `extraction_jobs` vide

Après le fix:
- ✅ Jobs créés normalement
- ✅ Workflow fonctionnel
- ✅ RLS policies correctes
- ✅ Sécurité maintenue (chaque user voit SEULEMENT ses jobs)

## 🔐 Sécurité RLS Appliquée

Les nouvelles policies assurent:

1. **Isolation des données:** Chaque utilisateur voit UNIQUEMENT ses propres jobs
2. **Cascade de sécurité:** Les fichiers/extracted_data/validated_data héritent de la sécurité via JOIN
3. **Auth obligatoire:** Toutes les opérations requièrent `authenticated` role
4. **Vérification double:** `WITH CHECK` + `USING` pour INSERT/UPDATE

## 📝 Prochaines Étapes

Après avoir appliqué cette migration:

1. ✅ **Tester la création de job** - Devrait fonctionner
2. ✅ **Upload de fichier** - Devrait persister dans `uploaded_files`
3. ✅ **Extraction backend** - Devrait trouver le job
4. ✅ **Workflow complet** - De bout en bout

## 🆘 Si ça ne marche TOUJOURS pas

1. Vérifiez que vous êtes bien **connecté** (token valide)
2. Vérifiez les logs navigateur (F12 → Console)
3. Vérifiez les logs backend (terminal où tourne le serveur Express)
4. Contactez-moi avec les logs exacts
