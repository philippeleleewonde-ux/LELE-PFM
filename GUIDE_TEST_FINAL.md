# 🎯 GUIDE DE TEST FINAL - Workflow End-to-End

## ✅ Statut de l'Implémentation

### Backend Express.js ✅
- [x] Serveur running sur port 3001
- [x] Routes API `/api/datascanner/jobs/:id/zones/1/extract`
- [x] Middleware auth Supabase JWT
- [x] Service BusinessLinesExtractor avec Gemini AI
- [x] CORS configuré pour frontend

### Frontend Vite + React ✅
- [x] Serveur running sur port 8080
- [x] Appel backend API (plus de mock data)
- [x] Authentification Supabase
- [x] Upload de fichiers vers Supabase Storage

### Database Supabase ✅
- [x] Migration RLS appliquée (26 policies actives)
- [x] Tables: extraction_jobs, uploaded_files, extracted_data, validated_data
- [x] RLS activé sur toutes les tables
- [x] Isolation par utilisateur garantie

---

## 🚀 PROCÉDURE DE TEST

### Pré-requis

Vérifiez que les 2 serveurs tournent:

```bash
# Terminal 1: Frontend
cd "/Users/onclephilbasket/Documents/Sauvergarde docs Macbookair15/Projet Modules HCM ACCOUNTING/HCM-PORTAL V2"
npm run dev
# Doit afficher: http://localhost:8080

# Terminal 2: Backend
cd "/Users/onclephilbasket/Documents/Sauvergarde docs Macbookair15/Projet Modules HCM ACCOUNTING/HCM-PORTAL V2/backend"
npm run dev
# Doit afficher: Server running on http://localhost:3001
```

---

### Test 1: Connexion Utilisateur ✅

1. Ouvrez http://localhost:8080
2. Connectez-vous avec vos credentials Supabase
3. **Vérification:** Vous devez voir le dashboard CEO

**Si échec:** Vérifiez que Supabase Auth est configuré correctement

---

### Test 2: Accès HCM Data Scanner ✅

1. Cliquez sur **"HCM Data Scanner"** dans le menu
2. Vous devez voir la landing page avec bouton "Commencer le scanning"
3. Cliquez **"Commencer le scanning"**

**Vérification:** L'interface Zone 1 doit s'afficher

---

### Test 3: Création de Job (CRITIQUE) 🔥

1. La page Zone 1 doit s'afficher SANS erreur
2. Ouvrez la console browser (F12 → Console)
3. Cherchez le log: `✅ Job created: [uuid]`

**Si succès:**
```
✅ Job created: 0d82bc43-aad1-4563-98c8-cf7640f584a7
```

**Si échec (ancien bug):**
```
❌ Failed to create job: {
  code: "23514",
  message: "The string did not match the expected pattern"
}
```

**Action si échec:** La migration RLS n'est PAS appliquée correctement. Vérifier dans Supabase Dashboard:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'extraction_jobs';
```

Résultat attendu: `rowsecurity = true`

---

### Test 4: Sélection Mode Extraction ✅

1. Vous voyez 2 cards: **"Extraction Directe"** et **"Calcul Comptable"**
2. Cliquez sur **"Extraction Directe"** (Recommandé)
3. Badge "NOUVEAU" + icône Sparkles ✨

**Vérification:** Une zone d'upload de fichiers doit apparaître

---

### Test 5: Upload de Fichier 📤

1. Cliquez dans la zone d'upload ou faites glisser un fichier
2. **Fichiers acceptés:** Excel (.xlsx, .xls) ou PDF
3. Max 5 fichiers, 10 MB par fichier

**Test avec fichier réel:**
- Uploadez un fichier Excel contenant des données financières
- Cherchez des colonnes: "Chiffre d'affaires", "Revenue", "CA N", "CA N-1", etc.

**Vérification:**
- Barre de progression s'affiche
- Statut passe à "completed"
- Fichier apparaît dans la liste avec ✓

**Logs attendus dans console:**
```
🔧 Uploading file: rapport_financier.xlsx
✅ File uploaded successfully
Storage path: 576321f0-6df3-4c9f-86c8-27312db4044a/[jobId]/rapport_financier.xlsx
```

---

### Test 6: Extraction avec Backend (CRITIQUE) 🚀

1. Une fois le fichier uploadé, un bouton **"Extraire les données"** apparaît
2. Cliquez sur ce bouton
3. **Attendu:** Loading state avec animation Sparkles

**Dans la console frontend:**
```
🚀 Calling backend API for extraction...
Job ID: 0d82bc43-aad1-4563-98c8-cf7640f584a7
```

**Dans le terminal backend:**
```
[API] POST /zones/1/extract - Job: 0d82bc43-..., User: 576321f0-...
[API] Found 1 Excel file(s) to process
[API] Downloading file: rapport_financier.xlsx from ...
[API] ✅ Successfully parsed rapport_financier.xlsx
[API] 🚀 Starting extraction with Gemini AI...
[Gemini] Analyzing workbook...
[Gemini] Found 15 potential business lines
[Gemini] Regrouping to 8 lines...
[API] ✅ Extraction complete: 8 lines detected
```

**Vérification:**
- Toast notification: "✅ Extraction Réussie - 8 lignes détectées avec 92% de confiance"
- Pas d'erreur "No job found" 🎉
- Passage automatique à l'étape suivante

---

### Test 7: Résultat Extraction ✅

Après extraction, vous devez voir:

1. **Table des business lines extraites**
   - Colonnes: Nom, Revenue N, Revenue N-1, Effectifs, Évolution
   - 8 lignes maximum (ou moins si fichier petit)

2. **Proposition de regroupement** (si > 8 lignes détectées)
   - Card avec suggestion Gemini AI
   - Bouton "Appliquer le regroupement"

3. **Score de confiance**
   - Badge coloré:
     - Vert (90%+): Haute confiance
     - Orange (70-89%): Confiance moyenne
     - Rouge (<70%): Vérification recommandée

---

### Test 8: Validation & Sauvegarde ✅

1. Vérifiez les données extraites
2. Modifiez si nécessaire (inline editing)
3. Cliquez **"Valider les données"**

**Backend doit sauvegarder dans:**
- Table `extracted_data` (données brutes)
- Table `validated_data` (après validation)
- Mise à jour `extraction_jobs.progress.zone1 = 100`

---

## 🔍 Vérifications Database

### Vérifier le job créé

```sql
SELECT
  id,
  user_id,
  status,
  file_count,
  progress->>'zone1' as zone1_progress,
  created_at
FROM extraction_jobs
ORDER BY created_at DESC
LIMIT 5;
```

**Résultat attendu:**
```
id                                   | user_id      | status  | file_count | zone1_progress | created_at
-------------------------------------|--------------|---------|------------|----------------|-------------------
0d82bc43-aad1-4563-98c8-cf7640f584a7 | 576321f0-... | pending | 1          | 100            | 2025-11-26 20:...
```

### Vérifier les fichiers uploadés

```sql
SELECT
  filename,
  file_type,
  status,
  storage_path,
  created_at
FROM uploaded_files
WHERE job_id = '0d82bc43-aad1-4563-98c8-cf7640f584a7';
```

### Vérifier les données extraites

```sql
SELECT
  zone_number,
  zone_name,
  extraction_method,
  confidence_score,
  (raw_data->>'total_lines')::int as total_lines
FROM extracted_data
WHERE job_id = '0d82bc43-aad1-4563-98c8-cf7640f584a7';
```

---

## ❌ Résolution de Problèmes

### Erreur: "No job found with id xxx"

**Cause:** RLS policies pas appliquées ou job pas créé

**Solution:**
1. Vérifiez RLS activé:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'extraction_jobs';
   ```
2. Vérifiez policies:
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'extraction_jobs';
   ```
3. Réappliquez migration si nécessaire

### Erreur: "Failed to upload file"

**Cause:** Bucket Supabase Storage pas configuré

**Solution:**
1. Allez sur Supabase Dashboard → Storage
2. Créez le bucket `datascanner-uploads`
3. Configurez les policies RLS pour upload

### Erreur: CORS lors de l'appel backend

**Cause:** Backend CORS pas configuré pour localhost:8080

**Solution:**
Vérifiez [backend/src/server.ts](backend/src/server.ts#L30-L35):
```typescript
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:8080'],
  credentials: true
}))
```

### Erreur: "Invalid or expired token"

**Cause:** Session Supabase expirée

**Solution:** Reconnectez-vous sur http://localhost:8080

---

## ✅ Critères de Succès

Le test est **RÉUSSI** si:

1. ✅ Job créé sans erreur "The string did not match"
2. ✅ Fichier uploadé dans Supabase Storage
3. ✅ Backend extrait les données (logs visibles)
4. ✅ Gemini AI regroupe intelligemment (si > 8 lignes)
5. ✅ Données affichées dans l'interface
6. ✅ Validation sauvegarde en database
7. ✅ Aucune erreur dans console browser/terminal

---

## 🎉 Après le Succès

Une fois le workflow validé:

1. **Nettoyer les jobs de test:**
   ```sql
   DELETE FROM extraction_jobs WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 day';
   ```

2. **Cleanup des policies dupliquées** (optionnel):
   - Lister: `SELECT policyname FROM pg_policies WHERE tablename = 'extraction_jobs';`
   - Identifier les doublons
   - Supprimer: `DROP POLICY "nom_policy" ON extraction_jobs;`

3. **Documenter les configurations:**
   - Variables d'environnement requises
   - Setup Supabase Storage
   - Clés API Gemini

4. **Préparer déploiement:**
   - Backend sur Railway/Render
   - Frontend sur Vercel
   - Database déjà sur Supabase (production ready)

---

## 📞 Support

Si problèmes persistent:

1. Vérifiez les logs backend (terminal)
2. Vérifiez les logs frontend (F12 → Console)
3. Testez la santé du backend: http://localhost:3001/api/datascanner/health
4. Vérifiez Supabase Dashboard pour les erreurs RLS

**Logs à fournir si support nécessaire:**
- Console browser (F12 → Console)
- Terminal backend
- Query SQL qui échoue
- Screenshot de l'erreur
