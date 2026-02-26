import { useMemo } from 'react';
import { useIncomeStore, IncomeTransaction } from '@/stores/income-store';
import { useEngineStore } from '@/stores/engine-store';
import { INCOME_CATEGORIES, INCOME_CODES, IncomeCode } from '@/constants/income-categories';

export interface IncomeSourceTracking {
  code: IncomeCode;
  label: string;
  color: string;
  type: 'Fixe' | 'Variable';
  weeklyExpected: number;
  weeklyActual: number;
  progressPercent: number;
  transactions: IncomeTransaction[];
}

export interface WeeklyIncomeData {
  totalExpectedWeekly: number;
  totalActualWeekly: number;
  progressPercent: number;
  bySource: IncomeSourceTracking[];
  isOnTrack: boolean;
}

export function useWeeklyIncome(week: number, year: number): WeeklyIncomeData {
  const incomes = useIncomeStore((s) => s.incomes);
  const incomeTargets = useEngineStore((s) => s.incomeTargets);

  return useMemo(() => {
    // Filter incomes for this week
    const weekIncomes = incomes.filter(
      (inc) => inc.week_number === week && inc.year === year
    );

    // Build per-source tracking for ALL 8 income categories
    const bySource: IncomeSourceTracking[] = INCOME_CODES.map((code) => {
      const config = INCOME_CATEGORIES[code];
      const sourceTxs = weekIncomes.filter((inc) => inc.source === code);
      const actual = sourceTxs.reduce((sum, inc) => sum + inc.amount, 0);

      // Weekly expected = monthly target / 4
      const monthlyTarget = incomeTargets?.[code]?.monthlyAmount ?? 0;
      const weeklyExpected = Math.round(monthlyTarget / 4);

      const progress = weeklyExpected > 0
        ? Math.round((actual / weeklyExpected) * 100)
        : actual > 0 ? 100 : 0;

      return {
        code,
        label: config.label,
        color: config.color,
        type: config.type,
        weeklyExpected,
        weeklyActual: actual,
        progressPercent: progress,
        transactions: sourceTxs,
      };
    });

    // Sort: sources with expected first, then sources with transactions, then rest
    bySource.sort((a, b) => {
      const aActive = a.weeklyExpected > 0 ? 2 : a.weeklyActual > 0 ? 1 : 0;
      const bActive = b.weeklyExpected > 0 ? 2 : b.weeklyActual > 0 ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return b.weeklyExpected - a.weeklyExpected;
    });

    const totalExpectedWeekly = bySource.reduce((sum, s) => sum + s.weeklyExpected, 0);
    const totalActualWeekly = bySource.reduce((sum, s) => sum + s.weeklyActual, 0);

    const progressPercent = totalExpectedWeekly > 0
      ? Math.round((totalActualWeekly / totalExpectedWeekly) * 100)
      : totalActualWeekly > 0 ? 100 : 0;

    const isOnTrack = totalExpectedWeekly > 0
      ? totalActualWeekly >= totalExpectedWeekly * 0.8
      : true;

    return {
      totalExpectedWeekly,
      totalActualWeekly,
      progressPercent,
      bySource,
      isOnTrack,
    };
  }, [incomes, incomeTargets, week, year]);
}
