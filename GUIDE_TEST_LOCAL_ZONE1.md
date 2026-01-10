# 🚀 Guide de Test Local - Zone 1 V2 avec Gemini AI

## ✅ Serveur Démarré !

Votre serveur de développement est maintenant en cours d'exécution :
- **URL Locale** : http://localhost:8080/
- **URL Réseau** : http://192.168.1.174:8080/

---

## 🎯 Test Complet en 5 Étapes

### Étape 1 : Accéder à l'Application (1 minute)

1. Ouvrez votre navigateur
2. Allez sur : **http://localhost:8080/**
3. Connectez-vous si nécessaire

---

### Étape 2 : Naviguer vers HCM Data Scanner (30 secondes)

1. Dans la sidebar gauche, cliquez sur **"HCM Data Scanner"**
2. Vous devriez voir la page d'accueil du scanner

**Résultat attendu** :
```
Landing page avec:
- Titre "HCM Data Scanner"
- Description du module
- Bouton "Get Started" ou similaire
```

---

### Étape 3 : Choisir le Mode Zone 1 V2 (30 secondes)

1. Cliquez sur **"Get Started"** ou **"Démarrer"**
2. Vous devriez voir **2 cartes** :
   - **Zone 1 V2 - Business Lines** (avec badge "NOUVEAU" et icône ✨)
   - **Mode Classique** (workflow legacy)

3. **Cliquez sur la carte "Zone 1 V2 - Business Lines"**

**Résultat attendu** :
```
✅ Un job est créé automatiquement
✅ Redirection vers l'interface Zone 1 Orchestrator
✅ Stepper horizontal visible avec 5 étapes
```

---

### Étape 4 : Tester le Workflow Zone 1 (3 minutes)

#### 4.1. Questionnaire - Choix du Mode

Vous devriez voir **2 cartes** :
- **Extract** : Extraction depuis Excel/PDF
- **Calculate** : Calcul depuis comptabilité

**Action** : Cliquez sur **"Extract"**

**⚠️ IMPORTANT** : Pour que l'extraction fonctionne, vous devez d'abord uploader un fichier Excel.

**Problème connu** : Le workflow actuel ne gère pas encore l'upload de fichiers dans Zone 1 V2. Pour contourner cela, nous allons tester avec l'API directement (voir Étape 5).

---

#### 4.2. Alternative - Test avec API (Recommandé pour l'instant)

Comme l'upload n'est pas encore implémenté dans le frontend Zone 1 V2, nous allons tester les API Routes directement avec **curl** ou **Postman**.

---

### Étape 5 : Test avec API Routes (3 minutes)

Ouvrez un nouveau terminal et testez les endpoints :

#### 5.1. Créer un Job

```bash
curl -X POST http://localhost:8080/api/datascanner/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "user_id": "00000000-0000-0000-0000-000000000000"
  }'
```

**Résultat attendu** :
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "year": 2024,
  "progress": {
    "zone1": 0,
    "zone2": 0,
    ...
  },
  "created_at": "2025-11-25T10:00:00.000Z"
}
```

**💡 Copiez le `job_id` retourné.**

---

#### 5.2. Vérifier le Statut Zone 1

```bash
curl http://localhost:8080/api/datascanner/jobs/{job_id}/zones/1
```

Remplacez `{job_id}` par l'ID copié à l'étape précédente.

**Résultat attendu** :
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

#### 5.3. Simuler une Extraction (Test Backend)

**⚠️ NOTE** : Pour tester l'extraction complète, vous devez d'abord :
1. Ajouter votre **SUPABASE_SERVICE_ROLE_KEY** dans `.env`
2. Créer les tables Supabase (voir [QUICK_START_TEST.md](./QUICK_START_TEST.md))
3. Uploader un fichier Excel via l'API `/api/datascanner/jobs/{job_id}/upload`

---

## 🛠️ Configuration Requise pour Test Complet

### 1. Ajouter la Service Role Key Supabase

**Fichier** : `.env`

```bash
# Data Extractor V2 - Supabase Configuration
SUPABASE_SERVICE_ROLE_KEY="votre-service-role-key-ici"
```

**Comment obtenir la clé** :
1. Allez sur : https://supabase.com/dashboard/project/yhidlozgpvzsroetjxqb/settings/api
2. Copiez la **service_role key**
3. Collez-la dans `.env`

---

### 2. Créer les Tables Supabase

**Fichier SQL** : `supabase/migrations/20251125_data_extractor_v2.sql`

1. Allez sur : https://supabase.com/dashboard/project/yhidlozgpvzsroetjxqb/sql/new
2. Copiez le contenu du fichier SQL
3. Collez et cliquez **"RUN"**

**Tables créées** :
- ✅ extraction_jobs
- ✅ uploaded_files
- ✅ zone_choices
- ✅ extracted_data
- ✅ validated_data
- ✅ performance_plan_injections
- ✅ extraction_logs

---

### 3. Redémarrer le Serveur

Après avoir ajouté la clé Supabase, redémarrez le serveur :

```bash
# Arrêter le serveur actuel (Ctrl+C dans le terminal)
# Puis redémarrer
npm run dev
```

---

## 📊 Ce Qui Fonctionne Actuellement

### ✅ Backend Complet
- [x] 3 Services (Extractor, Calculator, Regrouper)
- [x] 5 API Routes (GET status, POST extract, POST calculate, POST regroup, POST validate)
- [x] Gemini 2.5 Flash intégration
- [x] Triple fallback (Gemini → OpenAI → Keywords)
- [x] Création de jobs via API

### ✅ Frontend Zone 1
- [x] Zone1Context (state management)
- [x] Zone1Orchestrator (stepper workflow)
- [x] Zone1Questionnaire (choix Extract/Calculate)
- [x] Zone1RegroupementProposal (affichage Gemini mapping)
- [x] Zone1ValidationTable (édition inline)
- [x] Intégration dans DataScannerMain
- [x] Sélection de mode (V2 vs Legacy)

### ⏳ À Implémenter
- [ ] Upload de fichiers dans le workflow Zone 1 V2
- [ ] Intégration complète du workflow Extract → Regroup → Validate
- [ ] Gestion des erreurs frontend
- [ ] Affichage des données extraites avant regroupement

---

## 🎨 Ce Que Vous Devriez Voir

### Landing Page
![Landing](https://via.placeholder.com/800x400?text=Landing+Page)

### Mode Selection
```
┌─────────────────────────────────────────────────────────────┐
│  Choisissez votre Mode de Scan                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │  ✨ NOUVEAU         │  │                     │          │
│  │  Zone 1 V2          │  │  Mode Classique     │          │
│  │  Business Lines     │  │                     │          │
│  │                     │  │                     │          │
│  │  • Gemini AI        │  │  • Upload Excel/PDF │          │
│  │  • Regroupement     │  │  • Détection mots   │          │
│  │  • 96% moins cher   │  │  • Validation       │          │
│  │                     │  │                     │          │
│  │  [Démarrer avec AI] │  │  [Mode Classique]  │          │
│  └─────────────────────┘  └─────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Zone 1 Orchestrator
```
┌─────────────────────────────────────────────────────────────┐
│  Zone 1 : Business Lines                  Progression: 0%   │
├─────────────────────────────────────────────────────────────┤
│  Progress Bar: [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]   │
├─────────────────────────────────────────────────────────────┤
│  Stepper:                                                   │
│  ● Mode → ○ Extraction → ○ Regroupement → ○ Validation → ○ │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Questionnaire Content Here]                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐛 Problèmes Connus

### 1. Upload de Fichiers Non Implémenté dans V2

**Symptôme** : Après avoir cliqué sur "Extract", rien ne se passe car aucun fichier n'est uploadé.

**Solution Temporaire** : Tester via API Routes (voir Étape 5)

**Correction Prévue** : Ajouter un composant UploadZone dans Zone1Questionnaire

---

### 2. Erreur "SUPABASE_SERVICE_ROLE_KEY not found"

**Symptôme** : Les API Routes retournent une erreur 500.

**Solution** : Ajouter la clé dans `.env` (voir Configuration Requise)

---

### 3. Erreur "Job not found"

**Symptôme** : Les API Routes Zone 1 retournent "Job not found".

**Solution** : Créer un job d'abord avec `POST /api/datascanner/jobs`

---

## 📞 Support

Si vous rencontrez un problème :

1. **Vérifiez les logs du serveur dev** (terminal où vous avez lancé `npm run dev`)
2. **Vérifiez la console du navigateur** (F12 → Console)
3. **Vérifiez que Supabase est configuré** (clé + tables)

---

## 🎉 Prochaines Étapes

Une fois que tout fonctionne :

1. ✅ **Zone 1 V2 complète** avec upload de fichiers
2. ⏳ **Zone 2 - Working Hours** (même architecture)
3. ⏳ **Zones 3-10** (progressivement)
4. ⏳ **Tests d'intégration** avec données réelles
5. ⏳ **Déploiement sur Dokploy**

---

## 💡 Conseil Final

Pour l'instant, le meilleur moyen de tester Zone 1 V2 est :

1. **Créer un job via API** (`POST /api/datascanner/jobs`)
2. **Uploader un fichier Excel** (via API ou via l'interface legacy)
3. **Appeler les API Routes directement** (extract → regroup → validate)
4. **Voir les résultats dans Supabase**

Le frontend complet avec upload sera ajouté dans la prochaine itération ! 🚀

---

**Bon test !** 🎯

Si vous avez des questions ou rencontrez des problèmes, n'hésitez pas à demander de l'aide.
