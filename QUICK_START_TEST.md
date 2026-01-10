# ⚡ Quick Start - Test Gemini & Zone 1 en 5 Minutes

## 🎯 Test Rapide Gemini (1 minute)

```bash
cd "/Users/onclephilbasket/Documents/Sauvergarde docs Macbookair15/Projet Modules HCM ACCOUNTING/HCM-PORTAL V2"
npx tsx scripts/test-gemini.ts
```

**Résultat attendu** :
```
🎉 Gemini integration test SUCCESSFUL!
```

✅ **Si ça marche → Gemini est opérationnel !**

---

## 🚀 Test Complet en 3 Étapes

### Étape 1 : Configuration (2 minutes)

1. **Récupérer Service Role Key Supabase** :
   - Aller sur : https://supabase.com/dashboard/project/yhidlozgpvzsroetjxqb/settings/api
   - Copier la **service_role key**

2. **Ajouter dans `.env`** :
   ```bash
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
   ```

3. **Créer les tables Supabase** :
   - Aller sur : https://supabase.com/dashboard/project/yhidlozgpvzsroetjxqb/sql/new
   - Copier le contenu de `supabase/migrations/20251125_data_extractor_v2.sql`
   - Coller et cliquer **"RUN"**

### Étape 2 : Démarrer le Serveur (10 secondes)

```bash
npm run dev
```

**Ouvrir** : http://localhost:5173/

### Étape 3 : Tester avec Postman/Insomnia (2 minutes)

#### 3.1. Créer un Job

**POST** `http://localhost:5173/api/datascanner/jobs`

**Body** :
```json
{
  "year": 2024,
  "user_id": "00000000-0000-0000-0000-000000000000"
}
```

**Copier le `job_id` retourné.**

#### 3.2. Tester Gemini Regroupement 🌟

**POST** `http://localhost:5173/api/datascanner/jobs/{job_id}/zones/1/regroup`

**Body** :
```json
{
  "use_llm": true,
  "llm_provider": "gemini"
}
```

**Résultat après 10-15 secondes** :
```json
{
  "success": true,
  "method": "llm",
  "data": {
    "business_lines": [...],
    "mapping": {...}
  }
}
```

✅ **Si ça fonctionne → Gemini + API Routes = 100% Opérationnel !**

---

## 📋 Checklist Rapide

- [ ] Test Gemini avec script → ✅
- [ ] Service Role Key ajoutée → ⏳
- [ ] Tables Supabase créées → ⏳
- [ ] Serveur dev démarré → ⏳
- [ ] API Routes testées → ⏳

---

## 🆘 Problème ?

### Erreur : "GEMINI_API_KEY not found"

**Solution** : Vérifier que `.env` contient :
```bash
GEMINI_API_KEY="AIzaSyCNQa5O1iLjBFCY6HokSmcfbwULIPPVK6s"
```

### Erreur : "SUPABASE_SERVICE_ROLE_KEY not found"

**Solution** : Ajouter la clé dans `.env` (voir Étape 1).

### Erreur : "Job not found"

**Solution** : Créer un job d'abord (Étape 3.1).

---

## 📚 Documentation Complète

Pour plus de détails, voir :
- **Guide de Test Complet** : `GUIDE_TEST_ZONE1.md`
- **Données d'Exemple** : `docs/SAMPLE_DATA_ZONE1.md`
- **Architecture** : `docs/architecture/ADR_DATA_EXTRACTOR_V2.md`

---

## 🎉 Résultat Final

Si tout fonctionne :
- ✅ Gemini 2.5 Flash intégré
- ✅ Backend Zone 1 complet (3 services + 5 API routes)
- ✅ Fallback automatique (Gemini → OpenAI → Keywords)
- ✅ Regroupement intelligent en 10-15 secondes
- ✅ Coût : **$0.001/requête** (96% moins cher que GPT-4)

**Prochaine étape** : Créer les composants Frontend Zone 1 ! 🚀
