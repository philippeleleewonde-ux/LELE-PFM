/**
 * usePortfolioPerformance — LELE PFM
 *
 * Tracks actual portfolio performance vs projected performance
 * from the chosen strategy. Provides comparison data for the dashboard.
 */

import { useMemo } from 'react';
import { useJourneyStore } from '@/stores/journey-store';
import { CheckInRecord } from '@/types/investor-journey';

export interface PortfolioPerformance {
  currentValue: number;
  totalInvested: number;
  totalReturns: number;
  overallPerformance: number; // %
  vsProjection: number; // % difference actual vs projected
  projectedValue: number;
  checkInsCount: number;
  latestCheckIn: CheckInRecord | null;
  performanceHistory: PerformancePoint[];
  isAheadOfSchedule: boolean;
}

export interface PerformancePoint {
  month: number;
  actualValue: number;
  projectedValue: number;
  invested: number;
}

export function usePortfolioPerformance(): PortfolioPerformance | null {
  const checkIns = useJourneyStore((s) => s.checkIns);
  const activeStrategies = useJourneyStore((s) => s.activeStrategies);
  const chosenStrategyId = useJourneyStore((s) => s.chosenStrategyId);

  return useMemo(() => {
    if (!chosenStrategyId || checkIns.length === 0) return null;

    const strategy = activeStrategies.find((s) => s.id === chosenStrategyId);
    if (!strategy) return null;

    const completedCheckIns = checkIns.filter((c) => c.status === 'completed');
    const latestCheckIn = completedCheckIns[completedCheckIns.length - 1] ?? null;

    if (!latestCheckIn) return null;

    const currentValue = latestCheckIn.totalPortfolioValue;
    const totalInvested = latestCheckIn.totalInvested;
    const totalReturns = currentValue - totalInvested;
    const overallPerformance = totalInvested > 0
      ? ((currentValue - totalInvested) / totalInvested) * 100
      : 0;

    // Find projected value for the same month
    const monthIndex = completedCheckIns.length;
    const projection = strategy.projections.find((p) => p.month === monthIndex);
    const projectedValue = projection?.value ?? totalInvested;

    const vsProjection = projectedValue > 0
      ? ((currentValue - projectedValue) / projectedValue) * 100
      : 0;

    // Build performance history
    const performanceHistory: PerformancePoint[] = completedCheckIns.map((checkIn, idx) => {
      const monthNum = idx + 1;
      const proj = strategy.projections.find((p) => p.month === monthNum);
      return {
        month: monthNum,
        actualValue: checkIn.totalPortfolioValue,
        projectedValue: proj?.value ?? 0,
        invested: checkIn.totalInvested,
      };
    });

    return {
      currentValue: Math.round(currentValue),
      totalInvested: Math.round(totalInvested),
      totalReturns: Math.round(totalReturns),
      overallPerformance: Math.round(overallPerformance * 100) / 100,
      vsProjection: Math.round(vsProjection * 100) / 100,
      projectedValue: Math.round(projectedValue),
      checkInsCount: completedCheckIns.length,
      latestCheckIn,
      performanceHistory,
      isAheadOfSchedule: vsProjection > 0,
    };
  }, [checkIns, activeStrategies, chosenStrategyId]);
}
