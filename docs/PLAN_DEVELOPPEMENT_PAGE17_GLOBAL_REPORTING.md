# PLAN DE DÉVELOPPEMENT - PAGE 17: GLOBAL REPORTING HCM PERFORMANCE PLAN

**Date**: 2025-11-29
**Développeur**: Elite SaaS Developer
**Skill utilisé**: `elite-saas-developer`
**Source Excel**: Feuille "13-REPORTING M1-Pdf"
**Statut**: ⏳ EN ATTENTE DE VALIDATION

---

## 📊 ANALYSE EXHAUSTIVE FEUILLE EXCEL 13

### Statistiques globales

- **Dimensions**: 1416 lignes × 7 colonnes
- **Total formules**: 1447 formules
- **Feuilles sources**: 6 feuilles Excel différentes
- **Type**: Dashboard consolidé (rapport PDF-ready)

### Répartition des formules par source

| Feuille Excel Source | Nombre formules | Page React correspondante |
|----------------------|----------------|---------------------------|
| `9-PLANIFICATION BUDGET-3ANS` | 57 | Pages 12-13 (IPLE 3-Year Plan + Dashboard) |
| `7-REPORTING COUTS INCIDENTS` | 56 | Page 10 (Economic Breakdown) |
| `6-ECONOMIES SUR 3 ANS` | 36 | Pages 8-9 (EE + IPLE Accounts) |
| `8-SEUIL HISTORIQUE-SURCOUTS` | 16 | Page 11 (Risk Appetite Threshold) |
| `5-CALCUL VALEUR EN RISQUE` | 6 | Page 7 (PRL Accounts / VaR) |
| `13-REPORTING M1-Pdf` | 8 | Auto-références (calculs internes) |

**CONCLUSION**: La feuille Excel 13 est un **DASHBOARD DE CONSOLIDATION** qui agrège TOUTES les données calculées des pages précédentes.

---

## 🎯 STRUCTURE DE LA PAGE 17 (BASÉE SUR VOS SPÉCIFICATIONS)

### Sections principales à implémenter

D'après votre description, la Page 17 doit contenir **9 SECTIONS** (6 depuis Excel + 3 nouvelles):

#### SECTION A - Result of Analysis: The Value at Risk
**Source Excel**: Feuille 5 (`5-CALCUL VALEUR EN RISQUE`)
**Source React**: Page 7 (PRL Accounts)
**Données à afficher**:
- Unexpected Losses (UL)
- Expected Losses (EL)
- Value at Risk (VaR = UL + EL)
- Potentially Recoverable Losses (PRL)
- Forecast Expected Losses

**Formules Excel identifiées**:
```
E69 = ='5-CALCUL VALEUR EN RISQUE'!E11  (UL)
E72 = ='5-CALCUL VALEUR EN RISQUE'!E14  (EL)
E75 = ='5-CALCUL VALEUR EN RISQUE'!E17  (VaR)
E81 = ='5-CALCUL VALEUR EN RISQUE'!E23  (PRL)
E84 = ='5-CALCUL VALEUR EN RISQUE'!E26  (Forecast EL)
```

**Implémentation TypeScript**:
```typescript
const sectionA = {
  ul: calculated.ulCalcul,
  el: calculated.totalELHistorique,
  var: calculated.var,
  prl: calculated.prl,
  forecastEL: calculated.expectedLosses
};
```

---

#### SECTION B - Distribution of Costs Savings Through Control of Indicators
**Source Excel**: Feuille 6 (`6-ECONOMIES SUR 3 ANS`)
**Source React**: Pages 8 (EE Accounts) + 9 (IPLE Accounts)
**Données à afficher**:
- Taux d'absentéisme + économies
- Taux de productivité + économies
- Taux de qualité + économies
- Taux d'accidents + économies
- Taux de savoir-faire + économies

**Formules Excel identifiées**:
```
C143 = ='6-ECONOMIES SUR 3 ANS'!I21  (Taux accidents)
C146 = ='6-ECONOMIES SUR 3 ANS'!I32  (Taux qualité)
C150 = ='6-ECONOMIES SUR 3 ANS'!I44  (Taux productivité)
C155 = ='6-ECONOMIES SUR 3 ANS'!I64  (Taux absentéisme)
C158 = ='6-ECONOMIES SUR 3 ANS'!I76  (Taux savoir-faire)
```

**Implémentation TypeScript**:
```typescript
const sectionB = {
  indicators: [
    {
      name: 'Absentéisme',
      rate: calculated.indicator_absenteeism_rate,
      savings: calculated.savings_absenteeism
    },
    {
      name: 'Productivité',
      rate: calculated.indicator_productivity_rate,
      savings: calculated.savings_productivity
    },
    // ... autres indicateurs
  ]
};
```

---

#### SECTION C - Distribution of VaR in Loss Events (Basel Typology)
**Source Excel**: Feuille 7 (`7-REPORTING COUTS INCIDENTS`)
**Source React**: Page 10 (Economic Breakdown)
**Données à afficher**:
- Répartition par type de risque Basel II
- Coûts par catégorie de perte
- Distribution du VaR

**Formules Excel identifiées**:
```
C243 = ='7-REPORTING COUTS INCIDENTS'!B8
F245 = ='7-REPORTING COUTS INCIDENTS'!E8
(56 formules au total référençant cette feuille)
```

**Implémentation TypeScript**:
```typescript
const sectionC = {
  baselCategories: [
    {
      type: 'Operational Risk',
      amount: calculated.operational_risk_amount,
      percentage: calculated.operational_risk_percentage
    },
    // ... autres catégories Basel
  ]
};
```

---

#### SECTION D - Transfer of Historic Threshold of Tolerance
**Source Excel**: Feuille 8 (`8-SEUIL HISTORIQUE-SURCOUTS`)
**Source React**: Page 11 (Risk Appetite Threshold)
**Données à afficher**:
- Seuil historique de tolérance
- Coûts additionnels au-delà du seuil
- Transferts de risques

**Formules Excel identifiées**: 16 formules référençant la feuille 8

**Implémentation TypeScript**:
```typescript
const sectionD = {
  historicThreshold: calculated.historic_threshold,
  additionalCosts: calculated.additional_costs,
  riskTransfers: calculated.risk_transfers
};
```

---

#### SECTION E - 3-Year Budget: Distribution of Cash Flows (PRL Savings)
**Source Excel**: Feuille 9 (`9-PLANIFICATION BUDGET-3ANS`)
**Source React**: Page 12 (IPLE 3-Year Plan)
**Données à afficher**:
- Cash flows N+1, N+2, N+3
- Distribution par année
- Objectifs trimestriels de couverture du PRL

**Formules Excel identifiées**: 57 formules (plus grand nombre)

**Implémentation TypeScript**:
```typescript
const sectionE = {
  yearN1: {
    gains: calculated.gainsN1,
    cashFlow: calculated.cashFlowN1,
    primes: calculated.primesN1
  },
  yearN2: {
    gains: calculated.gainsN2,
    cashFlow: calculated.cashFlowN2,
    primes: calculated.primesN2
  },
  yearN3: {
    gains: calculated.gainsN3,
    cashFlow: calculated.cashFlowN3,
    primes: calculated.primesN3
  },
  quarterlyTargets: {
    Q1: 0.20,  // 20% du PRL
    Q2: 0.30,  // 30% du PRL
    Q3: 0.20,  // 20% du PRL
    Q4: 0.30   // 30% du PRL
  }
};
```

---

#### SECTION F - 3-Year Budget: Predictable Impact on SCR
**Source Excel**: Feuille 9 (`9-PLANIFICATION BUDGET-3ANS`)
**Source React**: Page 13 (Dashboard)
**Données à afficher**:
- Impact prévisible sur le SCR (Solvency Capital Requirement)
- Évolution sur 3 ans
- Ratios de solvabilité

**Implémentation TypeScript**:
```typescript
const sectionF = {
  scrImpact: {
    yearN1: calculated.scr_impact_n1,
    yearN2: calculated.scr_impact_n2,
    yearN3: calculated.scr_impact_n3
  },
  solvencyRatios: {
    current: calculated.solvency_ratio_current,
    forecast: calculated.solvency_ratio_forecast
  }
};
```

---

#### SECTION G - Priority Actions N+1 (NOUVELLE)
**Source React**: Page 14 (créée)
**Données à afficher**:
- Distribution objectifs par ligne d'activité (année N+1)
- Montants par indicateur et par personne
- Total économies attendues N+1

**Implémentation TypeScript**:
```typescript
const sectionG = {
  year: 'N+1',
  ppr: calculated.gainsN1,
  distributionByLine: businessLines.map(line => ({
    name: line.activityName,
    staff: line.staffCount,
    budgetRate: line.budgetRate,
    distributions: indicators.map(ind => ({
      indicator: ind.id,
      perLine: calculated.gainsN1 * (ind.rate / 100) * (line.budgetRate / 100),
      perPerson: /* formule */
    }))
  }))
};
```

---

#### SECTION H - Priority Actions N+2 (NOUVELLE)
**Source React**: Page 15 (créée)
**Données**: Identiques à Section G mais avec `gainsN2` (×2.00 vs N+1)

---

#### SECTION I - Priority Actions N+3 (NOUVELLE)
**Source React**: Page 16 (créée)
**Données**: Identiques à Section G mais avec `gainsN3` (×3.33 vs N+1)

---

## 🏗️ ARCHITECTURE DE LA PAGE 17

### Structure du composant React

```typescript
// Page17GlobalReporting.tsx

interface Page17GlobalReportingProps {
  formData: FormData;  // Toutes les données de formulaire
  calculated: CalculatedFields;  // Tous les champs calculés
  businessLines: BusinessLine[];
  selectedCurrency: Currency;
}

export function Page17GlobalReporting({
  formData,
  calculated,
  businessLines,
  selectedCurrency
}: Page17GlobalReportingProps) {
  // Structure en 9 sections
  return (
    <div className="space-y-8">
      <PageHeader title="17 - Global Reporting HCM Performance Plan" />

      {/* SECTION A */}
      <SectionA_ValueAtRisk
        calculated={calculated}
        currency={selectedCurrency}
      />

      {/* SECTION B */}
      <SectionB_CostsSavingsDistribution
        calculated={calculated}
        currency={selectedCurrency}
      />

      {/* SECTION C */}
      <SectionC_VaRDistributionBasel
        calculated={calculated}
        currency={selectedCurrency}
      />

      {/* SECTION D */}
      <SectionD_HistoricThreshold
        calculated={calculated}
        currency={selectedCurrency}
      />

      {/* SECTION E */}
      <SectionE_ThreeYearBudgetCashFlows
        calculated={calculated}
        currency={selectedCurrency}
      />

      {/* SECTION F */}
      <SectionF_ThreeYearBudgetSCR
        calculated={calculated}
        currency={selectedCurrency}
      />

      {/* SECTION G - NOUVELLE */}
      <SectionG_PriorityActionsN1
        calculated={calculated}
        businessLines={businessLines}
        currency={selectedCurrency}
      />

      {/* SECTION H - NOUVELLE */}
      <SectionH_PriorityActionsN2
        calculated={calculated}
        businessLines={businessLines}
        currency={selectedCurrency}
      />

      {/* SECTION I - NOUVELLE */}
      <SectionI_PriorityActionsN3
        calculated={calculated}
        businessLines={businessLines}
        currency={selectedCurrency}
      />

      {/* EXPORT PDF BUTTON */}
      <ExportButton onExport={handleExportPDF} />
    </div>
  );
}
```

---

## 📋 PATTERN DE DESIGN

**Pattern appliqué**: **Composite Report Pattern**

- **Agrégation**: Toutes les données des 16 pages précédentes
- **Présentation**: Dashboard exécutif consolidé
- **Format**: PDF-ready (mise en page optimisée pour export)
- **Réutilisation**: Composants de sections réutilisables

**Avantages**:
- ✅ Séparation des préoccupations (1 section = 1 composant)
- ✅ Facilité de maintenance (modification section indépendante)
- ✅ Testabilité (chaque section testable isolément)
- ✅ Export PDF simplifié (structure préformatée)

---

## 🎨 DESIGN UX/UI

### Hiérarchie visuelle

```
┌─────────────────────────────────────────────┐
│  PAGE HEADER                                 │
│  17 - Global Reporting HCM Performance Plan  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  SECTION A - Value at Risk                   │
│  ┌─────────┬─────────┬─────────┐            │
│  │   UL    │   EL    │   VaR   │            │
│  └─────────┴─────────┴─────────┘            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  SECTION B - Costs Savings Distribution      │
│  [Tableau 5 indicateurs]                     │
└─────────────────────────────────────────────┘

... (sections C, D, E, F, G, H, I)

┌─────────────────────────────────────────────┐
│  FOOTER - Export Actions                     │
│  [Export PDF] [Print] [Share]                │
└─────────────────────────────────────────────┘
```

### Palette de couleurs (cohérente avec CEO Dashboard)

- **Background**: `bg-gray-900` (dark theme)
- **Sections**: `bg-gray-800/50` avec `border-gray-700`
- **Accents**:
  - Success: `text-green-400`
  - Warning: `text-yellow-400`
  - Danger: `text-red-400`
  - Info: `text-blue-400`

---

## 📦 FICHIERS À CRÉER

### 1. Composant principal

- `src/modules/module1/components/steps/Page17GlobalReporting.tsx` (composant principal)

### 2. Sous-composants (sections)

- `src/modules/module1/components/reporting/SectionA_ValueAtRisk.tsx`
- `src/modules/module1/components/reporting/SectionB_CostsSavingsDistribution.tsx`
- `src/modules/module1/components/reporting/SectionC_VaRDistributionBasel.tsx`
- `src/modules/module1/components/reporting/SectionD_HistoricThreshold.tsx`
- `src/modules/module1/components/reporting/SectionE_ThreeYearBudgetCashFlows.tsx`
- `src/modules/module1/components/reporting/SectionF_ThreeYearBudgetSCR.tsx`
- `src/modules/module1/components/reporting/SectionG_PriorityActionsN1.tsx`
- `src/modules/module1/components/reporting/SectionH_PriorityActionsN2.tsx`
- `src/modules/module1/components/reporting/SectionI_PriorityActionsN3.tsx`

### 3. Utilitaires

- `src/modules/module1/utils/pdfExport.ts` (export PDF)
- `src/modules/module1/components/reporting/index.ts` (exports)

### 4. Mise à jour navigation

- Modifier `src/modules/module1/components/CFOForm.tsx` (ajouter Step 17)

---

## ✅ CRITÈRES DE SUCCÈS

1. ✅ **Toutes les données des 16 pages précédentes sont affichées**
2. ✅ **Chaque section correspond exactement à la feuille Excel 13**
3. ✅ **Aucune formule Excel manquante** (1447 formules mappées)
4. ✅ **Design cohérent** avec le reste de l'application
5. ✅ **Export PDF fonctionnel** (optionnel mais recommandé)
6. ✅ **Performance optimale** (< 1s de chargement)
7. ✅ **Responsive** (mobile + desktop)

---

## 🚀 PLAN D'EXÉCUTION

### Étape 1: Création structure de base (30 min)
- Créer dossier `src/modules/module1/components/reporting/`
- Créer composant principal `Page17GlobalReporting.tsx`
- Créer fichier exports `index.ts`

### Étape 2: Implémentation sections (2-3h)
- Section A: Value at Risk (simple, 5 valeurs)
- Section B: Costs Savings (tableau indicateurs)
- Section C: VaR Basel (tableau risques)
- Section D: Historic Threshold (valeurs + seuil)
- Section E: 3-Year Budget Cash Flows (tableau 3 ans)
- Section F: 3-Year Budget SCR (impact SCR)
- Sections G, H, I: Priority Actions (réutiliser composants Pages 14-15-16)

### Étape 3: Navigation et intégration (15 min)
- Ajouter Step 17 dans CFOForm.tsx
- Tester navigation complète

### Étape 4: Tests et validation (30 min)
- Tester avec données demo
- Vérifier tous les chiffres vs Excel
- Valider design responsive

### Étape 5: Export PDF (optionnel, 1h)
- Implémenter génération PDF
- Tester export

**Temps total estimé**: 4-5 heures

---

## ⚠️ VALIDATION REQUISE

**Avant de commencer le développement, je dois confirmer avec vous:**

1. ✅ **Est-ce que ce plan correspond à votre vision de la Page 17?**
2. ✅ **Les 9 sections (A-I) sont-elles correctes?**
3. ✅ **Dois-je implémenter l'export PDF immédiatement ou plus tard?**
4. ✅ **Y a-t-il des sections manquantes que je n'ai pas identifiées?**
5. ✅ **Le mapping des données Excel → React est-il correct?**

**Une fois validé, j'exécute le développement complet à 100%.**

---

## 📊 MÉTRIQUES DE QUALITÉ ATTENDUES

- **Conformité formules**: 100% (1447/1447 formules)
- **Couverture sections**: 100% (9/9 sections)
- **Tests validation**: 100% passés
- **Performance**: < 1s chargement
- **Responsive**: Mobile + Desktop
- **Code quality**: TypeScript strict mode
- **Documentation**: Inline comments pour logique complexe

---

**Plan créé par**: Elite SaaS Developer
**Skill utilisé**: `elite-saas-developer`
**Statut**: ⏳ **EN ATTENTE DE VALIDATION PROPRIÉTAIRE**

**Prêt à exécuter dès validation.**
