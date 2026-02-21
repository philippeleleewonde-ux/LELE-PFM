import { useMemo } from 'react';
import { useTransactionStore } from '@/stores/transaction-store';
import { useEngineStore } from '@/stores/engine-store';
import { usePerformanceStore, WeeklyRecord } from '@/stores/performance-store';
import {
  calculateWeeklySavings,
  aggregatePeriodSavings,
  getWeeksInMonth,
  WeeklySavingsResult,
  PeriodSavingsResult,
  MONTH_NAMES_FR,
} from '@/domain/calculators/weekly-savings-engine';
import { Grade } from '@/types';

export interface WeekCalendarEntry {
  week: number;
  year: number;
  /** Budget variable hebdo (plafond de dépense) */
  budget: number;
  /** Objectif d'épargne hebdo */
  target: number;
  spent: number;
  savings: WeeklySavingsResult;
  hasTransactions: boolean;
  /** Persisted record if exists */
  record: WeeklyRecord | undefined;
}

export interface MonthCalendarEntry {
  month: number;
  year: number;
  label: string;
  weeks: WeekCalendarEntry[];
  summary: PeriodSavingsResult;
}

export type ReportPeriod = 'week' | 'month' | 'year';

// ─── Quarter-weighted EPR target helpers (mirrored from useWeeklyTracking) ───

const QUARTERLY_WEIGHTS = [0.20, 0.23, 0.27, 0.30];
const WEEKS_PER_QUARTER = 12;

function determinePlanYear(calculatedAt: string): 1 | 2 | 3 {
  const start = new Date(calculatedAt);
  const now = new Date();
  const diffMonths =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (diffMonths < 12) return 1;
  if (diffMonths < 24) return 2;
  return 3;
}

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

function determineCurrentQuarter(weeksElapsed: number): 1 | 2 | 3 | 4 {
  if (weeksElapsed <= 12) return 1;
  if (weeksElapsed <= 24) return 2;
  if (weeksElapsed <= 36) return 3;
  return 4;
}

function getQuarterlyWeeklyTarget(eprAnnual: number, quarter: 1 | 2 | 3 | 4): number {
  const weight = QUARTERLY_WEIGHTS[quarter - 1];
  return Math.round((eprAnnual * weight) / WEEKS_PER_QUARTER);
}

/**
 * Hook that provides calendar data for performance reporting.
 * Computes weekly savings for each week of the selected year,
 * aggregated at month and year levels.
 * Uses quarter-weighted EPR targets and persisted records when available.
 */
export function usePerformanceCalendar(year: number) {
  const transactions = useTransactionStore((s) => s.transactions);
  const engineOutput = useEngineStore((s) => s.engineOutput);
  const records = usePerformanceStore((s) => s.records);

  return useMemo(() => {
    const weeklyBudget = engineOutput?.step9?.weekly_budget ?? 0;

    // ─── Compute quarter-weighted EPR target (same logic as useWeeklyTracking) ───
    const calculatedAt = engineOutput?.calculatedAt ?? '';
    const planYear = calculatedAt ? determinePlanYear(calculatedAt) : 1;
    const weeksElapsed = calculatedAt ? computeWeeksElapsed(calculatedAt, planYear) : 0;
    const currentQuarter = determineCurrentQuarter(weeksElapsed);

    const eprAnnual = planYear === 1
      ? (engineOutput?.step9?.epr_n1 ?? 0)
      : planYear === 2
        ? (engineOutput?.step9?.epr_n2 ?? 0)
        : (engineOutput?.step9?.epr_n3 ?? 0);

    const computedWeeklyTarget = eprAnnual > 0
      ? getQuarterlyWeeklyTarget(eprAnnual, currentQuarter)
      : (engineOutput?.step9?.weekly_target_n1 ?? 0);

    // Build a map of week → spent
    const yearTxs = transactions.filter((tx) => tx.year === year);
    const weekSpentMap = new Map<number, number>();
    for (const tx of yearTxs) {
      weekSpentMap.set(
        tx.week_number,
        (weekSpentMap.get(tx.week_number) ?? 0) + tx.amount,
      );
    }

    // Build persisted records map
    const recordMap = new Map<number, WeeklyRecord>();
    for (const r of records) {
      if (r.year === year) {
        recordMap.set(r.week_number, r);
      }
    }

    // Generate all 52 weeks
    const allWeeks: WeekCalendarEntry[] = [];
    for (let w = 1; w <= 52; w++) {
      const spent = weekSpentMap.get(w) ?? 0;
      const hasTransactions = spent > 0;
      const record = recordMap.get(w);

      // Prefer persisted record target, fallback to quarter-weighted computation
      const weekTarget = record?.weeklyTarget ?? computedWeeklyTarget;
      const savings = calculateWeeklySavings(weeklyBudget, weekTarget, spent);

      allWeeks.push({
        week: w,
        year,
        budget: weeklyBudget,
        target: weekTarget,
        spent,
        savings,
        hasTransactions,
        record,
      });
    }

    // Group by month
    const months: MonthCalendarEntry[] = [];
    for (let m = 1; m <= 12; m++) {
      const weeksInMonth = getWeeksInMonth(m, year);
      const monthWeeks = allWeeks.filter((w) => weeksInMonth.includes(w.week));
      const activeSavings = monthWeeks
        .filter((w) => w.hasTransactions)
        .map((w) => w.savings);
      const summary = aggregatePeriodSavings(activeSavings);

      months.push({
        month: m,
        year,
        label: MONTH_NAMES_FR[m - 1],
        weeks: monthWeeks,
        summary,
      });
    }

    // Year summary
    const allActiveSavings = allWeeks
      .filter((w) => w.hasTransactions)
      .map((w) => w.savings);
    const yearSummary = aggregatePeriodSavings(allActiveSavings);

    return {
      weeks: allWeeks,
      months,
      yearSummary,
      weeklyBudget,
      weeklyTarget: computedWeeklyTarget,
      hasEngine: !!engineOutput,
    };
  }, [transactions, engineOutput, records, year]);
}
