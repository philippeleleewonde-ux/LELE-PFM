# 📊 Données d'Exemple pour Test Zone 1

## 🎯 Objectif

Ce fichier contient des données de test que vous pouvez utiliser pour tester le workflow Zone 1 (Business Lines).

---

## 📋 Scénario 1 : 12 Business Lines → Regroupement Gemini

### Fichier Excel à créer : `business_lines_test_12.xlsx`

**Créez un fichier Excel avec ces colonnes et données :**

| Business Line | Revenue 2024 | Expenses 2024 | Headcount |
|---------------|--------------|---------------|-----------|
| Ventes e-commerce | 500,000 | 300,000 | 15 |
| Distribution retail | 800,000 | 500,000 | 25 |
| Ventes B2B | 600,000 | 350,000 | 20 |
| Services IT | 300,000 | 200,000 | 10 |
| Développement logiciel | 400,000 | 250,000 | 12 |
| Conseil stratégique | 450,000 | 280,000 | 18 |
| Formation et coaching | 200,000 | 120,000 | 8 |
| Support technique | 180,000 | 100,000 | 7 |
| Marketing digital | 220,000 | 150,000 | 9 |
| Communication | 150,000 | 90,000 | 6 |
| Administration RH | 100,000 | 80,000 | 5 |
| Comptabilité | 120,000 | 100,000 | 4 |

**Total : 12 lignes** → Déclenchera le regroupement Gemini

### Résultat Attendu après Gemini

Gemini devrait regrouper en **8 catégories** :

1. **Sales & Distribution** : Ventes e-commerce + Distribution retail + Ventes B2B
   - Revenue: 1,900,000 €
   - Headcount: 60

2. **Technology & R&D** : Services IT + Développement logiciel
   - Revenue: 700,000 €
   - Headcount: 22

3. **Services & Consulting** : Conseil stratégique + Formation et coaching + Support technique
   - Revenue: 830,000 €
   - Headcount: 33

4. **Marketing & Communication** : Marketing digital + Communication
   - Revenue: 370,000 €
   - Headcount: 15

5. **Administrative & Support** : Administration RH + Comptabilité
   - Revenue: 220,000 €
   - Headcount: 9

6-8. **Autres catégories vides** (si pas de données)

---

## 📋 Scénario 2 : 5 Business Lines → Pas de Regroupement

### Fichier Excel à créer : `business_lines_test_5.xlsx`

| Business Line | Revenue 2024 | Expenses 2024 | Headcount |
|---------------|--------------|---------------|-----------|
| Sales & Distribution | 1,500,000 | 900,000 | 50 |
| Technology & R&D | 800,000 | 500,000 | 30 |
| Services & Consulting | 600,000 | 350,000 | 25 |
| Marketing & Communication | 300,000 | 180,000 | 15 |
| Administrative & Support | 200,000 | 150,000 | 10 |

**Total : 5 lignes** → Pas de regroupement nécessaire, ajout de 3 lignes vides pour atteindre 8.

---

## 📋 Scénario 3 : Données Comptables pour Mode Calculate

### Fichier Excel à créer : `accounting_data_test.xlsx`

**Feuille "Comptabilité" avec colonnes :**

| Code Comptable | Libellé | Montant Revenue | Montant Charges |
|----------------|---------|-----------------|-----------------|
| 707 | Ventes de marchandises | 500,000 | 0 |
| 706 | Prestations de services | 300,000 | 0 |
| 71 | Production stockée | 200,000 | 0 |
| 60 | Achats de marchandises | 0 | 250,000 |
| 61 | Services extérieurs | 0 | 80,000 |
| 64 | Charges de personnel | 0 | 200,000 |
| 62 | Autres services extérieurs | 0 | 50,000 |
| 66 | Charges financières | 0 | 30,000 |

**Mode Calculate** → Le système calculera automatiquement les 8 business lines à partir des codes comptables.

---

## 🧪 Instructions pour Créer les Fichiers de Test

### Option 1 : Excel (Recommandé)

1. Ouvrez Excel, Google Sheets ou LibreOffice Calc
2. Créez une nouvelle feuille
3. Copiez-collez les données ci-dessus
4. Sauvegardez en `.xlsx`

### Option 2 : CSV (Alternative)

1. Créez un fichier `.csv`
2. Utilisez `;` ou `,` comme séparateur
3. Convertissez en `.xlsx` avec Excel

### Option 3 : Script Python (Automatique)

Créez un fichier `generate_test_data.py` :

```python
import pandas as pd

# Scénario 1 : 12 lignes
data_12 = {
    'Business Line': [
        'Ventes e-commerce', 'Distribution retail', 'Ventes B2B',
        'Services IT', 'Développement logiciel', 'Conseil stratégique',
        'Formation et coaching', 'Support technique', 'Marketing digital',
        'Communication', 'Administration RH', 'Comptabilité'
    ],
    'Revenue 2024': [500000, 800000, 600000, 300000, 400000, 450000, 200000, 180000, 220000, 150000, 100000, 120000],
    'Expenses 2024': [300000, 500000, 350000, 200000, 250000, 280000, 120000, 100000, 150000, 90000, 80000, 100000],
    'Headcount': [15, 25, 20, 10, 12, 18, 8, 7, 9, 6, 5, 4]
}

df_12 = pd.DataFrame(data_12)
df_12.to_excel('business_lines_test_12.xlsx', index=False)

# Scénario 2 : 5 lignes
data_5 = {
    'Business Line': ['Sales & Distribution', 'Technology & R&D', 'Services & Consulting', 'Marketing & Communication', 'Administrative & Support'],
    'Revenue 2024': [1500000, 800000, 600000, 300000, 200000],
    'Expenses 2024': [900000, 500000, 350000, 180000, 150000],
    'Headcount': [50, 30, 25, 15, 10]
}

df_5 = pd.DataFrame(data_5)
df_5.to_excel('business_lines_test_5.xlsx', index=False)

print("✅ Fichiers créés: business_lines_test_12.xlsx, business_lines_test_5.xlsx")
```

Puis exécutez :
```bash
pip install pandas openpyxl
python generate_test_data.py
```

---

## 🎯 Comment Utiliser ces Données

### 1. Test avec Scénario 1 (12 lignes)

```bash
# Upload business_lines_test_12.xlsx
POST /api/datascanner/jobs/{jobId}/upload

# Extraction
POST /api/datascanner/jobs/{jobId}/zones/1/extract
# → Résultat : 12 lignes détectées, needs_regrouping: true

# Regroupement Gemini
POST /api/datascanner/jobs/{jobId}/zones/1/regroup
# → Résultat : 8 lignes avec mapping détaillé

# Validation
POST /api/datascanner/jobs/{jobId}/zones/1/validate
# → Zone 1 complétée
```

### 2. Test avec Scénario 2 (5 lignes)

```bash
# Upload business_lines_test_5.xlsx
POST /api/datascanner/jobs/{jobId}/upload

# Extraction
POST /api/datascanner/jobs/{jobId}/zones/1/extract
# → Résultat : 5 lignes détectées, needs_regrouping: false

# Validation directe (pas besoin de regroupement)
POST /api/datascanner/jobs/{jobId}/zones/1/validate
# → Zone 1 complétée
```

### 3. Test Mode Calculate (Données Comptables)

```bash
# Upload accounting_data_test.xlsx
POST /api/datascanner/jobs/{jobId}/upload

# Calcul depuis comptabilité
POST /api/datascanner/jobs/{jobId}/zones/1/calculate
# → Résultat : 8 lignes calculées depuis codes comptables

# Validation
POST /api/datascanner/jobs/{jobId}/zones/1/validate
# → Zone 1 complétée
```

---

## 📊 Attendus de Gemini pour Scénario 1

Voici ce que Gemini devrait produire pour le Scénario 1 :

```json
{
  "grouped_lines": [
    {
      "name": "Sales & Distribution",
      "category": "Sales & Distribution",
      "original_lines": ["Ventes e-commerce", "Distribution retail", "Ventes B2B"],
      "reasoning": "All three lines represent core commercial activities focused on selling products through different channels (e-commerce, retail, B2B)."
    },
    {
      "name": "Technology & R&D",
      "category": "Technology & R&D",
      "original_lines": ["Services IT", "Développement logiciel"],
      "reasoning": "Both lines are technology-focused, providing IT services and software development."
    },
    {
      "name": "Services & Consulting",
      "category": "Services & Consulting",
      "original_lines": ["Conseil stratégique", "Formation et coaching", "Support technique"],
      "reasoning": "All three provide professional services: strategic consulting, training, and technical support."
    },
    {
      "name": "Marketing & Communication",
      "category": "Marketing & Communication",
      "original_lines": ["Marketing digital", "Communication"],
      "reasoning": "Both lines focus on brand visibility and customer communication."
    },
    {
      "name": "Administrative & Support",
      "category": "Administrative & Support",
      "original_lines": ["Administration RH", "Comptabilité"],
      "reasoning": "Both are back-office support functions: HR administration and accounting."
    },
    {
      "name": "Manufacturing & Production",
      "category": "Manufacturing & Production",
      "original_lines": [],
      "reasoning": "No manufacturing activities detected in the data."
    },
    {
      "name": "Financial Services",
      "category": "Financial Services",
      "original_lines": [],
      "reasoning": "No financial services detected in the data."
    },
    {
      "name": "Other Activities",
      "category": "Other Activities",
      "original_lines": [],
      "reasoning": "No other activities detected in the data."
    }
  ]
}
```

---

## 🎉 Succès

Si vous voyez ce résultat, **Gemini fonctionne parfaitement !** 🌟

Le regroupement est :
- ✅ Sémantiquement cohérent
- ✅ Justifié avec reasoning
- ✅ Métriques agrégées correctement
- ✅ Exactement 8 catégories

**Prochaine étape** : Tester avec vos propres données réelles ! 🚀
