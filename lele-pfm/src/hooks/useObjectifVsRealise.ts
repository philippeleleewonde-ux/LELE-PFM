import { useMemo } from 'react';
import { useEngineStore } from '@/stores/engine-store';
import { usePerformanceStore, WeeklyRecord } from '@/stores/performance-store';
import { useTransactionStore } from '@/stores/transaction-store';
import { getCurrentWeek, getWeekNumber, getISOYear, getWeekDates } from '@/utils/week-helpers';
import { COICOPCode, IndicatorDistribution } from '@/types';
import { COICOP_LABELS, COICOP_COLORS } from '@/components/performance/shared';
import { PFM_INDICATORS } from '@/constants/pfm-indicators';

// ─── Types ───

type Status = 'ahead' | 'on_track' | 'behind';

interface PeriodData {
  objectif: number;
  realise: number;
  progression: number;
  status: Status;
}

interface AnnualData extends PeriodData {
  objectifProrata: number;
  progressionProrata: number;
  ecart: number;
}

interface QuarterlyData extends PeriodData {
  quarter: number;
}

interface CategoryData {
  code: string;
  label: string;
  color: string;
  objectifAnnuel: number;
  realiseAnnuel: number;
  objectifProrata: number;
  ecart: number;
  progression: number;
  status: Status;
}

export interface IndicatorOvR {
  code: string;
  name: string;
  icon: string;
  color: string;
  rate: number;           // poids normalise (%)
  weekly: PeriodData;
  monthly: PeriodData;
  annual: AnnualData;
}

export interface ObjectifVsRealise {
  planYear: 1 | 2 | 3;
  planStartDate: string;
  currentQuarter: 1 | 2 | 3 | 4;
  annual: AnnualData;
  weekly: PeriodData;
  monthly: PeriodData;
  quarterly: QuarterlyData;
  byCategory: CategoryData[];
  byIndicator: IndicatorOvR[];
  weeksElapsed: number;
  totalWeeksInYear: number;
}

// ─── Helpers ───

const TOTAL_WEEKS = 48; // convention engine
const COICOP_CODES: COICOPCode[] = ['01', '02', '03', '04', '05', '06', '07', '08'];

/** Savings status: more savings = better */
function savingsStatus(progression: number): Status {
  if (progression >= 105) return 'ahead';
  if (progression >= 85) return 'on_track';
  return 'behind';
}

/** Budget/category status: spending LESS than budget = better */
function budgetStatus(progression: number): Status {
  if (progression > 105) return 'behind';
  if (progression >= 85) return 'on_track';
  return 'ahead';
}

function safeDiv(a: number, b: number): number {
  return b === 0 ? 0 : (a / b) * 100;
}

/**
 * Determine how many weeks have elapsed since planStartDate,
 * counting only weeks that fall within the current plan year.
 */
function computeWeeksElapsed(planStartDate: string, planYear: 1 | 2 | 3): number {
  const start = new Date(planStartDate);
  const yearOffset = (planYear - 1) * 12;
  const planYearStart = new Date(start);
  planYearStart.setMonth(planYearStart.getMonth() + yearOffset);

  const now = new Date();
  const diffMs = now.getTime() - planYearStart.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(0, Math.min(TOTAL_WEEKS, diffWeeks));
}

/**
 * Determine plan year (1, 2 or 3) from calculatedAt.
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
 * Determine current quarter of the plan year (T1-T4).
 * Each quarter = 12 weeks (48 / 4).
 */
function determineCurrentQuarter(weeksElapsed: number): 1 | 2 | 3 | 4 {
  if (weeksElapsed <= 12) return 1;
  if (weeksElapsed <= 24) return 2;
  if (weeksElapsed <= 36) return 3;
  return 4;
}

/**
 * Get all ISO week/year pairs that fall within the current plan year.
 */
function getPlanYearWeekPairs(
  planStartDate: string,
  planYear: 1 | 2 | 3,
  weeksElapsed: number,
): { week: number; year: number }[] {
  const start = new Date(planStartDate);
  const yearOffset = (planYear - 1) * 12;
  const planYearStart = new Date(start);
  planYearStart.setMonth(planYearStart.getMonth() + yearOffset);

  const pairs: { week: number; year: number }[] = [];
  for (let i = 0; i < weeksElapsed; i++) {
    const d = new Date(planYearStart);
    d.setDate(d.getDate() + i * 7);
    pairs.push({ week: getWeekNumber(d), year: getISOYear(d) });
  }
  return pairs;
}

/**
 * Get ISO week/year pairs for the current calendar month.
 */
function getCurrentMonthWeekPairs(): { week: number; year: number }[] {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const pairs: { week: number; year: number }[] = [];
  const seen = new Set<string>();
  const d = new Date(firstDay);
  while (d <= lastDay) {
    const w = getWeekNumber(d);
    const y = getISOYear(d);
    const key = `${y}-${w}`;
    if (!seen.has(key)) {
      seen.add(key);
      pairs.push({ week: w, year: y });
    }
    d.setDate(d.getDate() + 1);
  }
  return pairs;
}

/**
 * Get ISO week/year pairs for a quarter within the plan year.
 */
function getQuarterWeekPairs(
  planStartDate: string,
  planYear: 1 | 2 | 3,
  quarter: 1 | 2 | 3 | 4,
): { week: number; year: number }[] {
  const start = new Date(planStartDate);
  const yearOffset = (planYear - 1) * 12;
  const planYearStart = new Date(start);
  planYearStart.setMonth(planYearStart.getMonth() + yearOffset);

  const qStart = (quarter - 1) * 12; // weeks
  const qEnd = quarter * 12;

  const pairs: { week: number; year: number }[] = [];
  for (let i = qStart; i < qEnd; i++) {
    const d = new Date(planYearStart);
    d.setDate(d.getDate() + i * 7);
    if (d <= new Date()) {
      pairs.push({ week: getWeekNumber(d), year: getISOYear(d) });
    }
  }
  return pairs;
}

// ─── Main Hook ───

export function useObjectifVsRealise(): ObjectifVsRealise | null {
  const engineOutput = useEngineStore((s) => s.engineOutput);
  const records = usePerformanceStore((s) => s.records);
  const transactions = useTransactionStore((s) => s.transactions);

  return useMemo(() => {
    if (!engineOutput) return null;

    const { step9, step10, calculatedAt } = engineOutput;
    if (!step9 || !step10 || !calculatedAt) return null;

    const planYear = determinePlanYear(calculatedAt);
    const weeksElapsed = computeWeeksElapsed(calculatedAt, planYear);
    const currentQuarter = determineCurrentQuarter(weeksElapsed);

    // ─── Pick targets for current plan year ───
    const eprAnnuel =
      planYear === 1 ? step9.epr_n1 : planYear === 2 ? step9.epr_n2 : step9.epr_n3;
    const weeklyTarget =
      planYear === 1
        ? step9.weekly_target_n1
        : planYear === 2
          ? step9.weekly_target_n2
          : step9.weekly_target_n3;
    const monthlyTarget =
      planYear === 1
        ? step9.monthly_target_n1
        : planYear === 2
          ? step9.monthly_target_n2
          : step9.monthly_target_n3;

    // ─── Aggregate realised savings from performance records ───
    const allYearPairs = getPlanYearWeekPairs(calculatedAt, planYear, weeksElapsed);

    function sumEconomies(pairs: { week: number; year: number }[]): number {
      let total = 0;
      for (const p of pairs) {
        const rec = records.find((r) => r.week_number === p.week && r.year === p.year);
        if (rec) total += rec.economiesCappees;
      }
      return total;
    }

    function sumSpent(pairs: { week: number; year: number }[]): number {
      let total = 0;
      for (const p of pairs) {
        const rec = records.find((r) => r.week_number === p.week && r.year === p.year);
        if (rec) total += rec.weeklySpent;
      }
      return total;
    }

    // ─── ANNUAL ───
    const annualRealise = sumEconomies(allYearPairs);
    const objectifProrata = eprAnnuel * (weeksElapsed / TOTAL_WEEKS);
    const annualProgression = safeDiv(annualRealise, eprAnnuel);
    const progressionProrata = safeDiv(annualRealise, objectifProrata);

    const annual: AnnualData = {
      objectif: eprAnnuel,
      realise: annualRealise,
      ecart: annualRealise - objectifProrata,
      progression: annualProgression,
      objectifProrata,
      progressionProrata,
      status: savingsStatus(progressionProrata),
    };

    // ─── WEEKLY (current week) ───
    const { week: curWeek, year: curYear } = getCurrentWeek();
    const weekRecord = records.find(
      (r) => r.week_number === curWeek && r.year === curYear,
    );
    const weeklyRealise = weekRecord?.economiesCappees ?? 0;
    const weeklyProgression = safeDiv(weeklyRealise, weeklyTarget);

    const weekly: PeriodData = {
      objectif: weeklyTarget,
      realise: weeklyRealise,
      progression: weeklyProgression,
      status: savingsStatus(weeklyProgression),
    };

    // ─── MONTHLY ───
    const monthPairs = getCurrentMonthWeekPairs();
    const monthlyRealise = sumEconomies(monthPairs);
    const monthlyProgression = safeDiv(monthlyRealise, monthlyTarget);

    const monthly: PeriodData = {
      objectif: monthlyTarget,
      realise: monthlyRealise,
      progression: monthlyProgression,
      status: savingsStatus(monthlyProgression),
    };

    // ─── QUARTERLY ───
    // Quarterly savings target: use the distribution weights (20/23/27/30%)
    const quarterWeights = [0.20, 0.23, 0.27, 0.30];
    const quarterlyObjectif = eprAnnuel * quarterWeights[currentQuarter - 1];
    const quarterPairs = getQuarterWeekPairs(calculatedAt, planYear, currentQuarter);
    const quarterlyRealise = sumEconomies(quarterPairs);
    const quarterlyProgression = safeDiv(quarterlyRealise, quarterlyObjectif);

    const quarterly: QuarterlyData = {
      quarter: currentQuarter,
      objectif: quarterlyObjectif,
      realise: quarterlyRealise,
      progression: quarterlyProgression,
      status: savingsStatus(quarterlyProgression),
    };

    // ─── BY CATEGORY ───
    // Sum transactions by category for the entire plan year
    const categoryTotals: Record<string, number> = {};
    for (const code of COICOP_CODES) {
      categoryTotals[code] = 0;
    }
    // Filter transactions that fall within the plan year weeks
    const pairSet = new Set(allYearPairs.map((p) => `${p.year}-${p.week}`));
    for (const tx of transactions) {
      const key = `${tx.year}-${tx.week_number}`;
      if (pairSet.has(key) && categoryTotals[tx.category] !== undefined) {
        categoryTotals[tx.category] += tx.amount;
      }
    }

    const byCategory: CategoryData[] = COICOP_CODES.map((code) => {
      const catVent = step10.by_category?.[code];
      const objectifAnnuel =
        catVent
          ? planYear === 1
            ? catVent.annual_target_n1
            : planYear === 2
              ? catVent.annual_target_n2
              : catVent.annual_target_n3
          : 0;

      const realiseAnnuel = categoryTotals[code] ?? 0;
      const catObjectifProrata = objectifAnnuel * (weeksElapsed / TOTAL_WEEKS);
      const ecart = catObjectifProrata - realiseAnnuel;
      const progression = safeDiv(realiseAnnuel, catObjectifProrata);

      return {
        code,
        label: COICOP_LABELS[code] ?? code,
        color: COICOP_COLORS[code] ?? '#888',
        objectifAnnuel,
        realiseAnnuel,
        objectifProrata: catObjectifProrata,
        ecart,
        progression,
        status: budgetStatus(progression),
      };
    });

    // ─── BY INDICATOR (5 PFM indicators) ───
    const rawIndicators = step10.by_indicator ?? [];
    const byIndicator: IndicatorOvR[] = rawIndicators.map((ind) => {
      const def = PFM_INDICATORS.find((p) => p.code === ind.code);
      const rateDecimal = ind.rate / 100;

      // Targets for current plan year
      const indEprAnnuel =
        planYear === 1 ? ind.epr_n1 : planYear === 2 ? ind.epr_n2 : ind.epr_n3;
      const indMonthlyTarget =
        planYear === 1
          ? ind.monthly_target_n1
          : planYear === 2
            ? ind.monthly_target_n2
            : ind.monthly_target_n3;
      const indWeeklyTarget = indEprAnnuel / TOTAL_WEEKS;

      // Realise = share of total realised savings proportional to indicator weight
      const indWeeklyRealise = weeklyRealise * rateDecimal;
      const indMonthlyRealise = monthlyRealise * rateDecimal;
      const indAnnualRealise = annualRealise * rateDecimal;

      const indWeeklyProg = safeDiv(indWeeklyRealise, indWeeklyTarget);
      const indMonthlyProg = safeDiv(indMonthlyRealise, indMonthlyTarget);
      const indAnnualProg = safeDiv(indAnnualRealise, indEprAnnuel);
      const indObjectifProrata = indEprAnnuel * (weeksElapsed / TOTAL_WEEKS);
      const indProgressionProrata = safeDiv(indAnnualRealise, indObjectifProrata);

      return {
        code: ind.code,
        name: def?.name ?? ind.code,
        icon: def?.icon ?? 'HelpCircle',
        color: def?.color ?? '#FFFFFF',
        rate: ind.rate,
        weekly: {
          objectif: indWeeklyTarget,
          realise: indWeeklyRealise,
          progression: indWeeklyProg,
          status: savingsStatus(indWeeklyProg),
        },
        monthly: {
          objectif: indMonthlyTarget,
          realise: indMonthlyRealise,
          progression: indMonthlyProg,
          status: savingsStatus(indMonthlyProg),
        },
        annual: {
          objectif: indEprAnnuel,
          realise: indAnnualRealise,
          ecart: indAnnualRealise - indObjectifProrata,
          progression: indAnnualProg,
          objectifProrata: indObjectifProrata,
          progressionProrata: indProgressionProrata,
          status: savingsStatus(indProgressionProrata),
        },
      };
    });

    return {
      planYear,
      planStartDate: calculatedAt,
      currentQuarter,
      annual,
      weekly,
      monthly,
      quarterly,
      byCategory,
      byIndicator,
      weeksElapsed,
      totalWeeksInYear: TOTAL_WEEKS,
    };
  }, [engineOutput, records, transactions]);
}
