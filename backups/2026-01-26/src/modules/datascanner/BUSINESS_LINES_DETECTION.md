# 🏢 Détection Automatique des Lignes d'Activité - Business Line Detection

## 📋 Vue d'Ensemble

Le **HCM Data Scanner** possède maintenant une capacité avancée de **détection automatique des lignes d'activité** (business lines). Cette fonctionnalité permet d'extraire de manière structurée les informations organisationnelles directement depuis vos fichiers Excel.

**Limite :** L'application analyse un maximum de **8 lignes d'activité** par fichier.

---

## 🎯 Qu'est-ce qu'une Ligne d'Activité ?

Une ligne d'activité représente une **entité organisationnelle** au sein de votre entreprise, avec ses propres métriques financières et RH.

### Exemples de Lignes d'Activité

#### 🏦 Secteur Bancaire
- Banque de détail
- Banque d'affaires
- Banque privée
- Asset Management
- Trading
- Compliance

#### 🏢 Secteur Assurance
- Assurance vie
- Assurance non-vie
- Réassurance
- Gestion d'actifs
- Courtage

#### 💼 Entreprise Générale
- Direction Commerciale
- Direction Technique
- Direction RH
- Direction Financière
- R&D
- Operations

---

## 🔍 Fonctionnement de la Détection

### Algorithme de Détection Structurée

L'application utilise un **algorithme de reconnaissance de tableaux structurés** avec les étapes suivantes :

#### 1️⃣ Détection de la Ligne d'En-têtes (Header Row)

L'algorithme analyse les **5 premières lignes** de chaque feuille Excel pour identifier une ligne contenant :

**Colonne "Nom" :** Détecte les variations suivantes (français et anglais)
- Ligne d'activité, Activité, Département, Division, Service, Entité, Unité, Branche, Secteur
- Business line, Business unit, Department, Division, Entity, Unit, Branch, Sector

**Colonnes "Métriques" :** Détecte automatiquement :
- **Effectifs** : Effectifs, ETP, FTE, Personnel, Headcount, Employees
- **Budget** : Budget, Budget N-1, Dotation, Enveloppe budgétaire, Annual budget
- **Revenus** : Chiffre d'affaires, CA, Revenus, Revenue, Sales
- **Charges** : Charges, Dépenses, Expenses, Costs

#### 2️⃣ Fuzzy Matching avec Fuse.js

L'application utilise une **similarité minimale de 60%** pour détecter les colonnes même avec des variations d'orthographe :

```
"Ligne d'activité" match avec :
✅ "Ligne d activite" (sans accent)
✅ "Lignes d'activités" (pluriel)
✅ "Ligne activite" (mot manquant)
✅ "LIGNE D'ACTIVITÉ" (majuscules)
```

#### 3️⃣ Extraction des Données par Ligne

Pour chaque ligne de données (après l'en-tête) :
- ✅ Extraction du **nom de la ligne d'activité**
- ✅ Extraction des **métriques associées** (effectifs, budget, etc.)
- ✅ Détection automatique de l'**année** (ou N-1 par défaut)
- ✅ Calcul du **score de confiance** (0-95%)

#### 4️⃣ Filtrage Intelligent

L'application **ignore automatiquement** :
- ❌ Lignes vides
- ❌ Lignes "Total" / "Sous-total" / "Somme"
- ❌ Lignes sans aucune métrique valide

#### 5️⃣ Limite à 8 Lignes Maximum

Seules les **8 premières lignes d'activité** détectées sont conservées, même si le fichier en contient plus.

---

## 📊 Structure des Données Extraites

### Interface BusinessLine

```typescript
interface BusinessLine {
  id: string;                      // Identifiant unique
  name: string;                    // Nom de la ligne d'activité
  metrics: {
    headcount?: number;            // Effectifs
    budgetN1?: number;             // Budget année N-1
    revenue?: number;              // Revenus
    expenses?: number;             // Charges
    [key: string]: number | undefined;
  };
  year: number;                    // Année de référence
  confidence: number;              // Score de confiance (0-0.95)
  position: {
    row: number;                   // Ligne Excel
    col: number;                   // Colonne Excel
  };
  sheetName?: string;              // Nom de la feuille
}
```

---

## 📈 Exemples Concrets

### Exemple 1 : Tableau Standard

**Fichier Excel :** `lignes_activite_2024.xlsx`

**Structure :**

| Ligne d'activité       | Effectifs | Budget 2024    |
|------------------------|-----------|----------------|
| Banque de détail       | 250       | 15 000 000     |
| Banque d'affaires      | 120       | 25 000 000     |
| Asset Management       | 80        | 8 000 000      |
| Trading                | 45        | 12 000 000     |

**Résultat Extrait :**

```javascript
[
  {
    id: "bl-Sheet1-2-1735...",
    name: "Banque de détail",
    metrics: {
      headcount: 250,
      budgetN1: 15000000
    },
    year: 2024,
    confidence: 0.92,
    position: { row: 2, col: 0 },
    sheetName: "Sheet1"
  },
  {
    id: "bl-Sheet1-3-1735...",
    name: "Banque d'affaires",
    metrics: {
      headcount: 120,
      budgetN1: 25000000
    },
    year: 2024,
    confidence: 0.92,
    position: { row: 3, col: 0 },
    sheetName: "Sheet1"
  },
  // ... 2 autres lignes
]
```

---

### Exemple 2 : Tableau avec Multiples Métriques

**Structure :**

| Département           | ETP  | Budget N-1    | Revenus       | Charges      |
|-----------------------|------|---------------|---------------|--------------|
| Direction Commerciale | 180  | 12 000 000    | 50 000 000    | 30 000 000   |
| Direction Technique   | 320  | 18 000 000    | 0             | 18 000 000   |
| Direction RH          | 45   | 2 500 000     | 0             | 2 500 000    |

**Résultat Extrait :**

```javascript
[
  {
    name: "Direction Commerciale",
    metrics: {
      headcount: 180,
      budgetN1: 12000000,
      revenue: 50000000,
      expenses: 30000000
    },
    year: 2024,
    confidence: 0.90
  },
  // ... autres départements
]
```

---

### Exemple 3 : Multi-Feuilles avec Limite 8

**Fichier :** `rapport_complet.xlsx` (3 feuilles)

**Feuille 1 "Retail" :** 5 lignes d'activité détectées
**Feuille 2 "Corporate" :** 4 lignes d'activité détectées
**Feuille 3 "Investment" :** 3 lignes d'activité détectées

**Résultat :** Seules les **8 premières** lignes sont conservées
- ✅ 5 lignes de "Retail"
- ✅ 3 lignes de "Corporate" (limite atteinte)
- ❌ 0 lignes de "Investment" (limite dépassée)

**Console Log :**
```
✅ Added 5 business lines from sheet "Retail"
✅ Added 3 business lines from sheet "Corporate"
🛑 Reached maximum of 8 business lines
```

---

## 🎨 Utilisation dans l'Application

### Fonction d'Extraction Complète

```typescript
import { extractFinancialDataAndBusinessLines } from './lib/excelParser';

// Extraire à la fois les données financières ET les lignes d'activité
const result = await extractFinancialDataAndBusinessLines(file);

console.log('Data Points:', result.dataPoints.length);
console.log('Business Lines:', result.businessLines.length);

// Afficher les lignes d'activité
result.businessLines.forEach(bl => {
  console.log(`${bl.name}:`, bl.metrics);
});
```

### Intégration dans le Workflow de Scan

L'extraction des business lines se fait **automatiquement en parallèle** avec l'extraction des données financières :

1. 📂 Upload du fichier Excel
2. 📄 Parsing de toutes les feuilles
3. 🔍 **Scan multi-mode pour données financières** (TABLE, TRANSPOSED, SCATTERED, PROXIMITY)
4. 🏢 **Détection des lignes d'activité** (STRUCTURED_TABLE_MODE)
5. ✅ Résultats combinés retournés

---

## 🔧 Configuration et Personnalisation

### Ajuster le Seuil de Confiance

Par défaut, le seuil de similarité Fuzzy est de **60%** (0.4). Vous pouvez le modifier :

```typescript
// Dans businessLineDetector.ts
const detected = detectColumnType(cellValue, 0.3); // Plus strict (70% similarité)
const detected = detectColumnType(cellValue, 0.5); // Plus tolérant (50% similarité)
```

### Ajouter de Nouveaux Mots-Clés

Vous pouvez étendre `BUSINESS_LINE_KEYWORDS` dans `types/index.ts` :

```typescript
export const BUSINESS_LINE_KEYWORDS = {
  nameColumns: [
    // ... existants
    'pole',              // Nouveau
    'business area',     // Nouveau
  ],
  headcountColumns: [
    // ... existants
    'workforce',         // Nouveau
  ],
  budgetColumns: [
    // ... existants
    'allocated budget',  // Nouveau
  ]
}
```

### Modifier la Limite de 8 Lignes

```typescript
// Dans businessLineDetector.ts, ligne 149
const MAX_BUSINESS_LINES = 8; // Changer cette valeur
```

---

## 📊 Logs et Débogage

### Console Logs Détaillés

L'algorithme affiche des logs complets dans la console (F12) :

```
🔍 Starting business line detection...
📊 Sheet: Sheet1, Rows: 15
✅ Header row found at index 0
📋 Detected columns: [
  { index: 0, type: 'name', confidence: 0.95, matchedKeyword: 'ligne d'activité' },
  { index: 1, type: 'headcount', confidence: 0.92, matchedKeyword: 'effectifs' },
  { index: 2, type: 'budget', confidence: 0.90, matchedKeyword: 'budget' }
]
✅ Business Line 1: {
  name: 'Banque de détail',
  metrics: { headcount: 250, budgetN1: 15000000 },
  year: 2024,
  confidence: 0.91
}
⏭️ Skipping total row: Total Général
🎯 Total business lines detected: 4 (max: 8)
```

### Cas d'Échec de Détection

Si aucune ligne d'activité n'est détectée :

```
❌ No header row with business line structure detected
```

**Causes possibles :**
- ❌ Aucune colonne "Nom" détectée dans les 5 premières lignes
- ❌ Aucune colonne de métrique détectée
- ❌ Tableau non structuré (données éparpillées)

**Solution :** Vérifiez que votre fichier contient un tableau avec :
- 1 colonne avec un nom proche de "Ligne d'activité" ou équivalent
- Au moins 1 colonne de métrique (Effectifs, Budget, etc.)
- Headers dans les 5 premières lignes

---

## ✅ Checklist de Validation

Avant d'utiliser la détection de business lines :

- [ ] Mon fichier contient un tableau structuré ?
- [ ] La première colonne contient des noms d'entités ?
- [ ] Il y a au moins 1 colonne de métrique (Effectifs, Budget, Revenus, Charges) ?
- [ ] Les headers sont dans les 5 premières lignes ?
- [ ] Les lignes de données ne sont pas mélangées avec les totaux ?

---

## 🚀 Avantages de la Détection Automatique

### ✅ Avant (Extraction Manuelle)
- ❌ Copier-coller manuel ligne par ligne
- ❌ Risque d'erreurs humaines
- ❌ Temps de traitement : 10-15 minutes pour 8 lignes
- ❌ Aucune traçabilité

### ✅ Après (Détection Automatique)
- ✅ Extraction automatique en quelques secondes
- ✅ Score de confiance pour chaque ligne
- ✅ Temps de traitement : < 5 secondes
- ✅ Traçabilité complète (position, feuille, année)

---

## 🔮 Évolution Future

### Fonctionnalités Potentielles
- 📊 Détection de hiérarchies (Département > Service > Équipe)
- 🔄 Comparaison inter-années automatique
- 📈 Calcul automatique de KPIs par ligne d'activité
- 🌍 Support de tableaux PDF (actuellement Excel uniquement)
- 🎯 Détection de budgets multi-années (N, N-1, N-2)

---

## 📞 Support

### Ressources
- 📖 [README.md](./README.md) - Documentation technique complète
- 🚀 [EXTENSION_COMPLETE.md](./EXTENSION_COMPLETE.md) - Extension 10 catégories
- 📘 [GUIDE_UTILISATION.md](./GUIDE_UTILISATION.md) - Guide utilisateur

### Débogage
Ouvrez la console du navigateur (F12) pour voir les logs détaillés de la détection.

---

**La détection automatique des lignes d'activité transforme votre workflow d'analyse organisationnelle !** 🎉
