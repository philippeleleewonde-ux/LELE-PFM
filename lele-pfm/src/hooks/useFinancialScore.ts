/**
 * useFinancialScore — Score Financier Dynamique (5 leviers comportementaux)
 *
 * Remplace le score statique du wizard (63/100) par un score recalcule
 * chaque semaine base sur 5 leviers :
 *
 * | Levier | Code | Poids | Couleur | Mesure |
 * |--------|------|-------|---------|--------|
 * | Regularite d'Epargne | REG | 25% | #4ADE80 | Constance hebdo (eco > 0) |
 * | Precision Budgetaire  | PRE | 25% | #60A5FA | Respect du budget |
 * | Securite Financiere   | SEC | 20% | #FDBA74 | Matelas cumule vs objectif |
 * | Efficience Revenus    | EFF | 15% | #A78BFA | Revenus reels vs prevus |
 * | Litteratie Financiere | LIT | 15% | #FBBF24 | Score EKH du wizard |
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePerformanceStore } from '@/stores/performance-store';
import { useEngineStore } from '@/stores/engine-store';
import { useChallengeStore } from '@/stores/challenge-store';
import { useIncomeStore } from '@/stores/income-store';
import { useTransactionStore } from '@/stores/transaction-store';
import { useSavingsWallet } from '@/hooks/useSavingsWallet';
import { getGradeFromNote } from '@/domain/calculators/weekly-savings-engine';
import { getCurrentWeek } from '@/utils/week-helpers';
import { INCOME_CATEGORIES, IncomeCode } from '@/constants/income-categories';
import { Grade } from '@/types';
import { QUARTERLY_WEIGHTS } from '@/constants/financial-quarters';

export interface LeverDetails {
  // REG (audit-grade — EWMA frequence, intensite epargne, serie comportementale)
  regWeeksWithSavings?: number;
  regTotalWeeks?: number;
  regEwmaFrequency?: number;       // EWMA(binary) λ=0.85 — frequence ponderee recence
  regAvgNote?: number;              // note moyenne (0-10) — intensite d'epargne
  regSavingsIntensity?: number;     // score intensite (0-100)
  regCurrentStreak?: number;        // serie consecutive actuelle
  regStreakScore?: number;          // score serie (0-100) courbe log
  regHasBeginnerBonus?: boolean;    // bonus debutant applique
  // PRE (audit-grade — classification OCDE 3 niveaux, penalite asymetrique)
  preAvgExecution?: number;         // taux d'execution moyen global (%)
  preBestWeek?: number;             // meilleur score hebdo
  preWorstWeek?: number;            // pire score hebdo
  // Incompressible (01-Alimentation, 03-Logement, 04-Sante)
  preRealizationIncomp?: number;    // R_incomp ratio agrege (0-N)
  preScoreIncomp?: number;          // S_incomp score (0-100)
  preWeightIncomp?: number;         // W_incomp poids monetaire (0-1)
  preTotalSpentIncomp8w?: number;   // depenses incompressibles cumulees 8 sem.
  preTotalBudgetIncomp8w?: number;  // budgets incompressibles cumules 8 sem.
  // Semi-essentiel (05-Transport, 06-Telecom, 08-Education)
  preRealizationSemi?: number;      // R_semi ratio agrege (0-N)
  preScoreSemi?: number;            // S_semi score (0-100)
  preWeightSemi?: number;           // W_semi poids monetaire (0-1)
  preTotalSpentSemi8w?: number;     // depenses semi-essentielles cumulees 8 sem.
  preTotalBudgetSemi8w?: number;    // budgets semi-essentiels cumules 8 sem.
  // Discretionnaire (02-Vetements, 07-Loisirs)
  preRealizationDisc?: number;      // R_disc ratio agrege (0-N)
  preScoreDisc?: number;            // S_disc score (0-100)
  preWeightDisc?: number;           // W_disc poids monetaire (0-1)
  preTotalSpentDisc8w?: number;     // depenses discretionnaires cumulees 8 sem.
  preTotalBudgetDisc8w?: number;    // budgets discretionnaires cumules 8 sem.
  preHasBeginnerBonus?: boolean;    // bonus debutant applique
  preHasBudget?: boolean;           // engine output disponible
  // Volatilite (penalite Markowitz/Basel III)
  preCvIncomp?: number;             // coefficient de variation incompressible (0-1+)
  preCvSemi?: number;               // coefficient de variation semi-essentiel
  preCvDisc?: number;               // coefficient de variation discretionnaire
  prePenaltyIncomp?: number;        // facteur de penalite incomp (0.80-1.00)
  prePenaltySemi?: number;          // facteur de penalite semi (0.80-1.00)
  prePenaltyDisc?: number;          // facteur de penalite disc (0.80-1.00)
  // SEC (audit-grade — prorata trimestriel, ratio de couverture, courbe par zones)
  secCumulEconomies?: number;       // epargne nette cumulee
  secObjectifAnnuel?: number;       // objectif EPR annuel
  secPlanYear?: number;             // annee du plan (1, 2, 3)
  secWeeksElapsed?: number;         // semaines ecoulees dans l'annee en cours
  secQuarter?: number;              // trimestre en cours (1-4)
  secProratedTarget?: number;       // objectif prorte (avec poids trimestriels)
  secCoverageRatio?: number;        // ratio de couverture (cumul / prorte)
  secHasBeginnerBonus?: boolean;    // bonus debutant applique
  // EFF (audit-grade — rolling 8 sem., decomposition Fixe/Variable, ratio agrege)
  effHasTargets?: boolean;              // income targets configures
  effNbWeeks?: number;                  // semaines dans la fenetre d'analyse
  effRealizationFixe?: number;          // R_fixe = SUM(actual)/SUM(expected) ratio agrege
  effRealizationVariable?: number;      // R_variable ratio agrege
  effScoreFixe?: number;                // S_fixe score (0-100) courbe stricte
  effScoreVariable?: number;            // S_variable score (0-100) courbe tolerante
  effWeightFixe?: number;               // W_fixe poids monetaire (0-1)
  effWeightVariable?: number;           // W_variable poids monetaire (0-1)
  effTotalActual8w?: number;            // revenus reels cumules 8 sem.
  effTotalExpected8w?: number;          // revenus prevus cumules 8 sem.
  effHasBeginnerBonus?: boolean;        // bonus debutant applique
  // LIT (audit-grade — OCDE/INFE, connaissances primaires)
  litEkhNorm?: number;              // score EKH normalise /100
  litChallengeScore?: number;       // score defis rolling 8 semaines
  litKnowledgeScore?: number;       // composante connaissances (60%)
  litEngagementScore?: number;      // composante engagement defis (25%)
  litProgressionScore?: number;     // composante progression curriculum (15%)
  litCompletedCount?: number;       // nombre de defis completes
  litTotalChallenges?: number;      // total challenges du curriculum (48)
  litKnowledgeFloor?: number;       // plancher = EKH × 0.50
  litFloorActive?: boolean;         // true si floor > base score
}

export interface LeverScore {
  code: 'REG' | 'PRE' | 'SEC' | 'EFF' | 'LIT';
  label: string;
  score: number;       // 0-100
  weight: number;      // 0.15-0.25
  color: string;
  description: string;
  details: LeverDetails;
}

export interface FinancialScoreResult {
  globalScore: number;           // 0-100
  grade: Grade;
  levers: LeverScore[];
  weeklyTrend: 'up' | 'down' | 'stable';
  previousScore: number | null;
}

// ─── Constants ───

const WINDOW = 8; // Rolling window of weeks

const LEVER_CONFIG = {
  REG: { weight: 0.25, color: '#4ADE80' },
  PRE: { weight: 0.25, color: '#60A5FA' },
  SEC: { weight: 0.20, color: '#FDBA74' },
  EFF: { weight: 0.15, color: '#A78BFA' },
  LIT: { weight: 0.15, color: '#FBBF24' },
} as const;

// ─── Hook ───

// Classification OCDE 3 niveaux (corrigee selon Engel, EU-SILC, Banque Mondiale, UNDP)
const COICOP_INCOMPRESSIBLE = ['01', '03', '04'] as const;    // Alimentation, Logement, Sante — besoins vitaux
const COICOP_SEMI_ESSENTIEL = ['05', '06', '08'] as const;    // Transport, Communications, Education — necessaires mais flexibles
const COICOP_DISCRETIONNAIRE = ['02', '07'] as const;          // Vetements, Loisirs — ajustables, epargne possible

export function useFinancialScore(): FinancialScoreResult {
  const { t: tp } = useTranslation('performance');
  const records = usePerformanceStore((s) => s.records);
  const engineOutput = useEngineStore((s) => s.engineOutput);
  const lastCalculatedAt = useEngineStore((s) => s.lastCalculatedAt);
  const challengeRolling8 = useChallengeStore((s) => s.getRolling8Score());
  const challengeCompletedCount = useChallengeStore((s) => s.getCompletedCount());
  const incomeTransactions = useIncomeStore((s) => s.incomes);
  const incomeTargets = useEngineStore((s) => s.incomeTargets);
  const getWeekTotalByCategory = useTransactionStore((s) => s.getWeekTotalByCategory);
  const allTransactions = useTransactionStore((s) => s.transactions);
  const wallet = useSavingsWallet();
  const { week: nowWeek, year: nowYear } = getCurrentWeek();

  return useMemo(() => {
    // Sort records by year desc, week desc and take recent window
    const sorted = [...records].sort(
      (a, b) => b.year - a.year || b.week_number - a.week_number,
    );
    const recentRecords = sorted.slice(0, WINDOW);
    const nbWeeks = recentRecords.length;

    // ── REG: Regularite d'Epargne (25%) — AUDIT GRADE ──
    // Standards : JP Morgan RiskMetrics (EWMA λ=0.85), Thaler (habits), Kahneman (intensity)
    // Formule : REG = EWMA_Frequency × 0.40 + Savings_Intensity × 0.30 + Streak_Value × 0.30
    let regScore: number;
    let regWeeksWithSavings = 0;
    let regHasBonus = false;
    let regEwma = 0;
    let regAvgNote = 0;
    let regIntensity = 0;
    let regStreak = 0;
    let regStreakVal = 0;

    if (nbWeeks === 0) {
      regScore = 0;
    } else {
      // Sort ascending (oldest → most recent) for EWMA
      const sortedAsc = [...recentRecords].sort(
        (a, b) => a.year - b.year || a.week_number - b.week_number,
      );

      regWeeksWithSavings = sortedAsc.filter((r) => r.economies > 0).length;

      // 2a. EWMA Frequency (40%) — RiskMetrics JP Morgan 1994
      // λ = 0.85 : most recent week weighs 85%, previous 12.75%, etc.
      const LAMBDA = 0.85;
      regEwma = sortedAsc[0].economies > 0 ? 1 : 0;
      for (let i = 1; i < sortedAsc.length; i++) {
        const binary = sortedAsc[i].economies > 0 ? 1 : 0;
        regEwma = LAMBDA * binary + (1 - LAMBDA) * regEwma;
      }
      const regEwmaScore = regEwma * 100;

      // 2b. Savings Intensity (30%) — Kahneman / EPR notation
      // avgNote = mean of notes (0-10), intensity = (avgNote / 10) × 100
      const notes = sortedAsc.map((r) => r.note ?? 0);
      regAvgNote = notes.reduce((s, n) => s + n, 0) / notes.length;
      regIntensity = (regAvgNote / 10) * 100;

      // 2c. Streak Value (30%) — Thaler Behavioral Finance
      // Count consecutive most-recent weeks with savings > 0
      const sortedDesc = [...recentRecords].sort(
        (a, b) => b.year - a.year || b.week_number - a.week_number,
      );
      regStreak = 0;
      for (const r of sortedDesc) {
        if (r.economies > 0) regStreak++;
        else break;
      }
      // Logarithmic curve: streakScore = MIN(100, streak × 15 + streak² × 0.5)
      regStreakVal = Math.min(100, regStreak * 15 + regStreak * regStreak * 0.5);

      // Composite: 40% EWMA + 30% Intensity + 30% Streak
      regScore = Math.round(regEwmaScore * 0.40 + regIntensity * 0.30 + regStreakVal * 0.30);

      // Bonus debutant si < 4 semaines de data
      if (nbWeeks < 4) {
        regScore = Math.min(100, regScore + 15);
        regHasBonus = true;
      }
    }

    // ── PRE: Precision Budgetaire (25%) — AUDIT GRADE (3 niveaux OCDE) ──
    // Classification : Incompressible / Semi-essentiel / Discretionnaire
    // Methode : ratio agrege SUM/SUM (actuariel), 3 courbes asymetriques
    // Standards : Engel, EU-SILC, Banque Mondiale, Kahneman Loss Aversion, ZBB McKinsey

    let preScore: number;
    let preAvgExecution = 0;
    let preBestWeek = 0;
    let preWorstWeek = 100;
    // 3 tiers
    let preRealizationIncomp: number | null = null;
    let preRealizationSemi: number | null = null;
    let preRealizationDisc: number | null = null;
    let preScoreIncomp: number | null = null;
    let preScoreSemi: number | null = null;
    let preScoreDisc: number | null = null;
    let preWeightIncomp = 1 / 3;
    let preWeightSemi = 1 / 3;
    let preWeightDisc = 1 / 3;
    let preTotalSpentIncomp8w = 0;
    let preTotalBudgetIncomp8w = 0;
    let preTotalSpentSemi8w = 0;
    let preTotalBudgetSemi8w = 0;
    let preTotalSpentDisc8w = 0;
    let preTotalBudgetDisc8w = 0;
    let preHasBeginnerBonus = false;
    let preCvIncomp = 0;
    let preCvSemi = 0;
    let preCvDisc = 0;
    let prePenaltyIncomp = 1.0;
    let prePenaltySemi = 1.0;
    let prePenaltyDisc = 1.0;
    const preHasBudget = !!(engineOutput && engineOutput.step10?.by_category);

    if (!preHasBudget || nbWeeks === 0) {
      preScore = 0;
    } else {
      const byCategory = engineOutput!.step10.by_category;
      const weeklyBudgetTotal = engineOutput!.step9.weekly_target_n1
        ? recentRecords[0]?.weeklyBudget ?? 0
        : 0;

      // M3 fix: guard against zero budget — no meaningful PRE score possible
      if (weeklyBudgetTotal <= 0) {
        preScore = 0;
      } else {

      // Budget par categorie (hebdo) depuis budget_rate
      const categoryBudgets: Record<string, number> = {};
      for (const [key, cat] of Object.entries(byCategory)) {
        categoryBudgets[key] = (cat.budget_rate / 100) * weeklyBudgetTotal;
      }

      // Agregation SUM/SUM rolling 8 semaines — 3 niveaux
      for (const r of recentRecords) {
        const catTotals = getWeekTotalByCategory(r.week_number, r.year);
        for (const code of COICOP_INCOMPRESSIBLE) {
          preTotalSpentIncomp8w += catTotals[code] ?? 0;
          preTotalBudgetIncomp8w += categoryBudgets[code] ?? 0;
        }
        for (const code of COICOP_SEMI_ESSENTIEL) {
          preTotalSpentSemi8w += catTotals[code] ?? 0;
          preTotalBudgetSemi8w += categoryBudgets[code] ?? 0;
        }
        for (const code of COICOP_DISCRETIONNAIRE) {
          preTotalSpentDisc8w += catTotals[code] ?? 0;
          preTotalBudgetDisc8w += categoryBudgets[code] ?? 0;
        }
      }

      // Ratios de realisation (SUM actual / SUM budget)
      preRealizationIncomp = preTotalBudgetIncomp8w > 0
        ? preTotalSpentIncomp8w / preTotalBudgetIncomp8w : null;
      preRealizationSemi = preTotalBudgetSemi8w > 0
        ? preTotalSpentSemi8w / preTotalBudgetSemi8w : null;
      preRealizationDisc = preTotalBudgetDisc8w > 0
        ? preTotalSpentDisc8w / preTotalBudgetDisc8w : null;

      // ─── INCOMPRESSIBLE (Alim, Logement, Sante) — ultra-strict ───
      // Besoins vitaux : le budget DOIT etre precis. Sweet spot 90-100%.
      // Leger depassement tolere (prix alimentaires, urgence sante).
      if (preRealizationIncomp !== null) {
        const R = preRealizationIncomp;
        if (R > 1.0) {
          // Depassement : -200 pts/% (modere — necessites peuvent fluctuer)
          preScoreIncomp = Math.max(0, Math.round(100 - (R - 1.0) * 200));
        } else if (R >= 0.90) {
          // 90-100% : quasi parfait → 85-100
          preScoreIncomp = Math.round(85 + (R - 0.90) / 0.10 * 15);
        } else if (R >= 0.75) {
          // 75-90% : sous-depense moderee → 50-85
          preScoreIncomp = Math.round(50 + (R - 0.75) / 0.15 * 35);
        } else {
          // < 75% : budget irrealiste → 0-50 proportionnel
          preScoreIncomp = Math.round((R / 0.75) * 50);
        }
      }

      // ─── SEMI-ESSENTIEL (Transport, Telecom, Education) — equilibre ───
      // Necessaires mais flexibles. Sweet spot 80-100%.
      if (preRealizationSemi !== null) {
        const R = preRealizationSemi;
        if (R > 1.0) {
          // Depassement : -200 pts/% (meme que incompressible)
          preScoreSemi = Math.max(0, Math.round(100 - (R - 1.0) * 200));
        } else if (R >= 0.80) {
          // 80-100% : zone optimale → 80-100
          preScoreSemi = Math.round(80 + (R - 0.80) / 0.20 * 20);
        } else if (R >= 0.55) {
          // 55-80% : economie possible (covoiturage, forfait reduit) → 40-80
          preScoreSemi = Math.round(40 + (R - 0.55) / 0.25 * 40);
        } else {
          // < 55% : budget surestime → 0-40 proportionnel
          preScoreSemi = Math.round((R / 0.55) * 40);
        }
      }

      // ─── DISCRETIONNAIRE (Vetements, Loisirs) — savings-aligned ───
      // Moins tu depenses, plus tu epargnes. Score decroissant lineaire.
      // Depassement inacceptable (zero tolerance), sous-depense recompensee.
      if (preRealizationDisc !== null) {
        const R = preRealizationDisc;
        if (R > 1.0) {
          // Depassement : -333 pts/% (zero tolerance — echec de discipline)
          preScoreDisc = Math.max(0, Math.round(100 - (R - 1.0) * 333));
        } else {
          // 0-100% : decroissant lineaire (R=0 → 100, R=1.0 → 60)
          // Aligne avec philosophie EPR : epargner = bien
          preScoreDisc = Math.round(100 - R * 40);
        }
      }

      // ─── PENALITE DE VOLATILITE (Markowitz / Basel III) ───
      // CV = ecart-type(R_sem) / moyenne(R_sem) — coefficient de variation par tier
      // penaltyFactor = MAX(0.80, 1.0 - CV × 0.5) — floor a -20% max
      // Applique seulement si >= 3 semaines de donnees (CV statistiquement significatif)

      // Calcul des ratios par semaine par tier
      const weekRatiosIncomp: number[] = [];
      const weekRatiosSemi: number[] = [];
      const weekRatiosDisc: number[] = [];

      for (const r of recentRecords) {
        const catTotals = getWeekTotalByCategory(r.week_number, r.year);
        let spentI = 0, budgetI = 0, spentS = 0, budgetS = 0, spentD = 0, budgetD = 0;
        for (const code of COICOP_INCOMPRESSIBLE) {
          spentI += catTotals[code] ?? 0;
          budgetI += categoryBudgets[code] ?? 0;
        }
        for (const code of COICOP_SEMI_ESSENTIEL) {
          spentS += catTotals[code] ?? 0;
          budgetS += categoryBudgets[code] ?? 0;
        }
        for (const code of COICOP_DISCRETIONNAIRE) {
          spentD += catTotals[code] ?? 0;
          budgetD += categoryBudgets[code] ?? 0;
        }
        if (budgetI > 0) weekRatiosIncomp.push(spentI / budgetI);
        if (budgetS > 0) weekRatiosSemi.push(spentS / budgetS);
        if (budgetD > 0) weekRatiosDisc.push(spentD / budgetD);
      }

      // Fonction CV : ecart-type / moyenne
      // M6 fix: bound CV to prevent extreme penalty values
      const computeCV = (ratios: number[]): number => {
        if (ratios.length < 3) return 0; // pas assez de data → pas de penalite
        const mean = ratios.reduce((s, v) => s + v, 0) / ratios.length;
        if (mean === 0) return 0;
        const variance = ratios.reduce((s, v) => s + (v - mean) ** 2, 0) / ratios.length;
        return Math.min(10, Math.sqrt(variance) / mean);
      };

      preCvIncomp = computeCV(weekRatiosIncomp);
      preCvSemi = computeCV(weekRatiosSemi);
      preCvDisc = computeCV(weekRatiosDisc);

      // Facteurs de penalite (floor 0.80 = -20% max)
      prePenaltyIncomp = Math.max(0.80, 1.0 - preCvIncomp * 0.5);
      prePenaltySemi = Math.max(0.80, 1.0 - preCvSemi * 0.5);
      prePenaltyDisc = Math.max(0.80, 1.0 - preCvDisc * 0.5);

      // Appliquer la penalite aux scores des tiers
      if (preScoreIncomp !== null) preScoreIncomp = Math.round(preScoreIncomp * prePenaltyIncomp);
      if (preScoreSemi !== null) preScoreSemi = Math.round(preScoreSemi * prePenaltySemi);
      if (preScoreDisc !== null) preScoreDisc = Math.round(preScoreDisc * prePenaltyDisc);

      // Ponderation monetaire (budget-proportionnelle, Markowitz)
      const totalBudget8w = preTotalBudgetIncomp8w + preTotalBudgetSemi8w + preTotalBudgetDisc8w;
      if (totalBudget8w > 0) {
        preWeightIncomp = preTotalBudgetIncomp8w / totalBudget8w;
        preWeightSemi = preTotalBudgetSemi8w / totalBudget8w;
        preWeightDisc = preTotalBudgetDisc8w / totalBudget8w;
      }

      // Score pondere (apres penalite volatilite)
      const sI = preScoreIncomp ?? 0;
      const sS = preScoreSemi ?? 0;
      const sD = preScoreDisc ?? 0;
      preScore = Math.round(sI * preWeightIncomp + sS * preWeightSemi + sD * preWeightDisc);

      // Bonus debutant : +15 pts si < 4 semaines de donnees
      if (nbWeeks < 4) {
        preScore = Math.min(100, preScore + 15);
        preHasBeginnerBonus = true;
      }

      // Taux d'execution global pour affichage
      const totalSpent8w = preTotalSpentIncomp8w + preTotalSpentSemi8w + preTotalSpentDisc8w;
      if (totalBudget8w > 0) {
        preAvgExecution = Math.round((totalSpent8w / totalBudget8w) * 100);
      }

      // Score par semaine (best/worst simplifie)
      const weekScores = recentRecords.map((r) => {
        if (r.weeklyBudget <= 0) return 50;
        const ratio = r.weeklySpent / r.weeklyBudget;
        if (ratio > 1.0) return Math.max(0, Math.round(100 - (ratio - 1.0) * 250));
        if (ratio >= 0.90) return 100;
        if (ratio >= 0.75) return Math.round(60 + (ratio - 0.75) / 0.15 * 40);
        return Math.round((ratio / 0.75) * 60);
      });
      if (weekScores.length > 0) {
        preBestWeek = Math.max(...weekScores);
        preWorstWeek = Math.min(...weekScores);
      }
      } // end M3 weeklyBudgetTotal > 0
    }

    // ── SEC: Securite Financiere (20%) — AUDIT GRADE ──
    // Methode : ratio de couverture avec prorata trimestriel (standard actuariel)
    // Courbe de scoring par zones (equivalent notation S&P / Basel III)

    let secScore: number;
    const cumulEconomies = wallet.allTimeNet;

    // Determine plan year and weeks elapsed from calculatedAt
    let planYear = 1;
    let weeksElapsedTotal = 0;
    if (lastCalculatedAt) {
      // H3 fix: guard against negative elapsed time (device clock drift)
      const msElapsed = Math.max(0, Date.now() - new Date(lastCalculatedAt).getTime());
      weeksElapsedTotal = Math.floor(msElapsed / (7 * 24 * 60 * 60 * 1000));
      const monthsElapsed = Math.floor(msElapsed / (30.44 * 24 * 60 * 60 * 1000));
      if (monthsElapsed >= 24) planYear = 3;
      else if (monthsElapsed >= 12) planYear = 2;
    }

    // Weeks elapsed in current plan year (modulo 48, engine convention)
    const secWeeksInYear = Math.max(1, weeksElapsedTotal % 48 || (weeksElapsedTotal > 0 ? 48 : 1));
    const secQuarter = secWeeksInYear <= 12 ? 1 : secWeeksInYear <= 24 ? 2 : secWeeksInYear <= 36 ? 3 : 4;

    const objectifAnnuel = engineOutput
      ? planYear === 3
        ? engineOutput.step9.epr_n3
        : planYear === 2
          ? engineOutput.step9.epr_n2
          : engineOutput.step9.epr_n1
      : 0;

    // Prorated target using quarterly weights (actuarial ramp-up schedule)
    const SEC_QUARTERLY_WEIGHTS = QUARTERLY_WEIGHTS;
    const SEC_WEEKS_PER_Q = 12;
    let secProrata = 0;
    {
      let remaining = secWeeksInYear;
      for (const qw of SEC_QUARTERLY_WEIGHTS) {
        if (remaining <= 0) break;
        const weeksInQ = Math.min(remaining, SEC_WEEKS_PER_Q);
        secProrata += qw * (weeksInQ / SEC_WEEKS_PER_Q);
        remaining -= weeksInQ;
      }
    }
    const proratedTarget = objectifAnnuel * secProrata;

    // Coverage ratio and scoring
    let secCoverageRatio = 0;
    let secHasBeginnerBonus = false;

    if (objectifAnnuel <= 0) {
      // No EPR target = risk factor (Basel III: non-compliance penalty)
      secScore = 40;
    } else if (cumulEconomies < 0) {
      // Negative savings = score 0
      secScore = 0;
      secCoverageRatio = 0;
    } else {
      secCoverageRatio = proratedTarget > 0 ? cumulEconomies / proratedTarget : (cumulEconomies > 0 ? 1.5 : 0);

      // Scoring curve by zones (S&P / Basel III equivalent)
      if (secCoverageRatio >= 1.20) {
        secScore = 100;                                                                   // AAA — nettement en avance
      } else if (secCoverageRatio >= 1.00) {
        secScore = Math.round(85 + ((secCoverageRatio - 1.00) / 0.20) * 15);             // AA/A — en avance
      } else if (secCoverageRatio >= 0.70) {
        secScore = Math.round(55 + ((secCoverageRatio - 0.70) / 0.30) * 30);             // BBB/BB — retard modere
      } else if (secCoverageRatio >= 0.40) {
        secScore = Math.round(25 + ((secCoverageRatio - 0.40) / 0.30) * 30);             // B/CCC — en retard
      } else {
        secScore = Math.round((secCoverageRatio / 0.40) * 25);                            // CC/D — critique
      }

      // Beginner bonus (< 4 weeks into plan)
      if (secWeeksInYear < 4) {
        secScore = Math.min(100, secScore + 15);
        secHasBeginnerBonus = true;
      }
    }

    // ── EFF: Efficience des Revenus (15%) — AUDIT GRADE ──
    // Methode : decomposition Fixe/Variable, rolling 8 semaines
    // Ratio agrege SUM(actual) / SUM(expected) — standard actuariel
    // Courbes de scoring differenciees par type de revenu

    // Build week set from performance records + current week
    const effWeekSet = new Map<string, { week: number; year: number }>();
    for (const r of recentRecords) {
      effWeekSet.set(`${r.year}-${r.week_number}`, { week: r.week_number, year: r.year });
    }
    if (!effWeekSet.has(`${nowYear}-${nowWeek}`)) {
      effWeekSet.set(`${nowYear}-${nowWeek}`, { week: nowWeek, year: nowYear });
    }
    const effWeeks = Array.from(effWeekSet.values());
    const nbEffWeeks = effWeeks.length;

    // Compute weekly expected per source from engine targets
    const weeklyExpBySource: Record<string, number> = {};
    if (incomeTargets) {
      for (const [code, target] of Object.entries(incomeTargets)) {
        const monthly = (target as { monthlyAmount?: number }).monthlyAmount ?? 0;
        if (monthly > 0) weeklyExpBySource[code] = Math.round(monthly / (52 / 12));
      }
    }

    // Aggregate actual vs expected over rolling window, by income type
    let totalFixeActual8w = 0;
    let totalFixeExpected8w = 0;
    let totalVariableActual8w = 0;
    let totalVariableExpected8w = 0;

    for (const { week: w, year: y } of effWeeks) {
      const weekIncs = incomeTransactions.filter(
        (inc) => inc.week_number === w && inc.year === y,
      );

      // Sum actual income by type
      for (const inc of weekIncs) {
        const cat = INCOME_CATEGORIES[inc.source as IncomeCode];
        if (!cat) continue;
        if (cat.type === 'Fixe') totalFixeActual8w += inc.amount;
        else totalVariableActual8w += inc.amount;
      }

      // Sum expected income by type for this week
      for (const [code, weeklyExp] of Object.entries(weeklyExpBySource)) {
        const cat = INCOME_CATEGORIES[code as IncomeCode];
        if (!cat) continue;
        if (cat.type === 'Fixe') totalFixeExpected8w += weeklyExp;
        else totalVariableExpected8w += weeklyExp;
      }
    }

    // Aggregate realization ratios (actuarial: SUM/SUM)
    const R_fixe = totalFixeExpected8w > 0 ? totalFixeActual8w / totalFixeExpected8w : null;
    const R_variable = totalVariableExpected8w > 0 ? totalVariableActual8w / totalVariableExpected8w : null;

    // Scoring curves (piecewise linear, differentiated by type)
    // Fixed income: high predictability expected — strict curve
    const scoreFixeRevenu = (r: number): number => {
      if (r >= 1.0) return 100;
      if (r >= 0.90) return 80 + ((r - 0.90) / 0.10) * 20;   // 90-100% → 80-100
      if (r >= 0.70) return 40 + ((r - 0.70) / 0.20) * 40;   // 70-90% → 40-80
      return (r / 0.70) * 40;                                  // 0-70% → 0-40
    };
    // Variable income: higher variance tolerated — tolerant curve
    const scoreVariableRevenu = (r: number): number => {
      if (r >= 1.0) return 100;
      if (r >= 0.80) return 70 + ((r - 0.80) / 0.20) * 30;   // 80-100% → 70-100
      if (r >= 0.50) return 30 + ((r - 0.50) / 0.30) * 40;   // 50-80% → 30-70
      return (r / 0.50) * 30;                                  // 0-50% → 0-30
    };

    const S_fixe = R_fixe !== null ? scoreFixeRevenu(R_fixe) : null;
    const S_variable = R_variable !== null ? scoreVariableRevenu(R_variable) : null;

    // Monetary-weighted composite
    const totalExpected8w = totalFixeExpected8w + totalVariableExpected8w;
    const totalActual8w = totalFixeActual8w + totalVariableActual8w;
    const effHasTargets = totalExpected8w > 0;

    let effScore: number;
    let effW_fixe = 0;
    let effW_variable = 0;

    if (!effHasTargets) {
      // No targets configured — score based on income tracking behavior
      const hasAnyIncome = incomeTransactions.some((inc) =>
        effWeeks.some((w) => inc.week_number === w.week && inc.year === w.year),
      );
      effScore = hasAnyIncome ? 60 : 50;
    } else if (S_fixe !== null && S_variable !== null) {
      effW_fixe = totalFixeExpected8w / totalExpected8w;
      effW_variable = totalVariableExpected8w / totalExpected8w;
      effScore = Math.round(S_fixe * effW_fixe + S_variable * effW_variable);
    } else if (S_fixe !== null) {
      effW_fixe = 1;
      effScore = Math.round(S_fixe);
    } else if (S_variable !== null) {
      effW_variable = 1;
      effScore = Math.round(S_variable);
    } else {
      effScore = 50;
    }

    // Beginner bonus (< 4 weeks of data)
    let effHasBeginnerBonus = false;
    if (nbEffWeeks < 4 && effHasTargets) {
      effScore = Math.min(100, effScore + 15);
      effHasBeginnerBonus = true;
    }

    // ── LIT: Litteratie Financiere (15%) — AUDIT GRADE ──
    // Standards : OCDE/INFE Financial Literacy Framework, PISA, Basel Committee
    // Formule : LIT = MAX(base, EKH × 0.50)
    //           base = Knowledge × 0.60 + Engagement × 0.25 + Progression × 0.15
    let litScore: number;
    let litEkhNorm = 0;
    let litKnowledge = 0;
    let litEngagement = challengeRolling8;
    let litProgression = 0;
    let litFloor = 0;
    let litFloorActive = false;

    if (!engineOutput) {
      litScore = 0;
    } else {
      // Get EKH base from engine
      const byIndicator = Array.isArray(engineOutput.step10.by_indicator)
        ? engineOutput.step10.by_indicator
        : [];
      const litIndicator = byIndicator.find(
        (ind: any) => ind.code === 'LIT',
      );
      if (litIndicator) {
        litEkhNorm = Math.round(100 - litIndicator.rawWeight);
      } else {
        litEkhNorm = Math.round(engineOutput.globalScore * 0.6);
      }

      // 3a. Knowledge (60%) — OCDE/INFE primary pillar
      litKnowledge = litEkhNorm;

      // 3b. Engagement (25%) — weekly challenges rolling 8
      // litEngagement already set to challengeRolling8

      // 3c. Progression (15%) — curriculum advancement
      litProgression = Math.min(100, (challengeCompletedCount / 48) * 100);

      // 3d. Knowledge Floor — expert protection
      const litBase = litKnowledge * 0.60 + litEngagement * 0.25 + litProgression * 0.15;
      litFloor = litEkhNorm * 0.70;
      litFloorActive = litFloor > litBase;
      litScore = Math.round(Math.max(litBase, litFloor));
    }

    // ── Score global ──
    const globalScore = Math.round(
      regScore * LEVER_CONFIG.REG.weight +
      preScore * LEVER_CONFIG.PRE.weight +
      secScore * LEVER_CONFIG.SEC.weight +
      effScore * LEVER_CONFIG.EFF.weight +
      litScore * LEVER_CONFIG.LIT.weight,
    );

    const grade = getGradeFromNote(Math.round(globalScore / 10));

    // Build lever array with details
    const levers: LeverScore[] = [
      { code: 'REG', score: regScore, ...LEVER_CONFIG.REG, label: tp('leverShort.REG'), description: tp('leverDescs.REG'), details: {
        regWeeksWithSavings,
        regTotalWeeks: nbWeeks,
        regEwmaFrequency: Math.round(regEwma * 100),
        regAvgNote: Math.round(regAvgNote * 10) / 10,
        regSavingsIntensity: Math.round(regIntensity),
        regCurrentStreak: regStreak,
        regStreakScore: Math.round(regStreakVal),
        regHasBeginnerBonus: regHasBonus,
      }},
      { code: 'PRE', score: preScore, ...LEVER_CONFIG.PRE, label: tp('leverShort.PRE'), description: tp('leverDescs.PRE'), details: {
        preAvgExecution,
        preBestWeek,
        preWorstWeek,
        preRealizationIncomp: preRealizationIncomp !== null ? Math.round(preRealizationIncomp * 100) / 100 : undefined,
        preScoreIncomp: preScoreIncomp !== null ? Math.round(preScoreIncomp) : undefined,
        preWeightIncomp: Math.round(preWeightIncomp * 100) / 100,
        preTotalSpentIncomp8w,
        preTotalBudgetIncomp8w,
        preRealizationSemi: preRealizationSemi !== null ? Math.round(preRealizationSemi * 100) / 100 : undefined,
        preScoreSemi: preScoreSemi !== null ? Math.round(preScoreSemi) : undefined,
        preWeightSemi: Math.round(preWeightSemi * 100) / 100,
        preTotalSpentSemi8w,
        preTotalBudgetSemi8w,
        preRealizationDisc: preRealizationDisc !== null ? Math.round(preRealizationDisc * 100) / 100 : undefined,
        preScoreDisc: preScoreDisc !== null ? Math.round(preScoreDisc) : undefined,
        preWeightDisc: Math.round(preWeightDisc * 100) / 100,
        preTotalSpentDisc8w,
        preTotalBudgetDisc8w,
        preHasBeginnerBonus,
        preHasBudget,
        preCvIncomp: Math.round(preCvIncomp * 1000) / 1000,
        preCvSemi: Math.round(preCvSemi * 1000) / 1000,
        preCvDisc: Math.round(preCvDisc * 1000) / 1000,
        prePenaltyIncomp: Math.round(prePenaltyIncomp * 100) / 100,
        prePenaltySemi: Math.round(prePenaltySemi * 100) / 100,
        prePenaltyDisc: Math.round(prePenaltyDisc * 100) / 100,
      }},
      { code: 'SEC', score: secScore, ...LEVER_CONFIG.SEC, label: tp('leverShort.SEC'), description: tp('leverDescs.SEC'), details: {
        secCumulEconomies: cumulEconomies,
        secObjectifAnnuel: objectifAnnuel,
        secPlanYear: planYear,
        secWeeksElapsed: secWeeksInYear,
        secQuarter: secQuarter,
        secProratedTarget: Math.round(proratedTarget),
        secCoverageRatio: Math.round(secCoverageRatio * 100) / 100,
        secHasBeginnerBonus,
      }},
      { code: 'EFF', score: effScore, ...LEVER_CONFIG.EFF, label: tp('leverShort.EFF'), description: tp('leverDescs.EFF'), details: {
        effHasTargets,
        effNbWeeks: nbEffWeeks,
        effRealizationFixe: R_fixe !== null ? Math.round(R_fixe * 100) / 100 : undefined,
        effRealizationVariable: R_variable !== null ? Math.round(R_variable * 100) / 100 : undefined,
        effScoreFixe: S_fixe !== null ? Math.round(S_fixe) : undefined,
        effScoreVariable: S_variable !== null ? Math.round(S_variable) : undefined,
        effWeightFixe: Math.round(effW_fixe * 100) / 100,
        effWeightVariable: Math.round(effW_variable * 100) / 100,
        effTotalActual8w: totalActual8w,
        effTotalExpected8w: totalExpected8w,
        effHasBeginnerBonus,
      }},
      { code: 'LIT', score: litScore, ...LEVER_CONFIG.LIT, label: tp('leverShort.LIT'), description: tp('leverDescs.LIT'), details: {
        litEkhNorm,
        litChallengeScore: challengeRolling8,
        litKnowledgeScore: Math.round(litKnowledge),
        litEngagementScore: Math.round(litEngagement),
        litProgressionScore: Math.round(litProgression),
        litCompletedCount: challengeCompletedCount,
        litTotalChallenges: 48,
        litKnowledgeFloor: Math.round(litFloor),
        litFloorActive,
      }},
    ];

    // ── Trend ──
    // Find previous week's record with financialScore
    let previousScore: number | null = null;
    let weeklyTrend: 'up' | 'down' | 'stable' = 'stable';

    // Get second-latest record (first is current week if saved)
    const prevRecord = sorted.length > 1 ? sorted[1] : null;
    if (prevRecord && typeof (prevRecord as any).financialScore === 'number') {
      previousScore = (prevRecord as any).financialScore;
      const diff = globalScore - previousScore!;
      if (diff > 3) weeklyTrend = 'up';
      else if (diff < -3) weeklyTrend = 'down';
    }

    return {
      globalScore,
      grade,
      levers,
      weeklyTrend,
      previousScore,
    };
  }, [records, engineOutput, lastCalculatedAt, challengeRolling8, challengeCompletedCount, incomeTransactions, incomeTargets, allTransactions, wallet.allTimeNet, nowWeek, nowYear, tp]);
}
