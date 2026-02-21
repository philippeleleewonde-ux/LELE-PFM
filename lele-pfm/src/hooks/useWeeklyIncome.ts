import { useMemo } from 'react';
import { useIncomeStore, IncomeTransaction } from '@/stores/income-store';
import { useEngineStore } from '@/stores/engine-store';
import { INCOME_CATEGORIES, IncomeCode } from '@/constants/income-categories';

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

    // Build per-source tracking — only for sources with targets or transactions
    const activeSources = new Set<IncomeCode>();

    // Add sources from targets
    if (incomeTargets) {
      for (const source of Object.keys(incomeTargets)) {
        if (INCOME_CATEGORIES[source as IncomeCode]) {
          activeSources.add(source as IncomeCode);
        }
      }
    }

    // Add sources from transactions
    for (const inc of weekIncomes) {
      activeSources.add(inc.source);
    }

    const bySource: IncomeSourceTracking[] = Array.from(activeSources).map((code) => {
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

    // Sort: sources with expected first, then by actual descending
    bySource.sort((a, b) => {
      if (a.weeklyExpected > 0 && b.weeklyExpected === 0) return -1;
      if (a.weeklyExpected === 0 && b.weeklyExpected > 0) return 1;
      return b.weeklyActual - a.weeklyActual;
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
