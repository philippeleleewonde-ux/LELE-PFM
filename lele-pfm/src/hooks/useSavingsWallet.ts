import { useMemo } from 'react';
import { usePerformanceStore, WeeklyRecord } from '@/stores/performance-store';
import { useTransactionStore } from '@/stores/transaction-store';
import { useSavingsGoalStore } from '@/stores/savings-goal-store';
import { getGradeFromNote } from '@/domain/calculators/weekly-savings-engine';
import { getCurrentWeek } from '@/utils/week-helpers';
import { getWeeksInMonth } from '@/domain/calculators/weekly-savings-engine';
import { Grade } from '@/types';

export interface YearBucket {
  economies: number;
  economiesReelles: number;
  epargne: number;
  discretionnaire: number;
  depassement: number;
  nbSemaines: number;
}

export interface SavingsWallet {
  // All-time cumuls
  allTimeEconomies: number;
  /** Argent reellement non depense (budget - spent, sans cap) cumule */
  allTimeNonDepense: number;
  allTimeEpargne: number;
  allTimeDiscretionnaire: number;
  allTimeDepassement: number;
  allTimeNet: number;
  nbSemainesTotal: number;

  // Current year
  currentYearEconomies: number;
  currentYearEpargne: number;
  currentYearDiscretionnaire: number;

  // Current month
  currentMonthEconomies: number;
  currentMonthEpargne: number;
  currentMonthDiscretionnaire: number;

  // Current week
  currentWeekEconomies: number;
  currentWeekEpargne: number;
  currentWeekDiscretionnaire: number;

  // By year (for filters)
  byYear: Map<number, YearBucket>;

  // By month for current year (for detail list)
  byMonth: { month: number; year: number; economies: number; economiesReelles: number; epargne: number; discretionnaire: number; depassement: number; nbSemaines: number; noteMoyenne: number; grade: Grade }[];

  // All weeks sorted by date desc (for detail list)
  allWeeksSorted: WeeklyRecord[];

  // First and last record dates
  firstRecordDate: string | null;
  lastRecordDate: string | null;

  // ─── Reconciliation (IAS 1.15 — Image fidèle) ───
  /** Total contributions allouées aux objectifs (waterfall goal allocations cumulées) */
  allTimeGoalAllocations: number;
  /** Total des dépenses objectifs validées (cash sorti via maturity) */
  allTimeValidatedGoalExpenses: number;
  /** Total contributions internes tracées (piste d'audit ISA 500) */
  allTimeInternalTransfers: number;
  /** Épargne nette disponible = épargne + discrétionnaire (exclut objectifs dépensés) */
  allTimeNetDisponible: number;
}

export function useSavingsWallet(): SavingsWallet {
  const records = usePerformanceStore((s) => s.records);
  const transactions = useTransactionStore((s) => s.transactions);
  const goals = useSavingsGoalStore((s) => s.goals);
  const { week: nowWeek, year: nowYear } = getCurrentWeek();
  const nowMonth = new Date().getMonth() + 1;

  return useMemo(() => {
    if (records.length === 0) {
      return {
        allTimeEconomies: 0,
        allTimeNonDepense: 0,
        allTimeEpargne: 0,
        allTimeDiscretionnaire: 0,
        allTimeDepassement: 0,
        allTimeNet: 0,
        nbSemainesTotal: 0,
        currentYearEconomies: 0,
        currentYearEpargne: 0,
        currentYearDiscretionnaire: 0,
        currentMonthEconomies: 0,
        currentMonthEpargne: 0,
        currentMonthDiscretionnaire: 0,
        currentWeekEconomies: 0,
        currentWeekEpargne: 0,
        currentWeekDiscretionnaire: 0,
        byYear: new Map(),
        byMonth: [],
        allWeeksSorted: [],
        firstRecordDate: null,
        lastRecordDate: null,
        allTimeGoalAllocations: 0,
        allTimeValidatedGoalExpenses: 0,
        allTimeInternalTransfers: 0,
        allTimeNetDisponible: 0,
      };
    }

    // All-time aggregation
    let allTimeEconomies = 0;
    let allTimeNonDepense = 0;
    let allTimeEpargne = 0;
    let allTimeDiscretionnaire = 0;
    let allTimeDepassement = 0;

    // By year buckets
    const byYear = new Map<number, YearBucket>();

    // Current week
    let currentWeekEconomies = 0;
    let currentWeekEpargne = 0;
    let currentWeekDiscretionnaire = 0;

    // Weeks in current month for current year
    const currentMonthWeeks = new Set(getWeeksInMonth(nowMonth, nowYear));

    let currentMonthEconomies = 0;
    let currentMonthEpargne = 0;
    let currentMonthDiscretionnaire = 0;

    // Current year
    let currentYearEconomies = 0;
    let currentYearEpargne = 0;
    let currentYearDiscretionnaire = 0;

    // Track dates
    let firstDate: string | null = null;
    let lastDate: string | null = null;

    for (const r of records) {
      // Prefer waterfall values when available (Bug #4 fix), fallback to engine values
      const epargne = r.waterfallEpargne ?? r.epargne;
      const discretionnaire = r.waterfallDiscretionnaire ?? r.discretionnaire;

      // All-time
      allTimeEconomies += r.economiesCappees;
      allTimeNonDepense += r.economies; // uncapped: real budget - spent
      allTimeEpargne += epargne;
      allTimeDiscretionnaire += discretionnaire;
      allTimeDepassement += r.depassement;

      // By year
      let bucket = byYear.get(r.year);
      if (!bucket) {
        bucket = { economies: 0, economiesReelles: 0, epargne: 0, discretionnaire: 0, depassement: 0, nbSemaines: 0 };
        byYear.set(r.year, bucket);
      }
      bucket.economies += r.economiesCappees;
      bucket.economiesReelles += r.economies;
      bucket.epargne += epargne;
      bucket.discretionnaire += discretionnaire;
      bucket.depassement += r.depassement;
      bucket.nbSemaines += 1;

      // Current year
      if (r.year === nowYear) {
        currentYearEconomies += r.economiesCappees;
        currentYearEpargne += epargne;
        currentYearDiscretionnaire += discretionnaire;

        // Current month
        if (currentMonthWeeks.has(r.week_number)) {
          currentMonthEconomies += r.economiesCappees;
          currentMonthEpargne += epargne;
          currentMonthDiscretionnaire += discretionnaire;
        }
      }

      // Current week
      if (r.year === nowYear && r.week_number === nowWeek) {
        currentWeekEconomies = r.economiesCappees;
        currentWeekEpargne = epargne;
        currentWeekDiscretionnaire = discretionnaire;
      }

      // Date tracking
      if (!firstDate || r.savedAt < firstDate) firstDate = r.savedAt;
      if (!lastDate || r.savedAt > lastDate) lastDate = r.savedAt;
    }

    // Build byMonth for all years (sorted desc)
    const allYears = Array.from(byYear.keys()).sort((a, b) => b - a);
    const byMonth: SavingsWallet['byMonth'] = [];

    for (const yr of allYears) {
      for (let m = 12; m >= 1; m--) {
        const monthWeeks = new Set(getWeeksInMonth(m, yr));
        const monthRecords = records.filter(
          (r) => r.year === yr && monthWeeks.has(r.week_number),
        );
        if (monthRecords.length === 0) continue;

        const economies = monthRecords.reduce((s, r) => s + r.economiesCappees, 0);
        const economiesReelles = monthRecords.reduce((s, r) => s + r.economies, 0);
        const epargne = monthRecords.reduce((s, r) => s + (r.waterfallEpargne ?? r.epargne), 0);
        const discretionnaire = monthRecords.reduce((s, r) => s + (r.waterfallDiscretionnaire ?? r.discretionnaire), 0);
        const depassement = monthRecords.reduce((s, r) => s + r.depassement, 0);
        const noteMoyenne =
          Math.round(
            (monthRecords.reduce((s, r) => s + r.note, 0) / monthRecords.length) * 10,
          ) / 10;
        const grade = getGradeFromNote(Math.round(noteMoyenne));

        byMonth.push({
          month: m,
          year: yr,
          economies,
          economiesReelles,
          epargne,
          discretionnaire,
          depassement,
          nbSemaines: monthRecords.length,
          noteMoyenne,
          grade,
        });
      }
    }

    // All weeks sorted by year desc then week desc
    const allWeeksSorted = [...records].sort(
      (a, b) => b.year - a.year || b.week_number - a.week_number,
    );

    // ─── Reconciliation IAS 1.15 ───
    // Goal allocations from waterfall records
    const allTimeGoalAllocations = records.reduce(
      (s, r) => s + (r.waterfallGoalAllocations ?? 0) + (r.waterfallPlanAllocations ?? 0), 0
    );

    // Validated goal expenses (cash actually spent on matured goals)
    const allTimeValidatedGoalExpenses = transactions
      .filter((tx) => tx.isGoalExpense)
      .reduce((s, tx) => s + tx.amount, 0);

    // Internal transfer transactions (audit trail for contributions)
    const allTimeInternalTransfers = transactions
      .filter((tx) => tx.isInternalTransfer)
      .reduce((s, tx) => s + tx.amount, 0);

    // Net disponible = épargne + discrétionnaire (already excludes goals via waterfall)
    const allTimeNetDisponible = allTimeEpargne + allTimeDiscretionnaire;

    return {
      allTimeEconomies,
      allTimeNonDepense,
      allTimeEpargne,
      allTimeDiscretionnaire,
      allTimeDepassement,
      allTimeNet: allTimeEconomies - allTimeDepassement,
      nbSemainesTotal: records.length,
      currentYearEconomies,
      currentYearEpargne,
      currentYearDiscretionnaire,
      currentMonthEconomies,
      currentMonthEpargne,
      currentMonthDiscretionnaire,
      currentWeekEconomies,
      currentWeekEpargne,
      currentWeekDiscretionnaire,
      byYear,
      byMonth,
      allWeeksSorted,
      firstRecordDate: firstDate,
      lastRecordDate: lastDate,
      allTimeGoalAllocations,
      allTimeValidatedGoalExpenses,
      allTimeInternalTransfers,
      allTimeNetDisponible,
    };
  }, [records, transactions, goals, nowWeek, nowYear, nowMonth]);
}
