# HCM COST SAVINGS - Moteur de Calcul & Formules

> **Document de Référence Officiel**
> **Version**: 1.0.0
> **Date**: 7 Janvier 2026
> **Module**: HCM COST SAVINGS (Module 3)
> **Page**: Récapitulatif des Performances Réalisées

---

## 1. Vue d'Ensemble

### 1.1 Architecture du Moteur de Calcul

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOURCES DE DONNÉES                           │
├─────────────────────────────────────────────────────────────────┤
│  Module 1 (HCM Performance Plan)                                │
│  ├── company_ppr_settings (Objectifs PPR hebdomadaires)         │
│  ├── company_performance_scores.factors (Données financières)   │
│  │   ├── financialHistory.sales (Recettes N-1)                  │
│  │   ├── financialHistory.spending (Dépenses N-1)               │
│  │   └── annualHoursPerPerson (Volume horaire N-1)              │
│  └── priorityActionsN1 (PPR par indicateur par personne)        │
├─────────────────────────────────────────────────────────────────┤
│  Module 3 (HCM Cost Savings)                                    │
│  ├── module3_cost_entries (Coûts saisis au quotidien)           │
│  │   ├── kpi_type: 'abs' | 'qd' | 'oa' | 'ddp' | 'ekh'         │
│  │   ├── duration_hours, duration_minutes                       │
│  │   ├── compensation_amount (frais)                            │
│  │   └── period_start, period_end                               │
│  └── employees (Membres des équipes)                            │
│      ├── incapacity_rate (Taux d'incapacité)                    │
│      └── versatility_f1/f2/f3 (Polyvalence)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               MOTEUR DE CALCUL TYPESCRIPT                       │
│      src/modules/module3/engine/calculationEngine.ts            │
│      src/modules/module3/PerformanceRecapPage.tsx               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RÉSULTATS CALCULÉS                           │
├─────────────────────────────────────────────────────────────────┤
│  Par Indicateur (ABS, QD, OA, DDP, EKH):                        │
│  ├── Score Financier                                            │
│  ├── Pertes Constatées                                          │
│  ├── PPR Prévues                                                │
│  ├── Économies Réalisées                                        │
│  └── Pertes en %                                                │
├─────────────────────────────────────────────────────────────────┤
│  Distribution:                                                  │
│  ├── Flux Trésorerie (67%)                                      │
│  └── Sorties Primes (33%)                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Les 5 Indicateurs KPI

| Code | Nom Français | Nom Anglais | Couleur |
|------|-------------|-------------|---------|
| **ABS** | Absentéisme | Absenteeism | Orange |
| **QD** (DFQ) | Défauts Qualité | Quality Defects | Rose |
| **OA** (ADT) | Accidents de Travail | Occupational Accidents | Rouge |
| **DDP** (EPD) | Écarts de Productivité Directe | Direct Productivity Gaps | Violet |
| **EKH** | Écarts de Savoir-faire | Know-How Gaps | Cyan |

---

## 2. Formules de Calcul - NIVEAU 1

### 2.1 Temps-Calcul (M3-Temps-Calcul)

**Formule Excel**: `=E6+0`

```typescript
// Équivalent TypeScript
const calculateTempsCalcul = (tempsCollecte: number): number => {
  return tempsCollecte + 0; // +0 force la conversion en nombre
};
```

**Source**: `module3_cost_entries.duration_hours + duration_minutes/60`

---

### 2.2 Score Financier

**Formule Excel**:
```
=((Recettes_N1 - Dépenses_N1) / Volume_Horaire_N1) × Temps_Calcul
```

**Formule complète**:
```
=(('2-Tri-TB Fixe-Données Risko M1'!L3 - '2-Tri-TB Fixe-Données Risko M1'!M3)
  / '2-Tri-TB Fixe-Données Risko M1'!K3) × E6
```

```typescript
const calculateScoreFinancier = (
  tempsCalcul: number,        // E6 - en heures décimales
  recettesN1: number,         // L3 - Sales/Turnover N-1
  depensesN1: number,         // M3 - Total Spending N-1
  volumeHoraireN1: number     // K3 - Annual Hours Total
): number => {
  if (volumeHoraireN1 === 0) return 0;
  const tauxMargeHoraire = (recettesN1 - depensesN1) / volumeHoraireN1;
  return tauxMargeHoraire * tempsCalcul;
};
```

**Sources des données**:
- `recettesN1`: `company_performance_scores.factors.financialHistory.sales`
- `depensesN1`: `company_performance_scores.factors.financialHistory.spending`
- `volumeHoraireN1`: `annualHoursPerPerson × nombre_employés`

---

### 2.3 Pertes Constatées (Brut)

**Formule Excel**: `=SI((H6+G6)=0;0;SI((H6+G6)>0;(H6+G6)-D6))`

```typescript
const calculatePertesConstateesBrut = (
  scoreFinancier: number,     // H6
  fraisCollectes: number,     // G6
  tauxIncapacite: number      // D6
): number => {
  const total = scoreFinancier + fraisCollectes;
  if (total === 0) return 0;
  if (total > 0) return total - tauxIncapacite;
  return 0;
};
```

---

### 2.4 Pertes Constatées avec Incapacité

**Formule Excel**: `=SI(M6<0;0;SI(M6=0;0;SI(M6>0;M6)))`

```typescript
const calculatePertesConstateesAvecIncapacite = (pertesConstateesBrut: number): number => {
  if (pertesConstateesBrut < 0) return 0;
  if (pertesConstateesBrut === 0) return 0;
  if (pertesConstateesBrut > 0) return pertesConstateesBrut;
  return 0;
};
// Simplification: Math.max(0, pertesConstateesBrut)
```

---

### 2.5 PPR Prévues (Semaine)

**Formule Excel**: `=SI(B6<>0;(PPR_par_personne_indicateur/3)/4;SI(B6=0;0))`

```typescript
const calculatePPRPrevues = (
  salariéExiste: boolean,
  pprParPersonneParIndicateur: number  // en k€ depuis Page 14
): number => {
  if (!salariéExiste) return 0;
  if (pprParPersonneParIndicateur === 0) return 0;

  // CONVERSION k€ → € (× 1000)
  const pprEnUnites = pprParPersonneParIndicateur * 1000;

  // PPR semaine = (PPR par personne en € / 3 mois) / 4 semaines
  const pprSemaine = (pprEnUnites / 3) / 4;
  return pprSemaine;
};
```

**Source**: `company_ppr_settings.ppr_xxx_weekly` où xxx = abs, qd, oa, ddp, ekh

**⚠️ FALLBACK (si aucun PPR configuré)**:
```typescript
// Valeurs par défaut utilisées quand company_ppr_settings est vide
const defaultPpr = {
  abs: 25000,   // Absentéisme: ~300K annuel / 3 / 4
  qd: 15000,    // Qualité/Défauts: ~180K annuel / 3 / 4
  oa: 10000,    // Accidents: ~120K annuel / 3 / 4
  ddp: 20000,   // Productivité: ~240K annuel / 3 / 4
  ekh: 5000,    // Savoir-faire: ~60K annuel / 3 / 4
  total: 75000  // Total hebdomadaire
};
```
> 💡 Pour configurer les vrais objectifs: HCM Performance Plan > Objectifs PPR

---

### 2.6 Économies Réalisées - Version 1 (K6)

**Formule Excel**:
```
=SI(ET(F6=0;T6=0;B6<>0);N6;
  SI(ET(F6=0;T6=0;B6=0);0;
    SI(ET(F6>0;T6=0);N6;
      SI(ET(F6=0;T6>0);0))))
```

```typescript
const calculateEconomiesRealiseesN1 = (
  tempsCalculN1: number,      // F6
  tempsCalculN2: number,      // T6
  salariéExiste: boolean,     // B6 <> 0
  economiesBrut: number       // N6
): number => {
  if (tempsCalculN1 === 0 && tempsCalculN2 === 0 && salariéExiste) return economiesBrut;
  if (tempsCalculN1 === 0 && tempsCalculN2 === 0 && !salariéExiste) return 0;
  if (tempsCalculN1 > 0 && tempsCalculN2 === 0) return economiesBrut;
  if (tempsCalculN1 === 0 && tempsCalculN2 > 0) return 0;
  return 0;
};
```

---

### 2.7 Économies Réalisées - Version Brut (N6)

**Formule Excel**: `=SI(M6<0;J6-0;SI(M6>0;J6-M6;SI(M6=0;J6-M6)))`

```typescript
const calculateEconomiesRealiseesBrut = (
  pprPrevues: number,         // J6
  pertesConstatees: number    // M6
): number => {
  if (pertesConstatees < 0) return pprPrevues;      // Toutes les économies
  if (pertesConstatees > 0) return pprPrevues - pertesConstatees;
  if (pertesConstatees === 0) return pprPrevues;
  return 0;
};
// Simplification: pprPrevues - Math.max(0, pertesConstatees)
```

**FORMULE CLEF**: `Économies = PPR Prévues - Pertes Constatées`

---

### 2.8 Pertes en Pourcentage

**Formule Excel**: `=SI(M6<0;0;SI(M6=0;0;SI(M6>0;M6/$E$3)))`

```typescript
const calculatePertesEnPourcentage = (
  pertesConstatees: number,   // M6
  valeurReference: number     // $E$3 (total des pertes)
): number => {
  if (pertesConstatees < 0) return 0;
  if (pertesConstatees === 0) return 0;
  if (pertesConstatees > 0 && valeurReference !== 0) {
    return (pertesConstatees / valeurReference) * 100;
  }
  return 0;
};
```

---

## 3. Formules de Calcul - NIVEAU 2 (Prises en Compte)

### 3.1 Code P.R.C (Pris en Compte)

**Formule Excel**: `=SI(O6=0;0;SI(O6>0;1))`

```typescript
const calculateCodePRC = (tempsCollecteN2: number): number => {
  if (tempsCollecteN2 === 0) return 0;
  if (tempsCollecteN2 > 0) return 1;
  return 0;
};
```

---

### 3.2 Temps-Pris en Compte

**Formule Excel**: `=SI(P6=0;0;SI(P6>0;T6))`

```typescript
const calculateTempsPrisEnCompte = (
  codePRC: number,    // P6
  tempsCalcul: number // T6
): number => {
  if (codePRC === 0) return 0;
  if (codePRC > 0) return tempsCalcul;
  return 0;
};
```

---

### 3.3 Frais-Pris en Compte

**Formule Excel**: `=SI(P6=0;0;SI(P6>0;V6))`

```typescript
const calculateFraisPrisEnCompte = (
  codePRC: number,       // P6
  fraisCollectes: number // V6
): number => {
  if (codePRC === 0) return 0;
  if (codePRC > 0) return fraisCollectes;
  return 0;
};
```

---

### 3.4 Score Financier N2

**Formule Excel**: `=((L3-M3)/K3)*U6`

```typescript
const calculateScoreFinancierN2 = (
  tempsPrisEnCompte: number,  // U6
  recettesN1: number,
  depensesN1: number,
  volumeHoraireN1: number
): number => {
  if (volumeHoraireN1 === 0) return 0;
  const tauxMargeHoraire = (recettesN1 - depensesN1) / volumeHoraireN1;
  return tauxMargeHoraire * tempsPrisEnCompte;
};
```

---

### 3.5 Pertes Constatées N2

**Formule Excel**: `=SI((X6+W6)=0;0;SI((X6+W6)>0;(X6+W6)-R6))`

```typescript
const calculatePertesConstateesN2 = (
  scoreFinancierN2: number,    // X6
  fraisPrisEnCompte: number,   // W6
  tauxIncapacite: number       // R6
): number => {
  const total = scoreFinancierN2 + fraisPrisEnCompte;
  if (total === 0) return 0;
  if (total > 0) return total - tauxIncapacite;
  return 0;
};
```

---

### 3.6 Économies Réalisées N2

**Formule Excel**: `=SI(ET(F6=0;U6=0);0;SI(ET(F6>0;U6=0);0;SI(ET(F6=0;U6>0);AD6)))`

```typescript
const calculateEconomiesRealiseesN2 = (
  tempsCalculN1: number,      // F6
  tempsPrisEnCompte: number,  // U6
  pprPrevuesN2: number        // AD6
): number => {
  if (tempsCalculN1 === 0 && tempsPrisEnCompte === 0) return 0;
  if (tempsCalculN1 > 0 && tempsPrisEnCompte === 0) return 0;
  if (tempsCalculN1 === 0 && tempsPrisEnCompte > 0) return pprPrevuesN2;
  return 0;
};
```

---

## 4. Formules TOTAUX

### 4.1 Totaux Niveau 1 + Niveau 2

**Formules Excel (Row 3)**:
```
B3 (Total temps):           =SOMME(F6:F1705)+SOMME(U6:U1705)
C3 (Total frais):           =SOMME(G6:G1705)+SOMME(W6:W1705)
D3 (Score financier total): =SOMME(H6:H1705)+SOMME(X6:X1705)
E3 (Pertes totales):        =SI((SOMME(I6:I1705)+SOMME(Y6:Y1705))<0;0;...)
F3 (PPR Prévues):           =SOMME(J6:J1705)
G3 (Économies totales):     =SOMME(K6:K1705)+SOMME(AA6:AA1705)
H3 (Pertes % total):        =SOMME(L6:L1705)+SOMME(AB6:AB1705)
```

```typescript
interface IndicatorTotals {
  tempsTotalCombine: number;           // B3
  fraisTotalCombine: number;           // C3
  scoreFinancierTotalCombine: number;  // D3
  pertesConstateesTotalCombine: number;// E3
  economiesRealiseesTotalCombine: number; // G3
  pertesEnPourcentageTotalCombine: number; // H3
}
```

---

## 5. Calcul EKH (Écarts de Savoir-faire)

### 5.1 Coefficient de Compétence (Polyvalence)

**Formule**: `(F1 + F2 + F3) / 63`

| Niveau | Valeur |
|--------|--------|
| Ne fait pas / Does not make | 0 |
| Débutant / Apprentice | 7 |
| Confirmé / Confirmed | 14 |
| Expérimenté / Experimented | 21 |

**Maximum**: 21 + 21 + 21 = 63

```typescript
const POLYVALENCE_COEFFICIENTS: Record<string, number> = {
  "Does not make / does not know": 0,
  "Apprentice (learning)": 7,
  "Confirmed (autonomous)": 14,
  "Experimented (trainer)": 21,
};

const calculatePolyvalenceCoefficient = (member: TeamMember): number => {
  const coefF1 = POLYVALENCE_COEFFICIENTS[member.versatility_f1] || 0;
  const coefF2 = POLYVALENCE_COEFFICIENTS[member.versatility_f2] || 0;
  const coefF3 = POLYVALENCE_COEFFICIENTS[member.versatility_f3] || 0;
  return (coefF1 + coefF2 + coefF3) / 63;
};
```

### 5.2 Calculs EKH

```typescript
// Score Financier EKH
scoreFinancierEKH = pprParSalarie × (1 - coefficient)

// Économies EKH
economiesEKH = pprParSalarie × coefficient

// Pertes EKH
pertesEKH = scoreFinancierEKH
```

---

## 6. Distribution des Économies

### 6.1 Constantes FIXES (Ne jamais modifier)

```typescript
const TAUX_TRESORERIE = 0.67;  // 67%
const TAUX_PRIMES = 0.33;      // 33%
```

### 6.2 Calcul de Distribution

```typescript
const calculateDistribution = (totalEconomies: number) => ({
  tresorerie: totalEconomies × 0.67,
  primes: totalEconomies × 0.33,
});
```

---

## 7. Flux de Données Complet

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. SAISIE DES COÛTS (CostDataEntry.tsx)                         │
│    └── module3_cost_entries                                     │
│        ├── employee_id, business_line_id                        │
│        ├── kpi_type ('abs', 'qd', 'oa', 'ddp', 'ekh')          │
│        ├── duration_hours, duration_minutes                     │
│        ├── compensation_amount                                  │
│        └── period_start, period_end                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. RÉCAPITULATIF PERFORMANCES (PerformanceRecapPage.tsx)        │
│    └── Moteur de Calcul TypeScript                              │
│        ├── calculateScoreFinancier()                            │
│        ├── calculatePertesConstatees()                          │
│        ├── calculatePPRPrevues()                                │
│        ├── calculateEconomiesRealisees()                        │
│        └── calculateDistribution()                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. PAGES CONSOMMATRICES                                         │
│    ├── CostSavingsReportingPage (Tableau de bord)               │
│    ├── GlobalPerformanceCenterPage (Vue globale)                │
│    ├── PerformanceCalendarPage (Calendrier suivi)               │
│    └── PrimeDistributionPage (Distribution primes)              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7bis. Calendrier de Suivi - Flux de Données (CalendarDataService)

```
┌─────────────────────────────────────────────────────────────────┐
│ MODULE 1: HCM PERFORMANCE PLAN                                  │
│ Page 14/15/16: Priority Actions N+1, N+2, N+3                   │
│                                                                 │
│ Données OBJECTIFS (OBJ):                                        │
│   gainsN1/N2/N3 = Total économies prévues annuel (en k€)        │
│   indicatorRates = Répartition % par indicateur                 │
│   priorityActionsNx = Distribution par ligne d'activité         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼ (via CalculatedMetricsService)
┌─────────────────────────────────────────────────────────────────┐
│ CalendarDataService.ts (Module 3)                               │
│ ============================================                    │
│                                                                 │
│ getWeeklyObjectives(yearOffset):                                │
│   OBJ_hebdo = gainsNx / 52 semaines                             │
│   byIndicator = OBJ_hebdo × indicatorRate%                      │
│                                                                 │
│ getWeeklyRealized(periodStart, periodEnd):                      │
│   RÉAL = SUM(compensation_amount) from module3_cost_entries     │
│   filtré par period_start/period_end                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ PerformanceCalendarPage.tsx                                     │
│                                                                 │
│ Semaine X:                                                      │
│   OBJ: {total} ← CalendarDataService.getWeeklyObjectives()      │
│   RÉAL: {total} ← module3_cost_entries (via getRealWeekData)    │
│   Progress: RÉAL / OBJ × 100%                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Formule OBJ hebdomadaire:**
```typescript
OBJ_hebdo = gainsNx / 52
// Où gainsNx provient de calculated_metrics (metric_type='gains', fiscal_year)
```

---

## 8. Tables Supabase Impliquées

| Table | Rôle | Colonnes Clés |
|-------|------|---------------|
| `module3_cost_entries` | Coûts saisis (RÉAL) | kpi_type, duration_*, compensation_amount, period_* |
| `calculated_metrics` | Objectifs Priority Actions (OBJ) | metric_type='gains', fiscal_year, value_total |
| `company_ppr_settings` | Objectifs PPR legacy | ppr_abs_weekly, ppr_qd_weekly, ppr_oa_weekly, ppr_ddp_weekly, ppr_ekh_weekly |
| `company_performance_scores` | Données financières | factors.financialHistory.sales, factors.financialHistory.spending |
| `employees` | Membres équipes | incapacity_rate, versatility_f1/f2/f3 |
| `business_lines` | Lignes d'activité | activity_name, team_leader |
| `teams` | Équipes | business_line_id |

---

## 9. Règles de Validation

### 9.1 Cohérence des Unités

| Donnée | Unité | Conversion |
|--------|-------|------------|
| PPR (Page 14) | k€ | × 1000 → € |
| Score Financier | € | - |
| Pertes Constatées | € | - |
| Économies | € | - |
| Temps | Heures décimales | h + min/60 |

### 9.2 Contraintes

- `Économies ≥ 0` (pas de valeurs négatives)
- `Pertes ≥ 0` (pas de valeurs négatives)
- `Coefficient Polyvalence ∈ [0, 1]`
- `TAUX_TRESORERIE + TAUX_PRIMES = 1.00`

---

## 10. Fichiers Source

| Fichier | Rôle |
|---------|------|
| `src/modules/module3/engine/calculationEngine.ts` | Moteur de calcul principal |
| `src/modules/module3/PerformanceRecapPage.tsx` | Page récapitulatif + formules |
| `src/modules/module3/hooks/usePerformanceCalculations.ts` | Hook de calcul |
| `src/modules/module3/services/PerformanceCacheService.ts` | Service de cache |

---

## 11. Synthèse Performance - Formules de Distribution

### 11.1 Vue d'Ensemble des Colonnes

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    SYNTHÈSE PERFORMANCE - COLONNES                          │
├────────────────────────────────────────────────────────────────────────────┤
│ COL 1: Nom du salarié                                                       │
│ COL 2: Ligne d'activité                                                     │
│ COL 3: Scores - Pertes constatées en %                                     │
│ COL 4: Part Prime (contribution salarié)                                   │
│ COL 5: Part Trésorerie (contribution salarié)                              │
│ COL 6: Contribution % au résultat commun                                   │
│ COL 7: Tranche Note salarié en %                                           │
│ COL 8: Tri-Tranche Note salarié                                            │
│ COL 9: Tri N°2-Tranche Note salarié                                        │
│ COL 10: Score-Prime TOTAL                                                  │
│ COL 11: Score Note total en %                                              │
│ COL 12: Total Économies Réalisées du salarié                               │
│ COL 13-17: Taux économie par indicateur (ABS, QD, OA, DDP, EKH)           │
│ COL 18: Total taux économie                                                │
└────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Taux Économie par Indicateur (Colonnes 13-17)

**Formule Excel**: `=IF(ISERROR((K6+AA6)/FI6),0,((K6+AA6)/FI6))`

```typescript
// K6 = economiesRealisees N1 de l'indicateur
// AA6 = economiesRealisees N2 de l'indicateur
// FI6 = empTotalEco (Total Économies du salarié)

const calculateTauxEcoByIndicator = (
  economiesN1: number,      // K6 - Économies N1 de l'indicateur
  economiesN2: number,      // AA6 - Économies N2 de l'indicateur
  totalEcoSalarie: number   // FI6 - Total économies du salarié
): number => {
  // Plafonner à 0 minimum (pas de négatif)
  const ecoN1 = Math.max(0, economiesN1);
  const ecoN2 = Math.max(0, economiesN2);
  const eco = ecoN1 + ecoN2;

  // Ratio (pas pourcentage) - ex: 0.25 = 25%
  return totalEcoSalarie > 0 ? eco / totalEcoSalarie : 0;
};
```

**Résultat**: Ratio entre 0 et 1 (ex: 0.25 signifie que cet indicateur représente 25% des économies du salarié)

---

### 11.3 Total Taux Économie (Colonne 18)

**Formule Excel**: `=SUM(FJ6:FN6)`

```typescript
// Somme des ratios de tous les indicateurs
// Devrait être ~1.0 (100%) si calcul correct

const totalTauxEco = Object.values(tauxEcoByIndicator).reduce((a, b) => a + b, 0);
```

---

### 11.4 Scores Pertes en % (Colonne 3)

**Formule Excel**: `=(L6+AB6)+(AR6+BH6)+(BW6+CM6)+(DB6+DT6)+(EH6+ES6)`

```typescript
// Somme des pertes % de tous les indicateurs (N1 + N2)
// L6+AB6 = ABS N1+N2
// AR6+BH6 = QD N1+N2
// BW6+CM6 = OA N1+N2
// DB6+DT6 = DDP N1+N2
// EH6+ES6 = EKH N1+N2

const calculateScoresPertesEn = (
  employeeData: EmployeePerformance,
  indicateurs: Indicator[],
  indicatorTotalsMap: Record<string, IndicatorTotals>
): number => {
  return indicateurs.reduce((sum, ind) => {
    const data = getIndicatorData(employeeData, ind.key);
    const totalsRef = indicatorTotalsMap[ind.key];

    // Pertes N1 en %
    const pertesN1Pct = totalsRef.totalPertesReference > 0
      ? (data.pertesConstatees / totalsRef.totalPertesReference) * 100
      : 0;

    // Pertes N2 en %
    const pertesN2Pct = totalsRef.totalPertesReference > 0
      ? (data.pertesConstateesN2 / totalsRef.totalPertesReference) * 100
      : 0;

    return sum + pertesN1Pct + pertesN2Pct;
  }, 0);
};
```

---

### 11.5 Tranche Note Salarié (Colonne 7) ⚠️ CRITIQUE

**Formule Excel**: `=SI(EZ6<=10%;"100%";SI(EZ6<=33%;"60%";SI(EZ6<=54%;"30%";SI(EZ6<=79%;"10%";SI(EZ6>79%;"0%")))))`

```typescript
// EZ6 = scoresPertesEn (Scores Pertes en %)
// Système de tranches pour la distribution équitable

const calculateTrancheNote = (scoresPertesEn: number): number => {
  if (scoresPertesEn <= 10) return 100;   // Excellent (≤10% de pertes)
  if (scoresPertesEn <= 33) return 60;    // Très bon (≤33%)
  if (scoresPertesEn <= 54) return 30;    // Bon (≤54%)
  if (scoresPertesEn <= 79) return 10;    // Moyen (≤79%)
  return 0;                                // Faible (>79%)
};
```

**Tableau des Tranches**:

| Score Pertes % | Tranche Note | Interprétation |
|----------------|--------------|----------------|
| ≤ 10% | 100% | Excellent contributeur |
| ≤ 33% | 60% | Très bon contributeur |
| ≤ 54% | 30% | Bon contributeur |
| ≤ 79% | 10% | Contributeur moyen |
| > 79% | 0% | Faible contribution |

---

### 11.6 Tri-Tranche Note (Colonne 8)

**Formule Excel**: `=SI(EX6<>0;FD6;0)`

```typescript
// EX6 = employeeName (si salarié existe)
// FD6 = trancheNote

const calculateTriTrancheNote = (
  employeeExists: boolean,
  trancheNote: number
): number => {
  // TOUS les salariés existants participent à la distribution
  return employeeExists ? trancheNote : 0;
};
```

---

### 11.7 Score Note Total (Colonne 11 - NIVEAU TOTAL)

**Formule Excel**: `$FO$4 = SOMME(FF6:FF1705)`

```typescript
// Somme de tous les triN2TrancheNote de tous les salariés
// Utilisé comme dénominateur pour calculer la contribution %

const scoreNoteTotalPct = employeeScores.reduce(
  (sum, emp) => sum + emp.triN2TrancheNote,
  0
);
```

---

### 11.8 Contribution % au Résultat Commun (Colonne 6)

**Formule Excel**: `=IF(ISERROR(FF6/FH6),0,(FF6/FH6))`

```typescript
// FF6 = triN2TrancheNote du salarié
// FH6 = scoreNoteTotalPct (somme globale $FO$4)
// RÉSULTAT = ratio (ex: 0.05 = 5%)

const calculateContributionRatio = (
  triN2TrancheNote: number,     // FF6
  scoreNoteTotalPct: number     // FH6 = $FO$4
): number => {
  return scoreNoteTotalPct > 0
    ? triN2TrancheNote / scoreNoteTotalPct
    : 0;
};

// Pour affichage en pourcentage
const contributionPct = contributionRatio * 100;
```

---

### 11.9 Score-Prime TOTAL (Colonne 10)

**Formule Excel**: `=IF(EX6<>0,$FL$4,0)`

```typescript
// EX6 = employeeName (si salarié existe)
// $FL$4 = sortiesPrimes (33% des économies totales)

const calculateScorePrimeTotal = (
  employeeExists: boolean,
  sortiesPrimes: number     // 33% des économies totales
): number => {
  return employeeExists ? sortiesPrimes : 0;
};
```

---

### 11.10 Part Prime (Colonne 4)

**Formule Excel**: `=FG6*FC6`

```typescript
// FG6 = scorePrimeTotal (COLONNE 10)
// FC6 = contributionRatio (COLONNE 6 - ratio, pas pourcentage)

const calculatePartPrime = (
  scorePrimeTotal: number,      // FG6 = 33% des économies totales
  contributionRatio: number     // FC6 = ratio contribution du salarié
): number => {
  return scorePrimeTotal * contributionRatio;
};
```

---

### 11.11 Part Trésorerie (Colonne 5)

**Formule Excel**: `=$FK$4*FC6`

```typescript
// $FK$4 = fluxTresorerie (67% des économies totales = FI4*67%)
// FC6 = contributionRatio (COLONNE 6 - ratio)

const calculatePartTresorerie = (
  fluxTresorerie: number,       // $FK$4 = 67% des économies totales
  contributionRatio: number     // FC6 = ratio contribution du salarié
): number => {
  return fluxTresorerie * contributionRatio;
};
```

---

## 12. Distribution Primes par Indicateur

### 12.1 Vue d'Ensemble

La distribution des primes se fait **par indicateur** (ABS, QD, OA, DDP, EKH) pour chaque salarié.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                 DISTRIBUTION PRIMES - PAR INDICATEUR                        │
├────────────────────────────────────────────────────────────────────────────┤
│ Pour chaque indicateur (ABS, QD, OA, DDP):                                  │
│ ├── Prévisionnel Prime = PPR_PREVUES × 33%                                 │
│ ├── Prévisionnel Trésorerie = PPR_PREVUES × 67%                            │
│ ├── Réalisé Prime = Part_Prime × Taux_Eco_Indicateur                       │
│ └── Réalisé Trésorerie = Part_Trésorerie × Taux_Eco_Indicateur             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Prévisionnel Prime (par indicateur)

**Formule Excel**: `=PPR_PREVUES * 33%`

```typescript
// PPR_PREVUES = pprPrevues de l'indicateur pour le salarié

const calculatePrevisionnelPrime = (pprPrevues: number): number => {
  return pprPrevues * 0.33;
};
```

---

### 12.3 Prévisionnel Trésorerie (par indicateur)

**Formule Excel**: `=PPR_PREVUES * 67%`

```typescript
const calculatePrevisionnelTresorerie = (pprPrevues: number): number => {
  return pprPrevues * 0.67;
};
```

---

### 12.4 Réalisé Prime (par indicateur)

**Formule Excel**: `=FA6 * FJ6`

```typescript
// FA6 = partPrime (Part Prime globale du salarié - section 11.10)
// FJ6 = tauxEcoIndicateur (Taux économie de l'indicateur - section 11.2)

const calculateRealisePrime = (
  partPrime: number,           // FA6 - Part Prime globale du salarié
  tauxEcoIndicateur: number    // FJ6 - Ratio économie de cet indicateur
): number => {
  return partPrime * tauxEcoIndicateur;
};
```

---

### 12.5 Réalisé Trésorerie (par indicateur)

**Formule Excel**: `=FB6 * FJ6`

```typescript
// FB6 = partTresorerie (Part Trésorerie globale du salarié - section 11.11)
// FJ6 = tauxEcoIndicateur (Taux économie de l'indicateur - section 11.2)

const calculateRealiseTresorerie = (
  partTresorerie: number,      // FB6 - Part Trésorerie globale du salarié
  tauxEcoIndicateur: number    // FJ6 - Ratio économie de cet indicateur
): number => {
  return partTresorerie * tauxEcoIndicateur;
};
```

---

### 12.6 Flux de Calcul Complet - Distribution Primes

```
┌─────────────────────────────────────────────────────────────────┐
│ PASSE 1: Calculs par salarié                                    │
├─────────────────────────────────────────────────────────────────┤
│ 1. empTotalEco = Σ(economiesN1 + economiesN2) tous indicateurs │
│ 2. tauxEcoByIndicator[ind] = eco_ind / empTotalEco             │
│ 3. scoresPertesEn = Σ(pertesN1% + pertesN2%) tous indicateurs  │
│ 4. trancheNote = f(scoresPertesEn) → 100/60/30/10/0            │
│ 5. triTrancheNote = salarié existe ? trancheNote : 0           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ NIVEAU TOTAL                                                     │
├─────────────────────────────────────────────────────────────────┤
│ scoreNoteTotalPct = Σ(triTrancheNote) tous salariés            │
│ sortiesPrimes = totalEconomies × 33%                           │
│ fluxTresorerie = totalEconomies × 67%                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASSE 2: Distribution par salarié                               │
├─────────────────────────────────────────────────────────────────┤
│ 1. contributionRatio = triTrancheNote / scoreNoteTotalPct      │
│ 2. partPrime = sortiesPrimes × contributionRatio               │
│ 3. partTresorerie = fluxTresorerie × contributionRatio         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASSE 3: Distribution par indicateur                            │
├─────────────────────────────────────────────────────────────────┤
│ Pour chaque indicateur:                                         │
│ 1. réaliséPrime = partPrime × tauxEcoByIndicator[ind]          │
│ 2. réaliséTrésorerie = partTresorerie × tauxEcoByIndicator[ind]│
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Résumé des Formules Critiques

| Formule | Expression | Section |
|---------|------------|---------|
| Score Financier | `((Recettes - Dépenses) / Volume_H) × Temps` | 2.2 |
| Pertes Constatées | `(Score_Fin + Frais) - Taux_Incapacité` | 2.3 |
| Économies Réalisées | `PPR_Prévues - Pertes_Constatées` | 2.7 |
| Distribution Trésorerie | `Total_Économies × 67%` | 6.2 |
| Distribution Primes | `Total_Économies × 33%` | 6.2 |
| Coefficient EKH | `(F1 + F2 + F3) / 63` | 5.1 |
| Tranche Note | `f(scoresPertesEn) → 100/60/30/10/0` | 11.5 |
| Contribution % | `triTrancheNote / scoreNoteTotalPct` | 11.8 |
| Part Prime | `sortiesPrimes × contributionRatio` | 11.10 |
| Part Trésorerie | `fluxTresorerie × contributionRatio` | 11.11 |
| Réalisé Prime/Ind | `partPrime × tauxEcoIndicateur` | 12.4 |
| Réalisé Tréso/Ind | `partTresorerie × tauxEcoIndicateur` | 12.5 |

---

*Document maintenu par l'équipe LELE HCM - Dernière mise à jour: 7 Janvier 2026*
