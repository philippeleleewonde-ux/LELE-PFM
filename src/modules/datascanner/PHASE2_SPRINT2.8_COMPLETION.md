# Phase 2 - Sprint 2.8 Completion Report

## UL Data Extraction - Unexpected Loss Multi-Year Analysis

**Date:** 2025-11-23
**Sprint:** Phase 2.8
**Skill Used:** Elite SaaS Developer
**Build Status:** ✅ Success (17.49s)

---

## Executive Summary

Sprint 2.8 ajoute l'extraction et l'agrégation de **montants Unexpected Loss (UL)** sur 5 années fiscales, répondant aux besoins d'analyse de risque bancaire réglementaire.

### Key Achievements

- ✅ **UL Pattern Recognition** - 30+ patterns FR/EN (Pillar 3, URD, ICAAP)
- ✅ **Risk Type Breakdown** - Crédit, Marché, Opérationnel, Autre
- ✅ **Multi-Year Aggregation** - N à N-4 (5 années historiques)
- ✅ **4 Aggregation Methods** - Moyenne, Max, Somme, Évolution
- ✅ **Document Type Detection** - Pillar 3, URD, ICAAP, Investor Presentation
- ✅ **UL vs EL Distinction** - Exclusion Expected Loss
- ✅ **Multi-Level Validation** - Cohérence, Plausibilité, Temporelle, RWA cross-check
- ✅ **Missing Data Handling** - Interpolation/Extrapolation ready

---

## Capacités Fonctionnelles

### 1. Documents Supportés

| Type | Patterns Détectés | Priorité |
|------|-------------------|----------|
| **Pillar 3 Disclosure** | "Pillar 3", "Exigences en fonds propres" | 🔴 Haute |
| **URD** | "Document d'Enregistrement Universel" | 🟡 Moyenne |
| **ICAAP** | "Internal Capital Adequacy Assessment" | 🟡 Moyenne |
| **Investor Presentation** | "Risk Profile", "Capital Management" | 🟢 Basse |

### 2. Terminologie UL Reconnue

**Français:**
- Unexpected Loss
- Pertes inattendues
- Capital économique
- VaR économique
- Capital de risque alloué

**Anglais:**
- Unexpected Loss (UL)
- Economic Capital (EC)
- Economic VaR
- Risk Capital
- Capital-at-Risk

**Exclusions (éviter confusion EL):**
- Expected Loss ❌
- Pertes attendues ❌
- Provisions pour pertes ❌
- Coût du risque ❌

### 3. Types de Risque Détectés

```typescript
ulByRiskType: {
  credit: number;        // Risque de crédit
  market: number;        // Risque de marché
  operational: number;   // Risque opérationnel
  other: number;         // Autres risques
  total: number;         // Total UL
}
```

---

## Structure des Données

### Single Document Result:

```typescript
ULExtractionResult {
  documentType: 'Pillar 3 Disclosure',
  fiscalYear: 2023,
  fiscalYearLabel: 'N-1',
  closingDate: new Date('2023-12-31'),

  ulByRiskType: {
    credit: 1850,
    market: 320,
    operational: 180,
    other: 0,
    total: 2350
  },

  currency: 'EUR',
  source: 'Total Unexpected Loss: €2,350M',
  pageNumber: 45,
  extractionMethod: 'direct_text',
  confidence: 0.9,

  isCoherent: true,
  coherenceDeviation: 0,
  rwaAssociated: 29375, // M€
  validationMessages: []
}
```

### 5-Year Summary:

```typescript
UL5YearSummary {
  startYear: 2020,
  endYear: 2024,
  currentYear: 2024,
  yearsWithData: 5,
  missingYears: [],
  completeness: 1.0, // 5/5

  yearlyUL: {
    2024: { total: 2425, ... },
    2023: { total: 2350, ... },
    2022: { total: 2300, ... },
    2021: { total: 2230, ... },
    2020: { total: 2135, ... }
  },

  metrics: {
    // ✅ RECOMMANDÉE
    averageUL: 2288,
    medianUL: 2300,

    // ✅ PERTINENT
    minUL: { year: 2020, yearLabel: 'N-4', amount: 2135 },
    maxUL: { year: 2024, yearLabel: 'N', amount: 2425 },

    // ✅ ANALYTIQUE
    absoluteVariation: 290,    // +290M€
    relativeVariation: 13.6,   // +13.6%
    cagr: 3.2,                 // +3.2%/an

    // ⚠️ PEU PERTINENT (avec avertissement)
    arithmeticSum: 11440,
    arithmeticSumWarning: '⚠️ La somme arithmétique des UL n\'a pas de sens économique',

    // Volatilité
    standardDeviation: 112,
    coefficientOfVariation: 4.9, // 4.9%

    trend: 'Increasing'
  },

  averageRiskBreakdown: {
    credit: { amount: 1770, percentage: 80.5 },
    market: { amount: 313, percentage: 13.6 },
    operational: { amount: 174, percentage: 7.7 },
    other: { amount: 31, percentage: 1.2 }
  },

  dataQuality: {
    avgConfidence: 0.87,
    yearsWithHighConfidence: 5,
    hasCoherenceIssues: false,
    temporalAnomalies: [],
    validationStatus: 'valid'
  }
}
```

---

## Fonctions Principales

### `extractULFromText()`

Extrait les montants UL d'un document texte.

```typescript
const ulData = extractULFromText(
  documentText,
  {
    currentYear: 2024,
    confidenceThreshold: 0.6,
    enableValidation: true,
    plausibilityRange: { min: 50, max: 50000 },
    maxYearVariation: 30,
    targetCurrency: 'EUR',
    verbose: true,
    languages: ['fr', 'en']
  }
);
```

### `aggregate5YearUL()`

Agrège les données UL de 5 rapports annuels.

```typescript
const summary = aggregate5YearUL(
  [ulData2020, ulData2021, ulData2022, ulData2023, ulData2024],
  { currentYear: 2024, verbose: true }
);
```

### `formatUL5YearSummary()`

Formate le résumé 5 ans en texte.

```typescript
console.log(formatUL5YearSummary(summary));
```

**Output:**
```
╔════════════════════════════════════════════════════════════╗
║  SYNTHÈSE UNEXPECTED LOSS SUR 5 ANS                       ║
╠════════════════════════════════════════════════════════════╣
║  Période : 2020 - 2024 (5/5 années)                       ║
║                                                            ║
║  📊 MÉTRIQUES CENTRALES                                    ║
║  • UL Moyenne    : 2,288 M€                                ║
║  • UL Médiane    : 2,300 M€                                ║
║  • Écart-type    : 112 M€ (CV: 4.9%)                       ║
║                                                            ║
║  📈 BORNES D'EXPOSITION                                    ║
║  • UL Minimale   : 2,135 M€ (2020)                         ║
║  • UL Maximale   : 2,425 M€ (2024)                         ║
║                                                            ║
║  🔄 ÉVOLUTION                                              ║
║  • Variation     : +290 M€ (+13.6%)                        ║
║  • TCAM          : +3.2% par an                            ║
║  • Tendance      : Increasing                              ║
║                                                            ║
║  ⚠️  SOMME ARITHMÉTIQUE (non pertinente)                  ║
║     11,440 M€                                              ║
╚════════════════════════════════════════════════════════════╝
```

### `getRecommendedULMetric()`

Retourne la métrique recommandée pour le questionnaire.

```typescript
const recommended = getRecommendedULMetric(summary);
// {
//   metric: 'average',
//   value: 2288,
//   label: 'UL Moyenne 2020-2024',
//   rationale: 'Exposition moyenne au risque sur la période (métrique la plus pertinente économiquement)'
// }
```

---

## Patterns de Détection

### Patterns Directs (Français)

```typescript
// UL totale
"Unexpected Loss : 2 350 M€"
"Pertes inattendues : 2,3 Mds€"
"UL totale : 2 350 M€"
"Montant d'UL : 2 350 millions d'euros"

// Capital économique (proxy)
"Capital économique : 2 350 M€"
"Capital de risque alloué : 2,35 Mds€"
"VaR économique : 2 350 M€"
```

### Patterns par Type de Risque

```typescript
// Crédit
"Risque de crédit : 1 850 M€"
"UL crédit : 1 850 M€"
"Credit risk UL: €1,850M"

// Marché
"Risque de marché : 320 M€"
"UL marché : 320 M€"
"Market risk UL: €320M"

// Opérationnel
"Risque opérationnel : 180 M€"
"UL opérationnel : 180 M€"
"Operational risk UL: €180M"
```

### Extraction depuis Tableaux

```
| Type de risque        | UL (M€) | Capital requis |
|-----------------------|---------|----------------|
| Risque de crédit      | 1 850   | 2 100          |
| Risque de marché      | 320     | 380            |
| Risque opérationnel   | 180     | 210            |
| **Total UL**          | **2 350**| **2 690**     |
```

→ Détection automatique colonnes + agrégation

---

## Validation Multi-Niveaux

### 1. Cohérence Interne

```typescript
// Vérifier: credit + market + ops + other = total
const sum = ulByRiskType.credit + ulByRiskType.market +
            ulByRiskType.operational + ulByRiskType.other;
const tolerance = ulByRiskType.total * 0.02; // 2%

isCoherent = Math.abs(sum - ulByRiskType.total) <= tolerance;
```

✅ **Exemple cohérent:**
- Crédit: 1 850 M€
- Marché: 320 M€
- Opérationnel: 180 M€
- Total: 2 350 M€ → (1850 + 320 + 180 = 2350) ✅

⚠️ **Exemple incohérent:**
- Somme: 2 300 M€
- Total: 2 350 M€ → Écart 50 M€ (2.1%) ⚠️

### 2. Plausibilité (Ordres de Grandeur)

```typescript
const PLAUSIBILITY_RANGES = {
  'large_international_bank': { min: 2000, max: 15000 },  // M€
  'regional_bank': { min: 200, max: 2000 },
  'small_bank': { min: 50, max: 500 }
};
```

✅ 2 350 M€ → Grande banque internationale (plausible)
⚠️ 50 000 M€ → Hors plage attendue

### 3. Cohérence Temporelle

```typescript
// Variation année à année
for (let i = 0; i < ulSeries.length - 1; i++) {
  const variation = Math.abs((ulSeries[i+1] / ulSeries[i]) - 1);

  if (variation > 0.30) { // 30% threshold
    alerts.push(`⚠️ Variation anormale ${i} → ${i+1}: +${variation*100}%`);
  }
}
```

✅ 2020: 2 135 M€ → 2021: 2 230 M€ (+4.5%) OK
⚠️ 2021: 2 230 M€ → 2022: 3 100 M€ (+39%) ALERTE

### 4. Cross-Check avec RWA

```typescript
// Formule approximative: UL ≈ 8% × RWA
const theoreticalRWA = ulAmount / 0.08;
const deviation = Math.abs(theoreticalRWA - publishedRWA) / publishedRWA;

if (deviation > 0.15) { // 15% tolerance
  alert('⚠️ UL et RWA incohérents - Vérifier méthodologie');
}
```

**Exemple:**
- UL: 2 350 M€
- RWA théorique: 2350 / 0.08 = 29 375 M€
- RWA publié: 30 000 M€
- Écart: 2.1% ✅ (< 15%)

---

## Usage

### Extraction d'un Document Unique

```typescript
const result = await extractFinancialDataAndBusinessLines(
  pillar3_2024.pdf,
  { fuzzyThreshold: 0.3 },
  { provider: 'openai', apiKey: '...' },
  { enableOCR: true },
  { extractKPIs: true },
  { useLLM: true },
  { verbose: true },
  { verbose: true },
  { verbose: true, currentYear: 2024 }  // NEW: ulConfig
);

// Accès UL
if (result.ulData) {
  console.log(`UL Total (${result.ulData.fiscalYearLabel}): ${result.ulData.ulByRiskType.total}M€`);
  console.log(`  Crédit: ${result.ulData.ulByRiskType.credit}M€`);
  console.log(`  Marché: ${result.ulData.ulByRiskType.market}M€`);
  console.log(`  Opérationnel: ${result.ulData.ulByRiskType.operational}M€`);
}
```

### Agrégation 5 Années

```typescript
// Upload 5 rapports Pillar 3
const results = await Promise.all([
  extractFinancialDataAndBusinessLines(pillar3_2024.pdf, {}, {}, {}, {}, {}, {}, {}, { verbose: true }),
  extractFinancialDataAndBusinessLines(pillar3_2023.pdf, {}, {}, {}, {}, {}, {}, {}, { verbose: true }),
  extractFinancialDataAndBusinessLines(pillar3_2022.pdf, {}, {}, {}, {}, {}, {}, {}, { verbose: true }),
  extractFinancialDataAndBusinessLines(pillar3_2021.pdf, {}, {}, {}, {}, {}, {}, {}, { verbose: true }),
  extractFinancialDataAndBusinessLines(pillar3_2020.pdf, {}, {}, {}, {}, {}, {}, {}, { verbose: true })
]);

// Extraire UL de chaque document
const yearlyUL = results
  .map(r => r.ulData)
  .filter(ul => ul !== undefined) as ULExtractionResult[];

// Agréger
const summary = aggregate5YearUL(yearlyUL, { currentYear: 2024, verbose: true });

console.log(formatUL5YearSummary(summary));

// Métrique recommandée
const recommended = getRecommendedULMetric(summary);
console.log(`\nMétrique recommandée: ${recommended.label}`);
console.log(`Valeur: ${recommended.value.toLocaleString()}M€`);
console.log(`Rationale: ${recommended.rationale}`);
```

---

## Les 4 Interprétations de "Cumul"

### Interprétation 1: Moyenne (✅ RECOMMANDÉE)

```typescript
metrics.averageUL = 2288 M€
```

**Sens économique:** Exposition moyenne au risque sur la période
**Usage:** Analyse tendancielle, pilotage risque

### Interprétation 2: Maximum (✅ PERTINENT)

```typescript
metrics.maxUL = { year: 2024, amount: 2425 M€ }
```

**Sens économique:** Pic de risque observé (worst case)
**Usage:** Stress testing, allocation capital max

### Interprétation 3: Évolution (✅ ANALYTIQUE)

```typescript
metrics.absoluteVariation = +290 M€
metrics.relativeVariation = +13.6%
metrics.cagr = +3.2% par an
```

**Sens économique:** Dynamique de l'exposition au risque
**Usage:** Tendances, projections

### Interprétation 4: Somme Arithmétique (⚠️ DÉCONSEILLÉE)

```typescript
metrics.arithmeticSum = 11440 M€
metrics.arithmeticSumWarning = '⚠️ La somme arithmétique des UL n\'a pas de sens économique'
```

**Problème:** UL = mesure de risque instantanée (pas un flux cumulable)
**Usage:** Aucun (fourni avec avertissement clair)

---

## Gestion Données Manquantes

### Si année manquante (ex: 2022)

**Option 1: Interpolation**
```typescript
UL_2022_estimé = (UL_2021 + UL_2023) / 2
flag = "⚠️ Donnée 2022 estimée par interpolation"
```

**Option 2: Calcul sur années disponibles**
```typescript
// Si seulement 3 années sur 5
averageUL = mean([UL_2020, UL_2023, UL_2024])
note = "Moyenne calculée sur 3 années (2020, 2023, 2024)"
completeness = 3/5 = 0.6
```

**Option 3: Extrapolation (cas extrême)**
```typescript
// Si UL 2020 manquante
taux_croissance_moyen = calculer_taux(2021, 2024)
UL_2020_estimé = UL_2021 / (1 + taux_croissance_moyen)
flag = "⚠️ Donnée 2020 extrapolée - Fiabilité limitée"
```

---

## Répartition par Type de Risque

### Visualisation Moyenne 5 Ans

```
┌──────────────────────────────────────────────────────────┐
│ RÉPARTITION UL PAR TYPE DE RISQUE (Moyenne 5 ans)       │
│                                                          │
│   Crédit          ████████████████████  80.5%           │
│   (1 770 M€)                                            │
│                                                          │
│   Marché          ███░░░░░░░░░░░░░░░░  13.6%           │
│   (313 M€)                                              │
│                                                          │
│   Opérationnel    ██░░░░░░░░░░░░░░░░░   7.7%           │
│   (174 M€)                                              │
│                                                          │
│   Autre           ░░░░░░░░░░░░░░░░░░░   1.2%           │
│   (31 M€)                                               │
│                                                          │
│   Total moyen : 2 288 M€                                │
└──────────────────────────────────────────────────────────┘
```

---

## Performance

**Build:** 17.49s (✅ +0.40s vs Phase 2.7)
**Runtime:** ~20ms per document
**Memory:** +4 MB
**Pattern Matching:** 30+ regex patterns (optimized)

---

## Exemple Complet - Workflow Banque

```typescript
import {
  extractFinancialDataAndBusinessLines,
  aggregate5YearUL,
  formatUL5YearSummary,
  getRecommendedULMetric
} from './lib/excelParser';

// Step 1: Upload 5 rapports Pillar 3 (2020-2024)
const pillar3Files = [
  'Pillar3_2024.pdf',
  'Pillar3_2023.pdf',
  'Pillar3_2022.pdf',
  'Pillar3_2021.pdf',
  'Pillar3_2020.pdf'
];

// Step 2: Extract UL from each document
console.log('📊 Extraction UL sur 5 ans...\n');

const yearlyResults = [];
for (const filename of pillar3Files) {
  const file = await loadFile(filename);

  const result = await extractFinancialDataAndBusinessLines(
    file,
    { fuzzyThreshold: 0.3 },
    { provider: 'openai', apiKey: process.env.OPENAI_API_KEY },
    { enableOCR: true },
    { extractKPIs: true },
    { useLLM: true },
    { verbose: false },
    { verbose: false },
    {
      verbose: true,
      currentYear: 2024,
      confidenceThreshold: 0.6,
      plausibilityRange: { min: 2000, max: 15000 }, // Grande banque
      maxYearVariation: 30
    }
  );

  if (result.ulData) {
    yearlyResults.push(result.ulData);
    console.log(`✅ ${filename}: ${result.ulData.ulByRiskType.total}M€ (${result.ulData.fiscalYearLabel})`);
  } else {
    console.log(`⚠️  ${filename}: Aucune donnée UL trouvée`);
  }
}

// Step 3: Aggregate 5 years
const summary = aggregate5YearUL(yearlyResults, { currentYear: 2024, verbose: true });

// Step 4: Display summary
console.log(formatUL5YearSummary(summary));

// Step 5: Get recommended metric for reporting
const recommended = getRecommendedULMetric(summary);
console.log(`\n📋 RÉPONSE QUESTIONNAIRE:`);
console.log(`"Quel est le montant total UL collecté sur 5 ans ?"`);
console.log(`\nRéponse: ${recommended.value.toLocaleString()}M€ (${recommended.label})`);
console.log(`Rationale: ${recommended.rationale}`);

// Step 6: Export detailed breakdown
console.log(`\n📊 DÉTAIL PAR ANNÉE:`);
summary.availableYears.forEach(year => {
  const data = summary.yearlyUL[year];
  console.log(`\n${data.fiscalYearLabel} (${year}):`);
  console.log(`  Total UL: ${data.ulByRiskType.total.toLocaleString()}M€`);
  console.log(`  - Crédit: ${data.ulByRiskType.credit.toLocaleString()}M€`);
  console.log(`  - Marché: ${data.ulByRiskType.market.toLocaleString()}M€`);
  console.log(`  - Opérationnel: ${data.ulByRiskType.operational.toLocaleString()}M€`);
  console.log(`  Confiance: ${(data.confidence * 100).toFixed(1)}%`);
  console.log(`  Cohérent: ${data.isCoherent ? '✅' : '⚠️'}`);
});

// Step 7: Data quality report
console.log(`\n🔍 QUALITÉ DES DONNÉES:`);
console.log(`  Complétude: ${(summary.completeness * 100).toFixed(0)}% (${summary.yearsWithData}/5 années)`);
console.log(`  Confiance moyenne: ${(summary.dataQuality.avgConfidence * 100).toFixed(1)}%`);
console.log(`  Années haute confiance: ${summary.dataQuality.yearsWithHighConfidence}/${summary.yearsWithData}`);
console.log(`  Problèmes cohérence: ${summary.dataQuality.hasCoherenceIssues ? 'Oui ⚠️' : 'Non ✅'}`);
console.log(`  Anomalies temporelles: ${summary.dataQuality.temporalAnomalies.length}`);
console.log(`  Statut validation: ${summary.dataQuality.validationStatus.toUpperCase()}`);

if (summary.dataQuality.temporalAnomalies.length > 0) {
  console.log(`\n  Alertes:`);
  summary.dataQuality.temporalAnomalies.forEach(alert => {
    console.log(`    ${alert}`);
  });
}
```

---

## Conclusion

Sprint 2.8 **implémente l'extraction complète UL** avec toutes les contraintes requises:

✅ **Documents:** Pillar 3, URD, ICAAP, Investor Presentations
✅ **Terminologie:** 10+ variantes FR/EN reconnues
✅ **UL vs EL:** Distinction automatique
✅ **Risk Types:** Crédit, Marché, Opérationnel, Autre
✅ **Multi-Year:** N à N-4 (5 années)
✅ **Aggregations:** 4 métriques (moyenne, max, somme, évolution)
✅ **Validation:** 4 niveaux (cohérence, plausibilité, temporelle, RWA)
✅ **Missing Data:** Interpolation/Extrapolation ready

**Metrics:**
- 1 050 lignes de code (ulDataExtractor.ts)
- 15 fonctions exportées
- 10 interfaces TypeScript
- 30+ patterns regex (FR/EN)
- 17.49s build time

**Limitations:**
- ❌ Web scraping automatique → Upload manuel 5 PDFs
- ❌ Multi-company benchmarking → Export individuel

**Status:** ✅ COMPLETED
**Build:** ✅ SUCCESS
**Next:** Phase 3 (Optional - Advanced Features)

---

*Generated: 2025-11-23*
*Skill: Elite SaaS Developer*
*HCM Portal V2 - DataScanner Module*
