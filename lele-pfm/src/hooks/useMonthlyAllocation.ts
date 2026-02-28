import { useMemo } from 'react';
import { useTransactionStore } from '@/stores/transaction-store';
import { useIncomeStore } from '@/stores/income-store';
import { usePerformanceStore } from '@/stores/performance-store';
import { useEngineStore } from '@/stores/engine-store';
import { getWeeksInMonth } from '@/domain/calculators/weekly-savings-engine';
import { COICOP_TO_BUCKET, PatrimoineBucket, PATRIMOINE_BUCKETS } from '@/constants/patrimoine-buckets';

export interface BucketAllocation {
  code: PatrimoineBucket;
  targetPercent: number;
  targetAmount: number;
  actualAmount: number;
  progressPercent: number;
  color: string;
}

export interface MonthlyAllocationResult {
  month: number;
  year: number;
  monthlyIncome: number;
  buckets: BucketAllocation[];
  surplusFromPlaisir: number;
  lifestyleInflationPercent: number | null;
  lifestyleInflationAlert: boolean;
}

const EMPTY_RESULT: MonthlyAllocationResult = {
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
  monthlyIncome: 0,
  buckets: [],
  surplusFromPlaisir: 0,
  lifestyleInflationPercent: null,
  lifestyleInflationAlert: false,
};

export function useMonthlyAllocation(): MonthlyAllocationResult {
  const transactions = useTransactionStore((s) => s.transactions);
  const incomes = useIncomeStore((s) => s.incomes);
  const records = usePerformanceStore((s) => s.records);
  const engineOutput = useEngineStore((s) => s.engineOutput);

  return useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-indexed
    const currentYear = now.getFullYear();

    // Get weeks in current and previous month
    const weeksThisMonth = getWeeksInMonth(currentMonth, currentYear);
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const weeksPrevMonth = getWeeksInMonth(prevMonth, prevYear);

    // 1. Monthly income from income-store
    const monthlyIncome = incomes
      .filter((i) => weeksThisMonth.includes(i.week_number) && i.year === currentYear)
      .reduce((sum, i) => sum + i.amount, 0);

    if (monthlyIncome === 0 && records.length === 0) {
      return EMPTY_RESULT;
    }

    // 2. Essentiels: COICOP codes mapped to 'essentiels'
    const essentielsAmount = transactions
      .filter(
        (tx) =>
          weeksThisMonth.includes(tx.week_number) &&
          tx.year === currentYear &&
          !tx.isGoalExpense &&
          !tx.isInternalTransfer &&
          COICOP_TO_BUCKET[tx.category] === 'essentiels'
      )
      .reduce((sum, tx) => sum + tx.amount / 100, 0); // cents → currency

    // 3. Plaisir: COICOP codes mapped to 'plaisir'
    const plaisirActual = transactions
      .filter(
        (tx) =>
          weeksThisMonth.includes(tx.week_number) &&
          tx.year === currentYear &&
          !tx.isGoalExpense &&
          !tx.isInternalTransfer &&
          COICOP_TO_BUCKET[tx.category] === 'plaisir'
      )
      .reduce((sum, tx) => sum + tx.amount / 100, 0);

    // 4. Performance records for this month
    const monthRecords = records.filter(
      (r) => weeksThisMonth.includes(r.week_number) && r.year === currentYear
    );

    // 5. Stabilite: epargne from waterfall
    const stabiliteAmount = monthRecords.reduce(
      (sum, r) => sum + (r.waterfallEpargne ?? r.epargne ?? 0),
      0
    );

    // 6. Croissance: EPR + goals + plan + investment + surplus plaisir
    const plaisirTarget = monthlyIncome * (PATRIMOINE_BUCKETS.plaisir.targetPercent / 100);
    const surplusFromPlaisir = Math.max(0, plaisirTarget - plaisirActual);

    const croissanceFromRecords = monthRecords.reduce(
      (sum, r) =>
        sum +
        (r.eprProvision ?? 0) +
        (r.waterfallGoalAllocations ?? 0) +
        (r.waterfallPlanAllocations ?? 0) +
        (r.investissement ?? 0),
      0
    );
    const croissanceAmount = croissanceFromRecords + surplusFromPlaisir;

    // Target amounts
    const essentielsTarget = monthlyIncome * (PATRIMOINE_BUCKETS.essentiels.targetPercent / 100);
    const stabiliteTarget = monthlyIncome * (PATRIMOINE_BUCKETS.stabilite.targetPercent / 100);
    const croissanceTarget = monthlyIncome * (PATRIMOINE_BUCKETS.croissance.targetPercent / 100);

    // Build bucket array
    const buckets: BucketAllocation[] = [
      {
        code: 'croissance',
        targetPercent: PATRIMOINE_BUCKETS.croissance.targetPercent,
        targetAmount: croissanceTarget,
        actualAmount: croissanceAmount,
        progressPercent: croissanceTarget > 0 ? (croissanceAmount / croissanceTarget) * 100 : 0,
        color: PATRIMOINE_BUCKETS.croissance.color,
      },
      {
        code: 'stabilite',
        targetPercent: PATRIMOINE_BUCKETS.stabilite.targetPercent,
        targetAmount: stabiliteTarget,
        actualAmount: stabiliteAmount,
        progressPercent: stabiliteTarget > 0 ? (stabiliteAmount / stabiliteTarget) * 100 : 0,
        color: PATRIMOINE_BUCKETS.stabilite.color,
      },
      {
        code: 'essentiels',
        targetPercent: PATRIMOINE_BUCKETS.essentiels.targetPercent,
        targetAmount: essentielsTarget,
        actualAmount: essentielsAmount,
        progressPercent: essentielsTarget > 0 ? (essentielsAmount / essentielsTarget) * 100 : 0,
        color: PATRIMOINE_BUCKETS.essentiels.color,
      },
      {
        code: 'plaisir',
        targetPercent: PATRIMOINE_BUCKETS.plaisir.targetPercent,
        targetAmount: plaisirTarget,
        actualAmount: plaisirActual,
        progressPercent: plaisirTarget > 0 ? (plaisirActual / plaisirTarget) * 100 : 0,
        color: PATRIMOINE_BUCKETS.plaisir.color,
      },
    ];

    // 7. Lifestyle inflation: compare essentiels this month vs previous month
    let lifestyleInflationPercent: number | null = null;
    let lifestyleInflationAlert = false;

    if (weeksPrevMonth.length > 0) {
      const prevEssentiels = transactions
        .filter(
          (tx) =>
            weeksPrevMonth.includes(tx.week_number) &&
            tx.year === prevYear &&
            !tx.isGoalExpense &&
            !tx.isInternalTransfer &&
            COICOP_TO_BUCKET[tx.category] === 'essentiels'
        )
        .reduce((sum, tx) => sum + tx.amount / 100, 0);

      if (prevEssentiels > 0) {
        lifestyleInflationPercent =
          ((essentielsAmount - prevEssentiels) / prevEssentiels) * 100;
        lifestyleInflationAlert = lifestyleInflationPercent >= 5;
      }
    }

    return {
      month: currentMonth,
      year: currentYear,
      monthlyIncome,
      buckets,
      surplusFromPlaisir,
      lifestyleInflationPercent,
      lifestyleInflationAlert,
    };
  }, [transactions, incomes, records, engineOutput]);
}
