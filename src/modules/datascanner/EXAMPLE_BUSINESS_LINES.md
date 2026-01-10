# 📊 Exemple d'Utilisation - Détection des Lignes d'Activité

## 🎯 Objectif

Ce guide montre comment utiliser la nouvelle fonctionnalité de **détection automatique des lignes d'activité** pour extraire la structure organisationnelle d'une entreprise depuis un fichier Excel.

---

## 📝 Scénario d'Exemple

### Contexte

Vous êtes analyste financier dans une banque et vous recevez chaque trimestre un fichier Excel contenant :
- Les 8 lignes d'activité de la banque
- Pour chacune : Effectifs (ETP), Budget N-1, Revenus, Charges

**Tâche :** Extraire automatiquement ces informations sans copier-coller manuel.

---

## 📂 Fichier Excel d'Exemple

### Structure du Fichier : `rapport_lignes_activite_Q4_2024.xlsx`

**Feuille 1 : "Lignes d'Activité"**

| Ligne d'activité        | Effectifs (ETP) | Budget 2024    | Revenus 2024   | Charges 2024   |
|-------------------------|-----------------|----------------|----------------|----------------|
| Banque de détail        | 250             | 15 000 000     | 45 000 000     | 32 000 000     |
| Banque d'affaires       | 120             | 25 000 000     | 78 000 000     | 52 000 000     |
| Asset Management        | 80              | 8 000 000      | 22 000 000     | 15 000 000     |
| Trading                 | 45              | 12 000 000     | 35 000 000     | 28 000 000     |
| Private Banking         | 65              | 9 500 000      | 28 000 000     | 19 000 000     |
| Compliance              | 35              | 4 200 000      | 0              | 4 200 000      |
| Risk Management         | 28              | 3 800 000      | 0              | 3 800 000      |
| IT & Operations         | 95              | 11 500 000     | 0              | 11 500 000     |
| **Total**               | **718**         | **89 000 000** | **208 000 000**| **165 500 000**|

---

## 💻 Code d'Utilisation

### 1️⃣ Import de la Fonction

```typescript
import { extractFinancialDataAndBusinessLines } from '@/modules/datascanner/lib/excelParser';
```

### 2️⃣ Upload et Extraction

```typescript
// Dans votre composant React
const handleFileUpload = async (file: File) => {
  try {
    console.log('📂 Uploading file:', file.name);

    // Extraction complète : données financières + business lines
    const result = await extractFinancialDataAndBusinessLines(file);

    console.log('✅ Extraction completed!');
    console.log(`📊 Data Points: ${result.dataPoints.length}`);
    console.log(`🏢 Business Lines: ${result.businessLines.length}`);

    // Traitement des lignes d'activité
    result.businessLines.forEach((bl, index) => {
      console.log(`\n${index + 1}. ${bl.name}`);
      console.log(`   Effectifs: ${bl.metrics.headcount || 'N/A'}`);
      console.log(`   Budget N-1: ${bl.metrics.budgetN1?.toLocaleString('fr-FR')} €`);
      console.log(`   Revenus: ${bl.metrics.revenue?.toLocaleString('fr-FR')} €`);
      console.log(`   Charges: ${bl.metrics.expenses?.toLocaleString('fr-FR')} €`);
      console.log(`   Confiance: ${(bl.confidence * 100).toFixed(1)}%`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
};
```

### 3️⃣ Résultat Console Attendu

```
📂 Uploading file: rapport_lignes_activite_Q4_2024.xlsx
📂 Starting comprehensive Excel analysis (data points + business lines)...

============================================================
📄 SHEET 1/1: "Lignes d'Activité"
============================================================
🚀 Starting 4-mode financial data scan...
📊 Sheet "Lignes d'Activité" total: 32 data points

============================================================
✅ Financial Data: 32 data points across 1 sheet(s)
============================================================

🏢 Starting business line detection...
🔍 Starting business line detection...
📊 Sheet: Lignes d'Activité, Rows: 10
✅ Header row found at index 0
📋 Detected columns: [
  { index: 0, type: 'name', confidence: 0.95 },
  { index: 1, type: 'headcount', confidence: 0.92 },
  { index: 2, type: 'budget', confidence: 0.90 },
  { index: 3, type: 'revenue', confidence: 0.85 },
  { index: 4, type: 'expenses', confidence: 0.85 }
]

✅ Business Line 1: { name: 'Banque de détail', metrics: { headcount: 250, budgetN1: 15000000, revenue: 45000000, expenses: 32000000 }, year: 2024, confidence: 0.88 }
✅ Business Line 2: { name: 'Banque d\'affaires', metrics: { headcount: 120, budgetN1: 25000000, revenue: 78000000, expenses: 52000000 }, year: 2024, confidence: 0.88 }
✅ Business Line 3: { name: 'Asset Management', metrics: { headcount: 80, budgetN1: 8000000, revenue: 22000000, expenses: 15000000 }, year: 2024, confidence: 0.88 }
✅ Business Line 4: { name: 'Trading', metrics: { headcount: 45, budgetN1: 12000000, revenue: 35000000, expenses: 28000000 }, year: 2024, confidence: 0.88 }
✅ Business Line 5: { name: 'Private Banking', metrics: { headcount: 65, budgetN1: 9500000, revenue: 28000000, expenses: 19000000 }, year: 2024, confidence: 0.88 }
✅ Business Line 6: { name: 'Compliance', metrics: { headcount: 35, budgetN1: 4200000, expenses: 4200000 }, year: 2024, confidence: 0.88 }
✅ Business Line 7: { name: 'Risk Management', metrics: { headcount: 28, budgetN1: 3800000, expenses: 3800000 }, year: 2024, confidence: 0.88 }
✅ Business Line 8: { name: 'IT & Operations', metrics: { headcount: 95, budgetN1: 11500000, expenses: 11500000 }, year: 2024, confidence: 0.88 }

⏭️ Skipping total row: Total

🎯 Total business lines detected: 8 (max: 8)
✅ Business Lines: 8 detected (max: 8)

✅ Extraction completed!
📊 Data Points: 32
🏢 Business Lines: 8

1. Banque de détail
   Effectifs: 250
   Budget N-1: 15 000 000 €
   Revenus: 45 000 000 €
   Charges: 32 000 000 €
   Confiance: 88.0%

2. Banque d'affaires
   Effectifs: 120
   Budget N-1: 25 000 000 €
   Revenus: 78 000 000 €
   Charges: 52 000 000 €
   Confiance: 88.0%

3. Asset Management
   Effectifs: 80
   Budget N-1: 8 000 000 €
   Revenus: 22 000 000 €
   Charges: 15 000 000 €
   Confiance: 88.0%

4. Trading
   Effectifs: 45
   Budget N-1: 12 000 000 €
   Revenus: 35 000 000 €
   Charges: 28 000 000 €
   Confiance: 88.0%

5. Private Banking
   Effectifs: 65
   Budget N-1: 9 500 000 €
   Revenus: 28 000 000 €
   Charges: 19 000 000 €
   Confiance: 88.0%

6. Compliance
   Effectifs: 35
   Budget N-1: 4 200 000 €
   Revenus: N/A
   Charges: 4 200 000 €
   Confiance: 88.0%

7. Risk Management
   Effectifs: 28
   Budget N-1: 3 800 000 €
   Revenus: N/A
   Charges: 3 800 000 €
   Confiance: 88.0%

8. IT & Operations
   Effectifs: 95
   Budget N-1: 11 500 000 €
   Revenus: N/A
   Charges: 11 500 000 €
   Confiance: 88.0%
```

---

## 🎨 Affichage dans l'UI

### Composant React Exemple

```tsx
import React from 'react';
import { BusinessLine } from '@/modules/datascanner/types';

interface BusinessLineCardProps {
  businessLine: BusinessLine;
  index: number;
}

const BusinessLineCard: React.FC<BusinessLineCardProps> = ({ businessLine, index }) => {
  const { name, metrics, year, confidence } = businessLine;

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {index + 1}. {name}
        </h3>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {(confidence * 100).toFixed(0)}% confiance
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.headcount && (
          <div className="bg-teal-50 p-2 rounded">
            <p className="text-xs text-gray-600">Effectifs</p>
            <p className="text-lg font-bold text-teal-700">{metrics.headcount} ETP</p>
          </div>
        )}

        {metrics.budgetN1 && (
          <div className="bg-indigo-50 p-2 rounded">
            <p className="text-xs text-gray-600">Budget {year}</p>
            <p className="text-lg font-bold text-indigo-700">
              {(metrics.budgetN1 / 1000000).toFixed(1)}M €
            </p>
          </div>
        )}

        {metrics.revenue && (
          <div className="bg-green-50 p-2 rounded">
            <p className="text-xs text-gray-600">Revenus</p>
            <p className="text-lg font-bold text-green-700">
              {(metrics.revenue / 1000000).toFixed(1)}M €
            </p>
          </div>
        )}

        {metrics.expenses && (
          <div className="bg-red-50 p-2 rounded">
            <p className="text-xs text-gray-600">Charges</p>
            <p className="text-lg font-bold text-red-700">
              {(metrics.expenses / 1000000).toFixed(1)}M €
            </p>
          </div>
        )}
      </div>

      {/* Profit/Loss (if both revenue and expenses exist) */}
      {metrics.revenue && metrics.expenses && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-600">Résultat</p>
          <p className={`text-lg font-bold ${
            metrics.revenue > metrics.expenses ? 'text-green-600' : 'text-red-600'
          }`}>
            {((metrics.revenue - metrics.expenses) / 1000000).toFixed(1)}M €
          </p>
        </div>
      )}
    </div>
  );
};

// Usage dans votre dashboard
const BusinessLinesSection: React.FC<{ businessLines: BusinessLine[] }> = ({ businessLines }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">
        Lignes d'Activité ({businessLines.length}/8)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {businessLines.map((bl, index) => (
          <BusinessLineCard key={bl.id} businessLine={bl} index={index} />
        ))}
      </div>

      {businessLines.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Aucune ligne d'activité détectée dans ce fichier.</p>
          <p className="text-sm mt-2">
            Assurez-vous que votre fichier contient un tableau structuré avec des colonnes
            "Ligne d'activité" et au moins une métrique.
          </p>
        </div>
      )}
    </div>
  );
};

export default BusinessLinesSection;
```

---

## 📊 Cas d'Usage Avancés

### Cas 1 : Multi-Feuilles avec Différentes Années

**Fichier :** `rapport_historique.xlsx`

**Feuille 1 "2024" :** 5 lignes d'activité
**Feuille 2 "2023" :** 5 lignes d'activité
**Feuille 3 "2022" :** 4 lignes d'activité

**Résultat :** Les 8 premières lignes détectées (5 de 2024 + 3 de 2023)

### Cas 2 : Variations d'Orthographe

Le système détecte même avec des variations :

| Colonne Excel           | Détecté comme     |
|-------------------------|-------------------|
| "Départements"          | ✅ Name Column    |
| "Effectif Total"        | ✅ Headcount      |
| "Budget Prévisionnel"   | ✅ Budget         |
| "CA 2024"               | ✅ Revenue        |

### Cas 3 : Métriques Partielles

Certaines lignes n'ont pas toutes les métriques :

```javascript
{
  name: "Compliance",
  metrics: {
    headcount: 35,
    budgetN1: 4200000,
    // Pas de revenus (département support)
    expenses: 4200000
  }
}
```

✅ La ligne est quand même détectée car elle a au moins 1 métrique !

---

## 🔍 Débogage

### Problème : Aucune Ligne Détectée

**Console :**
```
❌ No header row with business line structure detected
```

**Solution :**
1. Vérifiez que les headers sont dans les **5 premières lignes**
2. Assurez-vous d'avoir une colonne "Nom" (Ligne d'activité, Département, etc.)
3. Vérifiez qu'il y a au moins 1 colonne de métrique

### Problème : Seulement 3 Lignes au Lieu de 6

**Console :**
```
⏭️ Skipping row with no metrics: Direction Générale
⏭️ Skipping total row: Total
⏭️ Skipping row with no metrics: (empty line)
```

**Explication :** Le système ignore automatiquement :
- Lignes vides
- Lignes sans métriques
- Lignes de total

**Solution :** Normales, vos 3 autres lignes contenaient probablement des totaux ou étaient vides.

---

## ✅ Résumé

### Avantages

✅ **Automatique** - Plus besoin de copier-coller
✅ **Rapide** - Extraction en < 5 secondes
✅ **Intelligent** - Détecte variations d'orthographe
✅ **Traçable** - Position exacte, confiance, feuille
✅ **Robuste** - Ignore totaux et lignes vides
✅ **Limité** - Maximum 8 lignes pour éviter les données de test

### Limites

❌ Fonctionne uniquement sur **tableaux structurés**
❌ Maximum **8 lignes d'activité**
❌ Headers doivent être dans les **5 premières lignes**
❌ Nécessite au moins **1 colonne de métrique**

---

**Vous êtes maintenant prêt à utiliser la détection automatique des lignes d'activité !** 🎉
