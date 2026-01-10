# 🧪 Guide de Test Complet - Zone 1 & Gemini Integration

## 📋 Prérequis

Avant de commencer les tests, assurez-vous d'avoir :

- ✅ Node.js installé
- ✅ Gemini API Key configurée dans `.env` (déjà fait)
- ✅ Projet Supabase actif
- ✅ Service Role Key Supabase (à configurer)

---

## 🎯 Test 1 : Test Gemini 2.5 Flash (Déjà Réussi ✅)

### Commande

```bash
cd "/Users/onclephilbasket/Documents/Sauvergarde docs Macbookair15/Projet Modules HCM ACCOUNTING/HCM-PORTAL V2"
npx tsx scripts/test-gemini.ts
```

### Résultat Attendu

```
✅ GEMINI_API_KEY found
✅ Gemini client initialized
✅ Response received!
⏱️  Duration: 9-12 secondes
✅ Structure validation passed: 2 grouped lines
🎉 Gemini integration test SUCCESSFUL!
```

### Ce que ça teste

- ✅ Connexion à l'API Gemini
- ✅ Format JSON forcé
- ✅ Regroupement sémantique intelligent
- ✅ Reasoning pour chaque décision

---

## 🎯 Test 2 : Configuration Supabase Service Role Key

### Étape 1 : Récupérer le Service Role Key

1. Allez sur : https://supabase.com/dashboard/project/yhidlozgpvzsroetjxqb/settings/api
2. Copiez le **service_role key** (section "Project API keys")
3. ⚠️ **ATTENTION** : Cette clé donne accès complet à votre base de données. Ne la partagez JAMAIS.

### Étape 2 : Configurer dans .env

Ouvrez le fichier `.env` et remplacez :

```bash
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

Par votre vraie clé :

```bash
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey..."
```

---

## 🎯 Test 3 : Créer les Tables Supabase

### Étape 1 : Exécuter la Migration SQL

1. Allez sur : https://supabase.com/dashboard/project/yhidlozgpvzsroetjxqb/sql/new
2. Copiez le contenu du fichier : `supabase/migrations/20251125_data_extractor_v2.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur **"RUN"**

### Résultat Attendu

Vous devriez voir :

```
Success. No rows returned
```

Et 7 nouvelles tables créées :
- ✅ extraction_jobs
- ✅ uploaded_files
- ✅ zone_choices
- ✅ extracted_data
- ✅ validated_data
- ✅ performance_plan_injections
- ✅ extraction_logs

### Vérification

Allez dans l'onglet **"Table Editor"** et vérifiez que les tables existent.

---

## 🎯 Test 4 : Démarrer le Serveur de Développement

### Commande

```bash
npm run dev
```

### Résultat Attendu

```
VITE v5.x.x  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### Vérification

Ouvrez votre navigateur sur : http://localhost:5173/

---

## 🎯 Test 5 : Tester les API Routes avec Postman/Insomnia

### Prérequis

- Serveur dev en cours d'exécution (`npm run dev`)
- Un fichier Excel de test (ex: `business_lines_sample.xlsx`)

### Test 5.1 : Créer un Job d'Extraction

**Endpoint** : `POST http://localhost:5173/api/datascanner/jobs`

**Body (JSON)** :
```json
{
  "year": 2024,
  "user_id": "00000000-0000-0000-0000-000000000000"
}
```

**Résultat Attendu** :
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "progress": {
    "zone1": 0,
    "zone2": 0,
    ...
  },
  "created_at": "2025-11-25T10:00:00.000Z"
}
```

**💡 Copiez le `job_id` pour les tests suivants.**

---

### Test 5.2 : Vérifier le Statut Zone 1

**Endpoint** : `GET http://localhost:5173/api/datascanner/jobs/{job_id}/zones/1`

**Headers** :
```
Content-Type: application/json
```

**Résultat Attendu** :
```json
{
  "zone_number": 1,
  "zone_name": "Business Lines",
  "choice": null,
  "extracted_data": null,
  "validated_data": null,
  "status": "pending"
}
```

---

### Test 5.3 : Uploader un Fichier Excel

**Endpoint** : `POST http://localhost:5173/api/datascanner/jobs/{job_id}/upload`

**Body (FormData)** :
```
file: business_lines_sample.xlsx
file_type: excel
```

**Résultat Attendu** :
```json
{
  "success": true,
  "file_id": "...",
  "filename": "business_lines_sample.xlsx",
  "storage_path": "uploads/..."
}
```

---

### Test 5.4 : Lancer l'Extraction (Mode Extract)

**Endpoint** : `POST http://localhost:5173/api/datascanner/jobs/{job_id}/zones/1/extract`

**Body (JSON)** :
```json
{}
```

**Résultat Attendu** :
```json
{
  "success": true,
  "data": {
    "business_lines": [
      {
        "name": "Ventes e-commerce",
        "category": "Sales & Distribution",
        "year": 2024,
        "metrics": {
          "revenue": 500000,
          "expenses": 300000,
          "headcount": 15
        },
        "confidence": 0.85
      },
      ...
    ],
    "total_lines": 12,
    "detection_method": "keyword"
  },
  "needs_regrouping": true,
  "total_detected": 12,
  "confidence": 0.85,
  "message": "12 business lines detected. Regrouping required."
}
```

**💡 Si `needs_regrouping: true`, passez au Test 5.5.**

---

### Test 5.5 : Regrouper avec Gemini 2.5 Flash 🌟

**Endpoint** : `POST http://localhost:5173/api/datascanner/jobs/{job_id}/zones/1/regroup`

**Body (JSON)** :
```json
{
  "use_llm": true,
  "llm_provider": "gemini"
}
```

**Résultat Attendu (après 10-15 secondes)** :
```json
{
  "success": true,
  "data": {
    "business_lines": [
      {
        "name": "Sales & Distribution",
        "category": "Sales & Distribution",
        "year": 2024,
        "metrics": {
          "revenue": 1300000,
          "expenses": 800000,
          "headcount": 40
        },
        "confidence": 0.85
      },
      ...
    ],
    "total_lines": 8,
    "detection_method": "llm",
    "mapping": {
      "Ventes e-commerce": {
        "groupedLineName": "Sales & Distribution",
        "groupedCategory": "Sales & Distribution",
        "reasoning": "Both represent core commercial activities..."
      },
      ...
    }
  },
  "method": "llm",
  "confidence": 0.85,
  "original_count": 12,
  "message": "Successfully regrouped 12 lines into 8 using llm."
}
```

**🎉 C'est ici que Gemini brille !**

**Durée attendue** : 10-15 secondes
**Méthode** : `llm` (Gemini 2.5 Flash)

---

### Test 5.6 : Valider les Données

**Endpoint** : `POST http://localhost:5173/api/datascanner/jobs/{job_id}/zones/1/validate`

**Body (JSON)** :
```json
{
  "business_lines": [
    {
      "name": "Sales & Distribution",
      "category": "Sales & Distribution",
      "year": 2024,
      "metrics": {
        "revenue": 1300000,
        "expenses": 800000,
        "headcount": 40
      }
    },
    {
      "name": "Technology & R&D",
      "category": "Technology & R&D",
      "year": 2024,
      "metrics": {
        "revenue": 500000,
        "expenses": 300000,
        "headcount": 20
      }
    },
    ...
  ],
  "user_notes": "Données validées après regroupement Gemini"
}
```

**Résultat Attendu** :
```json
{
  "success": true,
  "data": {
    "business_lines": [...],
    "total_lines": 8,
    "detection_method": "llm"
  },
  "zone_completed": true,
  "job_completed": false,
  "message": "Zone 1 validated successfully. Proceed to next zone."
}
```

---

## 🎯 Test 6 : Tester le Workflow Complet avec un Script

### Créer un Script de Test End-to-End

```bash
npx tsx scripts/test-zone1-workflow.ts
```

*(Script à créer si vous le souhaitez)*

---

## 📊 Tableau Récapitulatif des Tests

| Test | Endpoint | Méthode | Durée | Status |
|------|----------|---------|-------|--------|
| **1. Gemini Integration** | N/A | Script | 10s | ✅ Réussi |
| **2. Service Role Key** | Config | Manual | 1min | ⏳ À faire |
| **3. Migration SQL** | Supabase | SQL | 2min | ⏳ À faire |
| **4. Dev Server** | localhost:5173 | npm | 10s | ⏳ À faire |
| **5.1. Create Job** | POST /jobs | API | <1s | ⏳ À tester |
| **5.2. Get Status** | GET /zones/1 | API | <1s | ⏳ À tester |
| **5.3. Upload File** | POST /upload | API | 1-2s | ⏳ À tester |
| **5.4. Extract** | POST /extract | API | 2-5s | ⏳ À tester |
| **5.5. Regroup (Gemini)** | POST /regroup | API | **10-15s** | ⏳ À tester |
| **5.6. Validate** | POST /validate | API | <1s | ⏳ À tester |

---

## 🐛 Debugging

### Logs Backend

Les API Routes loguent dans la console du serveur dev. Regardez les logs pour :

```
[API] POST /zones/1/regroup - Job: 550e8400-...
[BusinessLinesRegrouper] Using Gemini 2.5 Flash for intelligent regrouping...
[API] Regrouping complete: 8 lines
[API] Method used: llm
[API] Confidence: 0.85
```

### Erreurs Communes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `GEMINI_API_KEY not found` | Clé manquante | Vérifier `.env` |
| `SUPABASE_SERVICE_ROLE_KEY not found` | Clé manquante | Ajouter dans `.env` |
| `Job not found` | Job inexistant | Créer un job d'abord (Test 5.1) |
| `No files found` | Pas de fichiers uploadés | Uploader un Excel (Test 5.3) |
| `Regrouping not needed` | ≤ 8 lignes détectées | Normal, passer à validation |
| `Gemini regrouping failed` | Quota dépassé ou erreur | Vérifier quota Gemini (1500/jour) |

---

## 💡 Conseils

1. **Testez dans l'ordre** : Les tests dépendent les uns des autres.
2. **Sauvegardez les IDs** : Notez le `job_id` après le Test 5.1.
3. **Vérifiez les logs** : La console du serveur dev affiche tout.
4. **Patience avec Gemini** : Le regroupement prend 10-15 secondes (normal).
5. **Quota Gemini** : Free tier = 1500 requêtes/jour (largement suffisant).

---

## 🎉 Succès Total

Si tous les tests passent :

- ✅ Gemini 2.5 Flash opérationnel
- ✅ Backend Zone 1 fonctionnel
- ✅ API Routes testées
- ✅ Workflow end-to-end validé

**Prochaine étape** : Créer les composants Frontend Zone 1 !

---

## 📞 Support

Si un test échoue :
1. Vérifiez les logs du serveur dev
2. Vérifiez la console réseau (F12 dans le navigateur)
3. Consultez `GUIDE_TEST_ZONE1.md` (ce fichier)
4. Demandez de l'aide si besoin

**Bon test !** 🚀
