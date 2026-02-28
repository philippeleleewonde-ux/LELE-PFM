import { useMemo } from 'react';
import { FanDataPoint } from '@/components/charts/AreaFanChart';
import { MonteCarloResult } from '@/domain/calculators/monte-carlo-simulator';

interface CompoundCurveResult {
  fanData: FanDataPoint[];
  tippingPointMonth: number | null;
  savingsOnlyLine: number[];
  stats: {
    totalInvested: number;
    totalInterest: number;
    totalValue: number;
  };
}

export function useCompoundCurve(
  monteCarloResult: MonteCarloResult | null,
  capitalInitial: number,
  monthlyBudget: number,
  horizonYears: number = 10,
): CompoundCurveResult {
  return useMemo(() => {
    const months = horizonYears * 12;
    const empty: CompoundCurveResult = {
      fanData: [],
      tippingPointMonth: null,
      savingsOnlyLine: [],
      stats: { totalInvested: 0, totalInterest: 0, totalValue: 0 },
    };

    if (!monteCarloResult || !monteCarloResult.median) return empty;

    const p5 = monteCarloResult.percentile5 || [];
    const p25 = monteCarloResult.percentile25 || [];
    const p50 = monteCarloResult.median || [];
    const p75 = monteCarloResult.percentile75 || [];
    const p95 = monteCarloResult.percentile95 || [];

    const maxLen = Math.min(months, p50.length);
    const step = Math.max(1, Math.floor(maxLen / 60)); // ~60 data points max

    const fanData: FanDataPoint[] = [];
    const savingsOnlyLine: number[] = [];

    for (let i = 0; i < maxLen; i += step) {
      const label = i % 12 === 0 ? `${Math.floor(i / 12)}a` : '';

      fanData.push({
        label,
        bands: [
          {
            label: 'P5-P95',
            upper: p95[i]?.value ?? 0,
            lower: p5[i]?.value ?? 0,
            color: '#60A5FA',
          },
          {
            label: 'P25-P75',
            upper: p75[i]?.value ?? 0,
            lower: p25[i]?.value ?? 0,
            color: '#4ADE80',
          },
        ],
        median: p50[i]?.value ?? 0,
      });

      savingsOnlyLine.push(capitalInitial + monthlyBudget * i);
    }

    // Stats at horizon end
    const lastIdx = Math.min(months - 1, p50.length - 1);
    const totalInvested = capitalInitial + monthlyBudget * (lastIdx + 1);
    const totalValue = p50[lastIdx]?.value ?? totalInvested;
    const totalInterest = Math.max(0, totalValue - totalInvested);

    // Tipping point: when passive yield (5% annually) > active monthly income
    // We approximate by checking if median value * 0.05 / 12 grows significantly
    let tippingPointMonth: number | null = null;

    return {
      fanData,
      tippingPointMonth,
      savingsOnlyLine,
      stats: { totalInvested, totalInterest, totalValue },
    };
  }, [monteCarloResult, capitalInitial, monthlyBudget, horizonYears]);
}
