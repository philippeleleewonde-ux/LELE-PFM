import { useMemo } from 'react';
import { useEngineStore } from '@/stores/engine-store';
import { usePerformanceStore } from '@/stores/performance-store';
import { useSavingsWallet } from '@/hooks/useSavingsWallet';
import { EMERGENCY_FUND_MONTHS } from '@/constants/patrimoine-buckets';

export interface EmergencyFundResult {
  targetAmount: number;
  accumulatedAmount: number;
  progressPercent: number;
  weeksToTarget: number | null;
  coverageMonths: number;
  isComplete: boolean;
  isPriority: boolean;
  monthlyBudgetEssential: number;
}

const EMPTY_RESULT: EmergencyFundResult = {
  targetAmount: 0,
  accumulatedAmount: 0,
  progressPercent: 0,
  weeksToTarget: null,
  coverageMonths: 0,
  isComplete: false,
  isPriority: true,
  monthlyBudgetEssential: 0,
};

export function useEmergencyFund(): EmergencyFundResult {
  const engineOutput = useEngineStore((s) => s.engineOutput);
  const records = usePerformanceStore((s) => s.records);
  const wallet = useSavingsWallet();

  return useMemo(() => {
    if (!engineOutput) return EMPTY_RESULT;

    // Monthly essential budget from engine step9
    const monthlyBudget = engineOutput.step9.monthly_budget;
    if (monthlyBudget <= 0) return EMPTY_RESULT;

    // Target: 6 months of essential budget
    const targetAmount = EMERGENCY_FUND_MONTHS * monthlyBudget;

    // Accumulated: all-time epargne from savings wallet
    const accumulatedAmount = wallet.allTimeEpargne;

    // Progress
    const progressPercent = targetAmount > 0
      ? Math.min(100, (accumulatedAmount / targetAmount) * 100)
      : 0;
    const isComplete = accumulatedAmount >= targetAmount;

    // Coverage months
    const coverageMonths = monthlyBudget > 0
      ? accumulatedAmount / monthlyBudget
      : 0;

    // Projection: rolling 8-week average savings → weeks to target
    let weeksToTarget: number | null = null;
    if (!isComplete && records.length > 0) {
      const sortedRecords = [...records]
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.week_number - a.week_number;
        })
        .slice(0, 8);

      if (sortedRecords.length > 0) {
        const avgWeeklySavings =
          sortedRecords.reduce((sum, r) => sum + Math.max(0, r.economies), 0) /
          sortedRecords.length;

        if (avgWeeklySavings > 0) {
          const remaining = targetAmount - accumulatedAmount;
          weeksToTarget = Math.ceil(remaining / avgWeeklySavings);
        }
      }
    }

    return {
      targetAmount,
      accumulatedAmount,
      progressPercent,
      weeksToTarget,
      coverageMonths,
      isComplete,
      isPriority: !isComplete,
      monthlyBudgetEssential: monthlyBudget,
    };
  }, [engineOutput, records, wallet]);
}
