/**
 * Weekly Savings Engine — LELE PFM
 *
 * Adapted from HCM Module 3 for personal finance.
 *
 * KEY CONCEPTS:
 *   Budget    = Reste à vivre hebdo (plafond de DEPENSE)
 *   Target    = Objectif d'EPARGNE hebdo (weekly_target_n1 = EPR / 48)
 *   Spent     = Dépenses réelles de la semaine
 *
 * FORMULAS:
 *   Économies réelles   = MAX(0, Budget - Dépensé)               — ce qu'on a vraiment économisé
 *   EPR provision       = MIN(Économies, Target)                  — cashback minimum garanti (plancher)
 *   Surplus             = MAX(0, Économies - Target)              — capital libre au-dessus de l'EPR
 *   Dépassement         = MAX(0, Dépensé - Budget)               — combien on a dépassé le budget
 *   Note                = MIN(10, (EPR provision / Target) × 10)  — 0-10 scale (mesure discipline EPR)
 *   Grade               = mapping note → A+ to E
 *   Distribution        : 67% épargne, 33% discrétionnaire — appliquée sur économies TOTALES
 *
 * LOGIQUE FINANCE PERSONNELLE (vs HCM corporate):
 *   - L'EPR est un PLANCHER minimum (provision obligatoire), PAS un plafond
 *   - Le surplus au-dessus de l'EPR est du capital libre, il ne doit pas disparaître
 *   - La distribution 67/33 s'applique aux économies TOTALES (pas uniquement l'EPR)
 *   - La note mesure la discipline (atteinte du target EPR), pas le montant total
 */

import { Grade, COICOPCode } from '@/types';

// ─── Grade mapping (note 0-10 → Grade) — aligné HCM performanceCenter.ts:207 ───

const NOTE_TO_GRADE: Record<number, Grade> = {
  10: 'A+',
  9: 'A+',
  8: 'A',
  7: 'B',
  6: 'C',
  5: 'D',
  4: 'D',
  3: 'E',
  2: 'E',
  1: 'E',
  0: 'E',
};

// ─── Distribution ratios — HCM performanceCenter.ts:28-32 ───
const EPARGNE_RATIO = 0.67;       // 67% → Trésorerie/Épargne
const DISCRETIONNAIRE_RATIO = 0.33; // 33% → Primes/Discrétionnaire

// ─── Interfaces ───

export interface WeeklySavingsResult {
  /** Budget variable de la semaine (plafond de dépense) */
  weeklyBudget: number;
  /** Objectif d'épargne de la semaine */
  weeklyTarget: number;
  /** Économies réelles = MAX(0, budget - spent) */
  economies: number;
  /** Économies totales = economies (pas de cap — finance personnelle) */
  economiesCappees: number;
  /** Provision EPR = MIN(économies, target) — cashback minimum garanti */
  eprProvision: number;
  /** Surplus = MAX(0, économies - target) — capital libre au-dessus de l'EPR */
  surplus: number;
  /** Dépassement = MAX(0, spent - budget) */
  depassement: number;
  /** Note globale 0-10 — basée sur eprProvision / target (mesure discipline) */
  note: number;
  /** Grade A+ to E */
  grade: Grade;
  /** Part épargne des économies totales */
  epargne: number;
  /** Part investissement des économies totales (0 si pas investisseur) */
  investissement: number;
  /** Part discrétionnaire des économies totales */
  discretionnaire: number;
  /** Budget respecté (spent ≤ budget) */
  budgetRespecte: boolean;
  /** Taux d'exécution du budget (spent / budget × 100) */
  tauxExecution: number;
}

export interface CategorySavingsResult {
  code: COICOPCode;
  catBudget: number;
  economies: number;
  economiesCappees: number;
  eprProvision: number;
  surplus: number;
  depassement: number;
  note: number;
  grade: Grade;
  epargne: number;
  investissement: number;
  discretionnaire: number;
  budgetRespecte: boolean;
  tauxExecution: number;
}

export interface PeriodSavingsResult {
  /** Total économies cappées sur la période */
  totalEconomies: number;
  /** Total dépassement */
  totalDepassement: number;
  /** Économies nettes (économies - dépassement) */
  economiesNettes: number;
  /** Note moyenne pondérée */
  noteMoyenne: number;
  /** Grade moyen */
  gradeMoyen: Grade;
  /** Total épargne */
  totalEpargne: number;
  /** Total investissement */
  totalInvestissement: number;
  /** Total discrétionnaire */
  totalDiscretionnaire: number;
  /** Nombre de semaines incluses */
  nbSemaines: number;
  /** Semaines dans le budget */
  semainesDansBudget: number;
  /** Taux de respect du budget (%) */
  tauxRespectBudget: number;
}

// ─── Core calculations — parallèle HCM Module 3 ───

/**
 * Calculate weekly savings from budget, target, and actual spending.
 *
 * Parallèle HCM Module 3 (performanceCenter.ts):
 *   PPR (objectif) = weeklyTarget (combien économiser)
 *   Coûts réels    = weeklySpent (combien dépensé)
 *   Budget         = weeklyBudget (plafond de dépense = Reste à vivre hebdo)
 *   Économies      = MAX(0, Budget - Spent)
 *   Cap            = MIN(Économies, PPR) — Réalisé ≤ Prévu
 */
export function calculateWeeklySavings(
  weeklyBudget: number,
  weeklyTarget: number,
  weeklySpent: number,
  investmentRatio: number = 0,
): WeeklySavingsResult {
  if (weeklyBudget <= 0 || weeklyTarget <= 0) {
    return {
      weeklyBudget,
      weeklyTarget,
      economies: 0,
      economiesCappees: 0,
      eprProvision: 0,
      surplus: 0,
      depassement: 0,
      note: 0,
      grade: 'E',
      epargne: 0,
      investissement: 0,
      discretionnaire: 0,
      budgetRespecte: true,
      tauxExecution: 0,
    };
  }

  // Économies réelles = ce qu'on a vraiment économisé (budget - dépensé)
  const economies = Math.max(0, weeklyBudget - weeklySpent);

  // PFM: pas de cap — les économies totales sont préservées
  const economiesCappees = economies;

  // EPR provision = cashback minimum garanti (plancher, pas plafond)
  const eprProvision = Math.min(economies, weeklyTarget);

  // Surplus = capital libre au-dessus de l'objectif EPR
  const surplus = Math.max(0, economies - weeklyTarget);

  // Dépassement = combien au-dessus du budget
  const depassement = Math.max(0, weeklySpent - weeklyBudget);

  // Budget respecté = pas de dépassement
  const budgetRespecte = weeklySpent <= weeklyBudget;

  // Note = (EPR provision / objectif) × 10, cap 10
  // Mesure la DISCIPLINE vs target EPR (pas le montant total)
  const note = Math.min(10, Math.round((eprProvision / weeklyTarget) * 10));

  const grade = getGradeFromNote(note);

  // Distribution sur économies TOTALES (pas uniquement l'EPR)
  // Plus on économise, plus chaque ligne grossit
  const effectiveEpargneRatio = EPARGNE_RATIO - investmentRatio / 100;
  const investRatio = investmentRatio / 100;
  const epargne = Math.round(economies * effectiveEpargneRatio);
  const investissement = Math.round(economies * investRatio);
  const discretionnaire = Math.round(economies * DISCRETIONNAIRE_RATIO);

  // Taux d'exécution du budget
  const tauxExecution = Math.round((weeklySpent / weeklyBudget) * 100);

  return {
    weeklyBudget,
    weeklyTarget,
    economies,
    economiesCappees,
    eprProvision,
    surplus,
    depassement,
    note,
    grade,
    epargne,
    investissement,
    discretionnaire,
    budgetRespecte,
    tauxExecution,
  };
}

/**
 * Calculate savings for a single category.
 * catBudget = weekly budget for this category = weeklyBudget × budget_rate / 100
 * catTarget = savings target for this category = annual_target / 48
 */
export function calculateCategorySavings(
  code: COICOPCode,
  catBudget: number,
  catTarget: number,
  catSpent: number,
  investmentRatio: number = 0,
): CategorySavingsResult {
  if (catBudget <= 0 || catTarget <= 0) {
    return {
      code,
      catBudget,
      economies: 0,
      economiesCappees: 0,
      eprProvision: 0,
      surplus: 0,
      depassement: 0,
      note: 0,
      grade: 'E',
      epargne: 0,
      investissement: 0,
      discretionnaire: 0,
      budgetRespecte: true,
      tauxExecution: 0,
    };
  }

  const economies = Math.max(0, catBudget - catSpent);
  const economiesCappees = economies;
  const eprProvision = Math.min(economies, catTarget);
  const surplus = Math.max(0, economies - catTarget);
  const depassement = Math.max(0, catSpent - catBudget);
  const budgetRespecte = catSpent <= catBudget;
  const note = Math.min(10, Math.round((eprProvision / catTarget) * 10));
  const grade = getGradeFromNote(note);
  const effectiveEpargneRatio = EPARGNE_RATIO - investmentRatio / 100;
  const investRatio = investmentRatio / 100;
  const epargne = Math.round(economies * effectiveEpargneRatio);
  const investissement = Math.round(economies * investRatio);
  const discretionnaire = Math.round(economies * DISCRETIONNAIRE_RATIO);
  const tauxExecution = Math.round((catSpent / catBudget) * 100);

  return {
    code,
    catBudget,
    economies,
    economiesCappees,
    eprProvision,
    surplus,
    depassement,
    note,
    grade,
    epargne,
    investissement,
    discretionnaire,
    budgetRespecte,
    tauxExecution,
  };
}

/**
 * Map a note (0-10) to a Grade (A+ to E).
 * Parallèle HCM: calculateGrade() — performanceCenter.ts:203
 */
export function getGradeFromNote(note: number): Grade {
  const clamped = Math.max(0, Math.min(10, Math.round(note)));
  return NOTE_TO_GRADE[clamped] ?? 'E';
}

/**
 * Get grade color for display.
 */
export function getGradeColor(grade: Grade): string {
  switch (grade) {
    case 'A+': return '#FFD700';
    case 'A': return '#60A5FA';
    case 'B': return '#4ADE80';
    case 'C': return '#FDBA74';
    case 'D': return '#FB923C';
    case 'E': return '#F87171';
    default: return '#A1A1AA';
  }
}

/**
 * Get note color for display.
 */
export function getNoteColor(note: number): string {
  if (note >= 8) return '#4ADE80';
  if (note >= 6) return '#60A5FA';
  if (note >= 4) return '#FDBA74';
  if (note >= 2) return '#FB923C';
  return '#F87171';
}

/**
 * Aggregate multiple weekly results into a period summary (month/year).
 */
export function aggregatePeriodSavings(
  weeklyResults: WeeklySavingsResult[],
): PeriodSavingsResult {
  if (weeklyResults.length === 0) {
    return {
      totalEconomies: 0,
      totalDepassement: 0,
      economiesNettes: 0,
      noteMoyenne: 0,
      gradeMoyen: 'E',
      totalEpargne: 0,
      totalInvestissement: 0,
      totalDiscretionnaire: 0,
      nbSemaines: 0,
      semainesDansBudget: 0,
      tauxRespectBudget: 0,
    };
  }

  const totalEconomies = weeklyResults.reduce((s, r) => s + r.economiesCappees, 0);
  const totalDepassement = weeklyResults.reduce((s, r) => s + r.depassement, 0);
  const economiesNettes = totalEconomies - totalDepassement;
  const noteMoyenne = Math.round(
    weeklyResults.reduce((s, r) => s + r.note, 0) / weeklyResults.length * 10,
  ) / 10;
  const gradeMoyen = getGradeFromNote(Math.round(noteMoyenne));
  const totalEpargne = weeklyResults.reduce((s, r) => s + r.epargne, 0);
  const totalInvestissement = weeklyResults.reduce((s, r) => s + r.investissement, 0);
  const totalDiscretionnaire = weeklyResults.reduce((s, r) => s + r.discretionnaire, 0);
  const semainesDansBudget = weeklyResults.filter((r) => r.budgetRespecte).length;
  const tauxRespectBudget = Math.round(
    (semainesDansBudget / weeklyResults.length) * 100,
  );

  return {
    totalEconomies,
    totalDepassement,
    economiesNettes,
    noteMoyenne,
    gradeMoyen,
    totalEpargne,
    totalInvestissement,
    totalDiscretionnaire,
    nbSemaines: weeklyResults.length,
    semainesDansBudget,
    tauxRespectBudget,
  };
}

/**
 * Get the weeks that belong to a given month (1-12) and year.
 * Returns an array of week numbers.
 */
export function getWeeksInMonth(month: number, year: number): number[] {
  const weeks: number[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  const seenWeeks = new Set<number>();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const isoYear = d.getUTCFullYear();

    if (isoYear === year) {
      const yearStart = new Date(Date.UTC(isoYear, 0, 1));
      const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
      if (!seenWeeks.has(weekNo)) {
        seenWeeks.add(weekNo);
        weeks.push(weekNo);
      }
    }
  }

  return weeks.sort((a, b) => a - b);
}

/**
 * Get all 52 weeks for a year.
 */
export function getActiveWeeksForYear(year: number): number[] {
  const weeks: number[] = [];
  for (let w = 1; w <= 52; w++) {
    weeks.push(w);
  }
  return weeks;
}

/**
 * Month names in French.
 */
export const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

/**
 * Short month names in French.
 */
export const MONTH_SHORT_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
];
