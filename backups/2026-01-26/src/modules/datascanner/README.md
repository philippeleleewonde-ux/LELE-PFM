# HCM Data Scanner - Documentation Technique

## Vue d'ensemble

Le **HCM Data Scanner** est un module intelligent universel qui extrait automatiquement les données financières, bancaires, d'assurance, RH et de risques organisationnels depuis des fichiers Excel et PDF, quelle que soit leur structure ou leur format.

### 🆕 Nouvelle Fonctionnalité : Détection Automatique des Lignes d'Activité

Le scanner peut maintenant **détecter automatiquement les lignes d'activité** (business lines) de votre organisation avec leurs métriques associées (effectifs, budget, revenus, charges). Maximum **8 lignes d'activité** par fichier.

📖 **Documentation complète :** [BUSINESS_LINES_DETECTION.md](./BUSINESS_LINES_DETECTION.md)

### 📊 Couverture Complète des Rapports

Le scanner supporte **10 catégories de données** couvrant l'ensemble des rapports réglementaires et de gestion :

#### 1️⃣ **Rapports Comptables Standards**
- ✅ Revenus (35+ mots-clés : CA, ventes, produits, revenue, sales...)
- ✅ Charges (30+ mots-clés : dépenses, coûts, expenses, opex...)

#### 2️⃣ **Rapports Bancaires (Pilier 3, ICAAP, COREP/FINREP)**
- ✅ Risque de Crédit (40+ mots-clés : UL, EL, PD, LGD, EAD, RWA, NPL...)
- ✅ Risque de Marché (25+ mots-clés : VaR, stressed VaR, risque de taux, FX...)
- ✅ Risque de Liquidité (25+ mots-clés : LCR, NSFR, HQLA, ASF, RSF...)
- ✅ Risque Opérationnel (20+ mots-clés : AMA, BIA, pertes opérationnelles...)

#### 3️⃣ **Rapports Assurance (SFCR, QRT)**
- ✅ Solvabilité (25+ mots-clés : SCR, MCR, fonds propres, Solvabilité II...)
- ✅ Risque de Souscription (20+ mots-clés : mortalité, longévité, lapse, prime...)

#### 4️⃣ **Rapports RH (Bilan Social, RSE)**
- ✅ Indicateurs RH (35+ mots-clés : ETP, FTE, absentéisme, turnover, formation...)

#### 5️⃣ **Risques Organisationnels**
- ✅ Risques Organisationnels (25+ mots-clés : cyber, IT, conformité, réputation...)

**TOTAL : 280+ mots-clés en français et anglais**

## Algorithme Multi-Mode Universel

### Philosophie

Au lieu d'un seul algorithme rigide, le scanner utilise **4 modes de détection différents** qui s'exécutent en parallèle. Le système choisit automatiquement le meilleur mode ou combine les résultats pour une extraction maximale.

### Les 4 Modes de Scan

#### 📊 MODE 1: TABLE MODE (Confiance: 90%)

**Structure détectée:**
```
| Année | Chiffre d'affaires | Charges | Résultat |
|-------|-------------------|---------|----------|
| 2021  | 120000000         | 80000000| 40000000 |
| 2022  | 135000000         | 90000000| 45000000 |
```

**Fonctionnement:**
1. Recherche les mots-clés financiers dans les **5 premières lignes** (headers)
2. Pour chaque ligne de données, trouve l'année dans les **3 premières colonnes**
3. Extrait les montants aux intersections colonnes-headers × lignes-années

**Cas d'usage:**
- Tableaux structurés classiques
- Headers en haut, années à gauche
- Format le plus courant dans les bilans financiers

---

#### 🔄 MODE 2: TRANSPOSED MODE (Confiance: 85%)

**Structure détectée:**
```
|                      | 2021      | 2022      | 2023      |
|----------------------|-----------|-----------|-----------|
| Chiffre d'affaires   | 120000000 | 135000000 | 150000000 |
| Charges              | 80000000  | 90000000  | 95000000  |
```

**Fonctionnement:**
1. Recherche les mots-clés financiers dans les **3 premières colonnes**
2. Trouve les années dans les **5 premières lignes**
3. Extrait les montants aux intersections

**Cas d'usage:**
- Tableaux transposés (rotation 90°)
- Années en colonnes, indicateurs en lignes
- Format utilisé dans certains rapports de gestion

---

#### 🔍 MODE 3: SCATTERED MODE (Confiance: 70%)

**Structure détectée:**
```
Données éparpillées, pas de grille claire
Ex: Texte libre avec montants dispersés
```

**Fonctionnement:**
1. Localise tous les mots-clés financiers dans le fichier
2. Pour chaque mot-clé, recherche en **spirale expansive** (rayon 20 cellules)
3. Collecte les années et montants proches
4. **Paire intelligente:** ne couple que si année et montant sont à max 5 cellules l'un de l'autre
5. Calcule une confiance basée sur la distance

**Cas d'usage:**
- Documents textuels avec données financières
- Rapports narratifs avec chiffres dispersés
- Fichiers sans structure de tableau claire

---

#### 📍 MODE 4: PROXIMITY MODE (Confiance: 60%)

**Structure détectée:**
```
Recherche en 4 directions (haut, bas, gauche, droite)
```

**Fonctionnement:**
1. Pour chaque mot-clé trouvé
2. Recherche dans les 4 directions jusqu'à 100 cellules
3. Paire toutes les années avec tous les montants trouvés

**Cas d'usage:**
- Fallback ultime quand aucune structure n'est détectée
- Fichiers très atypiques
- Mode le plus permissif mais moins précis

---

### Stratégie de Sélection des Résultats

Le scanner utilise une **stratégie en cascade** :

**1. Mode Haute Confiance (≥80%)**
```typescript
Si un mode atteint ≥80% de confiance ET trouve des données
→ Utiliser uniquement ce mode
→ Prioriser le mode avec la confiance la plus élevée
```

**2. Fusion Multi-Modes**
```typescript
Si plusieurs modes trouvent des données mais aucun ≥80%
→ Combiner tous les résultats
→ Dédupliquer par clé (catégorie-année-montant-keyword)
→ Conserver la variante avec la confiance la plus élevée
```

**3. Aucune Donnée**
```typescript
Si aucun mode ne trouve de données
→ Retourner tableau vide
→ Afficher suggestions de débogage
```

---

## Détection des Mots-Clés

### Base de données de mots-clés (280+ termes)

#### 📊 **1. REVENUS** (35 mots-clés)
**Français:** Chiffre d'affaires, CA, Revenus, Ventes, Produits, Recettes, Revenus bruts/nets
**Anglais:** Revenue, Sales, Turnover, Income, Gross revenue, Total revenue, Top line

#### 💸 **2. CHARGES** (30 mots-clés)
**Français:** Charges, Dépenses, Coûts, Frais, Charges d'exploitation, Charges totales
**Anglais:** Expenses, Costs, Expenditure, OPEX, Operating expenses, COGS

#### 🏦 **3. RISQUE DE CRÉDIT** (40 mots-clés)
**Français:** Risque de crédit, Perte attendue/inattendue, EAD, PD, LGD, RWA, Exposition au risque
**Anglais:** Credit risk, Expected loss (EL), Unexpected loss (UL), Exposure at default, Probability of default, Loss given default, Risk weighted assets, NPL

#### 📈 **4. RISQUE DE MARCHÉ** (25 mots-clés)
**Français:** Risque de marché, VaR, VaR stressée, Risque de taux, Risque de change, Risque sur actions
**Anglais:** Market risk, Value at risk, Stressed VaR, Interest rate risk, FX risk, Equity risk, Commodity risk, IRC

#### 💧 **5. RISQUE DE LIQUIDITÉ** (25 mots-clés)
**Français:** Risque de liquidité, LCR, NSFR, Actifs liquides haute qualité (HQLA), Ratio de liquidité
**Anglais:** Liquidity risk, Liquidity coverage ratio, Net stable funding ratio, High quality liquid assets, Funding ratio, LTD, ASF, RSF

#### ⚙️ **6. RISQUE OPÉRATIONNEL** (20 mots-clés)
**Français:** Risque opérationnel, Pertes opérationnelles, Approche mesure avancée (AMA), BIA, TSA
**Anglais:** Operational risk, Operational losses, Advanced measurement approach, Basic indicator approach, Standardized approach, Op risk, Loss event

#### 🛡️ **7. SOLVABILITÉ ASSURANCE** (25 mots-clés)
**Français:** Solvabilité, SCR, MCR, Capital de solvabilité requis, Fonds propres éligibles, Ratio de solvabilité, Solvabilité II
**Anglais:** Solvency, Solvency capital requirement, Minimum capital requirement, Own funds, Eligible own funds, SCR coverage ratio, Capital adequacy

#### 📋 **8. RISQUE DE SOUSCRIPTION** (20 mots-clés)
**Français:** Risque de souscription, Risque vie, Mortalité, Longévité, Lapse, Risque santé, Risque non-vie, Risque catastrophe
**Anglais:** Underwriting risk, Life risk, Mortality risk, Longevity risk, Lapse risk, Health risk, Non-life risk, Premium risk, Reserve risk, Cat risk

#### 👥 **9. INDICATEURS RH** (35 mots-clés)
**Français:** Effectifs, ETP, Équivalent temps plein, Heures travaillées, Absentéisme, Turnover, Rotation du personnel, Formation, Masse salariale
**Anglais:** Headcount, FTE, Full-time equivalent, Working hours, Absenteeism, Absence rate, Turnover rate, Attrition, Training hours, Payroll

#### 🏢 **10. RISQUES ORGANISATIONNELS** (25 mots-clés)
**Français:** Risques organisationnels, Risque personnel, Risque matériel, Risque IT, Risque cyber, Cybersécurité, Risque environnemental, Risque de conformité, Risque juridique, Risque de réputation
**Anglais:** Organizational risk, People risk, Equipment risk, IT risk, Cyber risk, Cybersecurity risk, Environmental risk, Compliance risk, Legal risk, Reputational risk, Business continuity

### Fuzzy Matching (Tolérance: 60%)

Le système utilise **Fuse.js** pour une correspondance floue:
- Tolère les fautes de frappe
- Insensible à la casse
- Normalise les accents (é → e)
- Seuil: 0.4 (60% de similarité requise)

**Exemples:**
- "Chiffre d'affaires" ✅ match "Chiffre d'affaire" (typo)
- "Revenue" ✅ match "REVENUE" (casse)
- "Chiffre d'affaires" ✅ match "chiffre affaires" (espaces)

---

## Détection des Années

### Plage Valide: N-5 à N-1

Pour l'année 2025, détecte uniquement:
- 2020, 2021, 2022, 2023, 2024

**Logique:**
```typescript
const currentYear = new Date().getFullYear(); // 2025
const validRange = {
  min: currentYear - 5, // 2020
  max: currentYear - 1  // 2024
};
```

### Formats Reconnus

- `2021` (nombre pur)
- `"2021"` (texte)
- `"Année 2021"`
- `"FY 2021"`
- `"2021-2022"`

---

## Extraction des Montants

### Nettoyage Automatique

```typescript
extractNumber("€ 120 000 000,50") → 120000000.50
extractNumber("$1,234,567.89")    → 1234567.89
extractNumber("150000")           → 150000
```

**Suppression:**
- Symboles monétaires: €, $, £, ¥
- Espaces
- Virgules de séparation

**Validation:**
- Doit être > 0
- Doit être un nombre valide

---

## Support Multi-Feuilles Excel & Multi-Pages PDF

### ✅ Analyse Automatique - AUCUNE LIMITE

L'application **scanne automatiquement**:
- **Toutes les feuilles** d'un fichier Excel (limite: 255 feuilles max Excel)
- **Toutes les pages** d'un fichier PDF (**AUCUNE LIMITE** - scanne document entier)

#### Excel Multi-Feuilles

```typescript
📚 Found 3 sheet(s): Bilan 2024, Compte de résultat, Budget prévisionnel
  📄 Sheet "Bilan 2024": 25 rows × 6 columns
  📄 Sheet "Compte de résultat": 18 rows × 5 columns
  📄 Sheet "Budget prévisionnel": 30 rows × 8 columns
```

### Traçabilité des Données

Chaque donnée extraite **conserve le nom de sa feuille d'origine**:

```typescript
{
  id: "xyz123",
  keyword: "Chiffre d'affaires",
  amount: 150000000,
  year: 2023,
  sheetName: "Compte de résultat",  // ← Feuille d'origine
  position: { row: 5, col: 2 }
}
```

### Affichage dans les Résultats

Dans le tableau des résultats, un **badge violet** indique la feuille:

```
Keyword: "Chiffre d'affaires"  [Edited]  [📄 Compte de résultat]
```

#### PDF Multi-Pages

```typescript
📚 PDF has 150 page(s) - scanning ALL pages...
  📄 Page 1/150: 3542 characters extracted
  📄 Page 2/150: 2891 characters extracted
  ...
  📄 Page 150/150: 4127 characters extracted
```

**Aucune limite** - Le système scanne automatiquement **toutes les pages** du PDF, qu'il y en ait 10, 100, 1000 ou plus.

### Console Détaillée

#### Excel Multi-Feuilles

```
📂 Starting multi-sheet Excel analysis...
📚 Found 3 sheet(s): Sheet1, Revenue, Expenses

============================================================
📄 SHEET 1/3: "Sheet1"
============================================================
🚀 [UNIVERSAL SCANNER] Starting multi-mode analysis...
📊 Matrix size: 10 rows × 5 columns
...
📊 Sheet "Sheet1" total: 8 data points

============================================================
📄 SHEET 2/3: "Revenue"
============================================================
🚀 [UNIVERSAL SCANNER] Starting multi-mode analysis...
...
📊 Sheet "Revenue" total: 5 data points

============================================================
📄 SHEET 3/3: "Expenses"
============================================================
...
📊 Sheet "Expenses" total: 6 data points

============================================================
✅ TOTAL: 19 data points across 3 sheet(s)
============================================================
```

#### PDF Multi-Pages

```
📂 Starting multi-page PDF analysis...
📚 PDF has 25 page(s) - scanning ALL pages...
  📄 Page 1/25: 2847 characters extracted
  📄 Page 2/25: 3156 characters extracted
  ...

============================================================
📄 PAGE 1/25
============================================================
✅ [PDF PAGE 1] Extracted: chiffre d'affaires = 120000000 for year 2021
✅ [PDF PAGE 1] Extracted: charges = 80000000 for year 2021
📊 Page 1 total: 4 data points

============================================================
📄 PAGE 2/25
============================================================
✅ [PDF PAGE 2] Extracted: revenus = 135000000 for year 2022
📊 Page 2 total: 3 data points

...

============================================================
✅ TOTAL: 87 data points across 25 page(s)
============================================================
```

## Workflow Complet

### Excel
```
1. Upload fichier Excel (.xlsx, .xls)
   ↓
2. Parse TOUTES les feuilles → Map<sheetName, CellData[][]>
   ↓
3. Pour chaque feuille:
   ├─ Lancement des 4 modes en parallèle
   ├─ Collecte des résultats
   ├─ Stratégie de sélection
   └─ Ajout du nom de la feuille (sheetName)
   ↓
4. Combinaison de tous les résultats
   ↓
5. Déduplication globale
   ↓
6. Retour des FinancialDataPoint[]
   ↓
7. Validation utilisateur
   ↓
8. Sauvegarde dans UserStorage
```

### PDF
```
1. Upload fichier PDF (.pdf)
   ↓
2. Parse TOUTES les pages → Map<pageNum, string>
   ↓
3. Pour chaque page:
   ├─ Extraction texte complet
   ├─ Recherche keywords dans lignes de texte
   ├─ Extraction années et montants proches
   └─ Ajout du numéro de page (sheetName: "Page N")
   ↓
4. Combinaison de tous les résultats
   ↓
5. Déduplication globale
   ↓
6. Retour des FinancialDataPoint[]
   ↓
7. Validation utilisateur
   ↓
8. Sauvegarde dans UserStorage
```

---

## Exemples de Console

### Succès avec TABLE MODE

```
🚀 [UNIVERSAL SCANNER] Starting multi-mode analysis...
📊 Matrix size: 10 rows × 5 columns

📊 [TABLE MODE] Found header "chiffre d'affaires" at column 1
📊 [TABLE MODE] Found header "charges" at column 2
✅ [TABLE MODE] Extracted: chiffre d'affaires = 120000000 for year 2021
✅ [TABLE MODE] Extracted: charges = 80000000 for year 2021
✅ [TABLE MODE] Extracted: chiffre d'affaires = 135000000 for year 2022
✅ [TABLE MODE] Extracted: charges = 90000000 for year 2022

📈 Scan Results Summary:
  📊 TABLE: 10 points (confidence: 90.0%)
  🔄 TRANSPOSED: 0 points (confidence: 0.0%)
  🔍 SCATTERED: 0 points (confidence: 0.0%)
  📍 PROXIMITY: 0 points (confidence: 0.0%)

✅ Using TABLE mode (highest confidence: 90.0%)
```

### Fusion Multi-Modes

```
📈 Scan Results Summary:
  📊 TABLE: 5 points (confidence: 70.0%)
  🔄 TRANSPOSED: 3 points (confidence: 60.0%)
  🔍 SCATTERED: 8 points (confidence: 70.0%)
  📍 PROXIMITY: 12 points (confidence: 60.0%)

🔀 Combining results from 4 mode(s)...
✅ Final result: 15 unique data points after deduplication
```

### Aucune Donnée

```
📈 Scan Results Summary:
  📊 TABLE: 0 points (confidence: 0.0%)
  🔄 TRANSPOSED: 0 points (confidence: 0.0%)
  🔍 SCATTERED: 0 points (confidence: 0.0%)
  📍 PROXIMITY: 0 points (confidence: 0.0%)

⚠️ No financial data detected in any mode
💡 Suggestions:
  - Check if file contains financial keywords (revenue, expenses, CA, charges, etc.)
  - Verify that years are in N-1 to N-5 range
  - Ensure amounts are formatted as numbers
```

---

## Avantages de l'Approche Multi-Mode

### ✅ Adaptabilité Universelle
- Fonctionne avec **tous les formats** Excel possibles
- Pas besoin de configuration manuelle
- Auto-détection intelligente

### ✅ Robustesse
- Si un mode échoue, les autres prennent le relais
- Fusion intelligente des résultats
- Déduplication automatique

### ✅ Précision
- Système de confiance par mode
- Priorisation des résultats de haute qualité
- Validation utilisateur pour vérification finale

### ✅ Performance
- Exécution parallèle des 4 modes
- Logs détaillés pour debugging
- Arrêt dès qu'un mode haute confiance trouve des données

---

## Configuration

### ScanConfig (types/index.ts)

```typescript
export const DEFAULT_SCAN_CONFIG: ScanConfig = {
  fuzzyThreshold: 0.4,        // 60% similarité requise
  yearRange: {
    min: currentYear - 5,     // N-5
    max: currentYear - 1      // N-1
  },
  searchDirections: ['right', 'left', 'top', 'bottom'],
  maxSearchDistance: 100      // Chercher jusqu'à 100 cellules
};
```

---

## Fichiers Clés

```
src/modules/datascanner/
├── lib/
│   ├── excelParser.ts          ← Algorithme multi-mode
│   ├── keywordMatcher.ts       ← Fuzzy matching
│   └── yearDetector.ts         ← Détection années
├── types/
│   └── index.ts                ← Types & config
├── hooks/
│   └── useScanEngine.ts        ← Hook React
└── components/
    ├── UploadZone.tsx          ← Zone de drop
    ├── ScanConversation.tsx    ← Feedback scan
    ├── ValidationPanel.tsx     ← Validation UI
    └── ScanResults.tsx         ← Tableau résultats
```

---

## Extension Future

Pour ajouter un nouveau mode de scan:

1. Créer une fonction `scanYourMode()` retournant `ScanModeResult`
2. L'ajouter dans le tableau `allResults` de `scanExcelForFinancialData()`
3. Ajouter le type dans `type ScanMode`
4. Ajouter l'emoji dans `getModeIcon()`

**Exemple:**
```typescript
function scanVerticalMode(matrix, config): ScanModeResult {
  // Votre logique de scan
  return {
    mode: 'vertical',
    dataPoints: [...],
    confidence: 0.75
  };
}
```

---

## Support & Débogage

### Console Logs
Tous les logs utilisent des emojis pour faciliter le débogage:
- 🚀 Scanner lancé
- 📊 Table mode
- 🔄 Transposed mode
- 🔍 Scattered mode
- 📍 Proximity mode
- ✅ Succès
- ⚠️ Avertissement
- 💡 Suggestion

### Mode Développeur
Ouvrir la console pour voir le détail de chaque mode.
