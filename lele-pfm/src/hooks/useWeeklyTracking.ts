import { useMemo } from 'react';
import { useTransactionStore } from '@/stores/transaction-store';
import { useEngineStore } from '@/stores/engine-store';
import { useInvestmentStore } from '@/stores/investment-store';
import { useIncomeStore } from '@/stores/income-store';
import { useImpulseStore } from '@/stores/impulse-store';
// savingsGoalStore no longer needed here — plan deduction moved to waterfall (useWeeklyAllocation)
import { COICOP_CATEGORIES } from '@/constants';
import { Transaction, COICOPCode, Nature } from '@/types';
import { getWeekLabel, getDayOfWeek } from '@/utils/week-helpers';
import {
  calculateWeeklySavings,
  calculateCategorySavings,
  WeeklySavingsResult,
  CategorySavingsResult,
} from '@/domain/calculators/weekly-savings-engine';

// Categories 01-04 are essential, 05-08 are discretionary
const ESSENTIAL_CODES: COICOPCode[] = ['01', '02', '03', '04'];

function getCategoryNature(code: COICOPCode): Nature {
  return ESSENTIAL_CODES.includes(code) ? 'Essentielle' : 'Discrétionnaire';
}

// ─── Quarterly-weighted EPR target helpers ───

import { QUARTERLY_WEIGHTS } from '@/constants/financial-quarters';
const WEEKS_PER_QUARTER = 12; // 48 active weeks / 4 quarters

/**
 * Determine plan year (1, 2, or 3) from calculatedAt date.
 * N1 = 0-12 months, N2 = 12-24 months, N3 = 24-36 months.
 */
function determinePlanYear(calculatedAt: string): 1 | 2 | 3 {
  const start = new Date(calculatedAt);
  const now = new Date();
  const diffMonths =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (diffMonths < 12) return 1;
  if (diffMonths < 24) return 2;
  return 3;
}

/**
 * Compute weeks elapsed since plan year start.
 */
function computeWeeksElapsed(calculatedAt: string, planYear: 1 | 2 | 3): number {
  const start = new Date(calculatedAt);
  const yearOffset = (planYear - 1) * 12;
  const planYearStart = new Date(start);
  planYearStart.setMonth(planYearStart.getMonth() + yearOffset);
  const now = new Date();
  const diffMs = now.getTime() - planYearStart.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(0, Math.min(48, diffWeeks));
}

/**
 * Determine current quarter (1-4) from weeks elapsed.
 * Each quarter = 12 weeks.
 */
function determineCurrentQuarter(weeksElapsed: number): 1 | 2 | 3 | 4 {
  if (weeksElapsed <= 12) return 1;
  if (weeksElapsed <= 24) return 2;
  if (weeksElapsed <= 36) return 3;
  return 4;
}

/**
 * Calculate the quarter-weighted weekly EPR target.
 * Formula: (EPR_annual × quarterWeight) / 12 weeks per quarter
 *
 * This replaces the flat EPR/48 with the correct progressive target.
 * T1 (20%) → lighter target at start
 * T4 (30%) → heavier target at end
 */
function getQuarterlyWeeklyTarget(eprAnnual: number, quarter: 1 | 2 | 3 | 4): number {
  const weight = QUARTERLY_WEIGHTS[quarter - 1];
  return Math.round((eprAnnual * weight) / WEEKS_PER_QUARTER);
}

// ─── Interfaces ───

export interface CategoryTracking {
  code: COICOPCode;
  label: string;
  icon: string;
  /** Budget variable hebdo pour cette catégorie (plafond de dépense) */
  weeklyBudget: number;
  /** Objectif d'épargne hebdo pour cette catégorie */
  weeklyTarget: number;
  weeklySpent: number;
  progressPercent: number;
  transactions: Transaction[];
  nature: Nature;
  /** Savings result for this category */
  savings: CategorySavingsResult;
}

export interface WeeklyTrackingData {
  weekLabel: string;
  /** Budget variable hebdomadaire BRUT (Reste à vivre / 4 = plafond de dépense) */
  weeklyBudget: number;
  /** Budget effectif après déduction des compensations et plans d'épargne actifs */
  effectiveBudget: number;
  /** Total des réductions de compensation actives cette semaine */
  totalCompensation: number;
  /** Total engagé par les plans d'épargne actifs (Sinking Fund) */
  totalPlanCommitment: number;
  /** Objectif d'épargne hebdomadaire (pondéré par trimestre du plan) */
  weeklyTarget: number;
  weeklySpent: number;
  weeklyRemaining: number;
  progressPercent: number;
  byCategory: CategoryTracking[];
  dayOfWeek: number;
  projectedWeekTotal: number;
  isOnTrack: boolean;
  /** Global savings for the week */
  savings: WeeklySavingsResult;
  /** Income actual this week (informational, does NOT affect savings formula) */
  weeklyIncomeActual: number;
  /** Income expected this week (informational) */
  weeklyIncomeExpected: number;
  /** Income minus expenses balance (informational) */
  incomeVsExpenseBalance: number;
  /** Current plan year (1, 2, or 3) */
  planYear: 1 | 2 | 3;
  /** Current quarter within the plan year (1-4) */
  currentQuarter: 1 | 2 | 3 | 4;
}

const COICOP_CODES: COICOPCode[] = ['01', '02', '03', '04', '05', '06', '07', '08'];

export function useWeeklyTracking(week: number, year: number): WeeklyTrackingData {
  const transactions = useTransactionStore((s) => s.transactions);
  const engineOutput = useEngineStore((s) => s.engineOutput);
  const incomeTargets = useEngineStore((s) => s.incomeTargets);
  const allIncomes = useIncomeStore((s) => s.incomes);
  const investmentRatio = useInvestmentStore((s) => s.investorProfile?.investmentRatio ?? 0);
  const getActiveCompensations = useImpulseStore((s) => s.getActiveCompensations);

  // C2 fix: call store getter outside useMemo to avoid function ref instability in deps
  const activeCompensations = getActiveCompensations(week, year);

  return useMemo(() => {
    const weekLabel = getWeekLabel(week, year);
    const dayOfWeek = getDayOfWeek(new Date());

    // Filter transactions for this week
    const weekTxs = transactions.filter(
      (tx) => tx.week_number === week && tx.year === year
    );

    // Exclude goal maturity expenses and internal transfers from spending
    // Goal expenses: savings already counted (Bug #1)
    // Internal transfers: audit trail entries, not real spending (ISA 500)
    const weeklySpent = weekTxs
      .filter((tx) => !tx.isGoalExpense && !tx.isInternalTransfer)
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Budget variable hebdo BRUT = Reste à vivre × 12 / 48 (from engine step9)
    const weeklyBudget = engineOutput?.step9?.weekly_budget ?? 0;
    const totalCompensation = activeCompensations.reduce((sum, c) => sum + c.weeklyReduction, 0);

    // ─── Plan d'épargne ───
    // Plans are a DISTRIBUTION of savings (handled by waterfall in useWeeklyAllocation),
    // NOT a reduction of budget. Deducting here AND in waterfall caused double-counting (Bug #3).
    // totalPlanCommitment is kept at 0 for interface compat; waterfall handles the real deduction.
    const totalPlanCommitment = 0;

    // Budget EFFECTIF = budget brut - compensations
    const effectiveBudget = Math.max(0, weeklyBudget - totalCompensation);

    // ─── Quarter-weighted EPR target ───
    // Determine plan year and quarter from engine calculatedAt
    const calculatedAt = engineOutput?.calculatedAt ?? '';
    const planYear = calculatedAt ? determinePlanYear(calculatedAt) : 1;
    const weeksElapsed = calculatedAt ? computeWeeksElapsed(calculatedAt, planYear) : 0;
    const currentQuarter = determineCurrentQuarter(weeksElapsed);

    // Pick the right annual EPR for current plan year
    const eprAnnual = planYear === 1
      ? (engineOutput?.step9?.epr_n1 ?? 0)
      : planYear === 2
        ? (engineOutput?.step9?.epr_n2 ?? 0)
        : (engineOutput?.step9?.epr_n3 ?? 0);

    // Weekly target = quarter-weighted (not flat /48)
    const weeklyTarget = eprAnnual > 0
      ? getQuarterlyWeeklyTarget(eprAnnual, currentQuarter)
      : (engineOutput?.step9?.weekly_target_n1 ?? 0);

    // Remaining = effectiveBudget - spent (combien on peut encore dépenser)
    const weeklyRemaining = Math.max(0, effectiveBudget - weeklySpent);

    // Progress = % du budget effectif utilisé (spent / effectiveBudget)
    const progressPercent = effectiveBudget > 0
      ? Math.round((weeklySpent / effectiveBudget) * 100)
      : 0;

    // Projected week total based on current spending rate
    const projectedWeekTotal = dayOfWeek > 0
      ? Math.round(weeklySpent * (7 / dayOfWeek))
      : weeklySpent;

    // On track = projected total stays within effective budget
    const isOnTrack = projectedWeekTotal <= effectiveBudget;

    // Global weekly savings — based on EFFECTIVE budget (post-compensation)
    // Economies = MAX(0, effectiveBudget - spent) → reflects real available resources
    const savings = calculateWeeklySavings(effectiveBudget, weeklyTarget, weeklySpent, investmentRatio);

    // Build per-category tracking
    const categoryVentilation = engineOutput?.step10?.by_category;

    const byCategory: CategoryTracking[] = COICOP_CODES.map((code) => {
      const catConfig = COICOP_CATEGORIES[code as keyof typeof COICOP_CATEGORIES];
      const catTxs = weekTxs.filter((tx) => tx.category === code);
      const catSpent = catTxs
        .filter((tx) => !tx.isGoalExpense && !tx.isInternalTransfer)
        .reduce((sum, tx) => sum + tx.amount, 0);

      const catVentilation = categoryVentilation?.[code];

      // Budget catégorie hebdo = budget global × budget_rate% minus active compensations
      const budgetRate = catVentilation?.budget_rate ?? 0;
      const baseBudget = Math.round(weeklyBudget * budgetRate / 100);
      const compensationForCategory = activeCompensations
        .filter((c) => c.category === code)
        .reduce((sum, c) => sum + c.weeklyReduction, 0);
      const catWeeklyBudget = Math.max(0, baseBudget - compensationForCategory);

      // Category EPR target — quarter-weighted like global
      const catAnnualTarget = catVentilation
        ? planYear === 1
          ? catVentilation.annual_target_n1
          : planYear === 2
            ? catVentilation.annual_target_n2
            : catVentilation.annual_target_n3
        : 0;
      const catWeeklyTarget = catAnnualTarget > 0
        ? Math.round((catAnnualTarget * QUARTERLY_WEIGHTS[currentQuarter - 1]) / WEEKS_PER_QUARTER)
        : 0;

      // Progress = % du budget catégorie utilisé
      const catProgress = catWeeklyBudget > 0
        ? Math.round((catSpent / catWeeklyBudget) * 100)
        : 0;

      // Savings per category (with investment ratio)
      const catSavings = calculateCategorySavings(code, catWeeklyBudget, catWeeklyTarget, catSpent, investmentRatio);

      return {
        code,
        label: catConfig?.label ?? code,
        icon: catConfig?.icon ?? 'circle',
        weeklyBudget: catWeeklyBudget,
        weeklyTarget: catWeeklyTarget,
        weeklySpent: catSpent,
        progressPercent: catProgress,
        transactions: catTxs,
        nature: getCategoryNature(code),
        savings: catSavings,
      };
    });

    // Income data (informational only — does NOT modify savings formula)
    const weekIncomes = allIncomes.filter(
      (inc) => inc.week_number === week && inc.year === year
    );
    const weeklyIncomeActual = weekIncomes.reduce((sum, inc) => sum + inc.amount, 0);

    // Expected weekly income from persisted targets
    // Use 52/12 (~4.33) for accurate monthly-to-weekly conversion
    let weeklyIncomeExpected = 0;
    if (incomeTargets) {
      for (const target of Object.values(incomeTargets)) {
        weeklyIncomeExpected += Math.round(target.monthlyAmount / (52 / 12));
      }
    }

    const incomeVsExpenseBalance = weeklyIncomeActual - weeklySpent;

    return {
      weekLabel,
      weeklyBudget,
      effectiveBudget,
      totalCompensation,
      totalPlanCommitment,
      weeklyTarget,
      weeklySpent,
      weeklyRemaining,
      progressPercent,
      byCategory,
      dayOfWeek,
      projectedWeekTotal,
      isOnTrack,
      savings,
      weeklyIncomeActual,
      weeklyIncomeExpected,
      incomeVsExpenseBalance,
      planYear,
      currentQuarter,
    };
  }, [transactions, engineOutput, incomeTargets, allIncomes, week, year, investmentRatio, activeCompensations]);
}
