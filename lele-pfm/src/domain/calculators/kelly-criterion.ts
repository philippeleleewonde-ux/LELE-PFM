/**
 * Kelly Criterion Position Sizing — LELE PFM
 *
 * Pure functions for optimal position sizing using the Kelly Criterion.
 * No side effects, no state.
 */

import { AllocationRecommendation } from '@/types/investment';

// ─── Types ───

export interface KellyInput {
  winProbability: number;    // 0.0 to 1.0
  avgGainPercent: number;    // e.g., 15 means 15%
  avgLossPercent: number;    // e.g., 10 means 10%
}

export interface KellyResult {
  optimalFraction: number;   // 0.0 to 1.0
  halfKelly: number;
  quarterKelly: number;
  edgePercent: number;
  kellyGrowthRate: number;
  ruinProbability: number;   // Rough estimate of ruin risk at full Kelly
  verdict: 'bet' | 'skip' | 'edge_too_small';
  explanation: string;
}

export interface PositionSizeResult {
  assetName: string;
  productCode: string;
  currentWeight: number;
  kellyOptimal: number;
  halfKellyWeight: number;
  status: 'optimal' | 'overweight' | 'underweight';
  delta: number;
}

// ─── Helpers ───

/**
 * Normal CDF approximation (Abramowitz & Stegun).
 * No external lib needed.
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.8212560 + t * 1.3302744))));
  return x > 0 ? 1 - p : p;
}

// ─── Public functions ───

/**
 * Estimate win probability from product return/volatility data.
 * Uses monthly return z-score through the normal CDF.
 */
export function estimateWinProbability(annualReturn: number, annualVolatility: number): number {
  if (annualVolatility <= 0) return annualReturn > 0 ? 0.95 : 0.5;
  const monthlyReturn = annualReturn / 12;
  const monthlyVol = annualVolatility / Math.sqrt(12);
  return normalCDF(monthlyReturn / monthlyVol);
}

/**
 * Core Kelly calculation.
 * Returns optimal fraction capped at 25% with verdict.
 */
export function calculateKelly(input: KellyInput): KellyResult {
  const { winProbability: p, avgGainPercent, avgLossPercent } = input;
  const q = 1 - p;
  const b = avgLossPercent > 0 ? avgGainPercent / avgLossPercent : 0;

  let f = b > 0 ? (b * p - q) / b : 0;
  f = Math.max(0, Math.min(0.25, f)); // Cap at 25%

  const edge = (p * avgGainPercent) - (q * avgLossPercent);
  const growthRate = f > 0 ? p * Math.log(1 + f * b) + q * Math.log(1 - f) : 0;

  // Rough ruin probability estimate: (q/p)^n where n = capital units
  // At full Kelly, approximate with geometric decay model
  const ruinProbability = p > 0 && p > q ? Math.pow(q / p, 10) : f > 0 ? 0.5 : 0;

  let verdict: 'bet' | 'skip' | 'edge_too_small';
  let explanation: string;
  if (f <= 0) {
    verdict = 'skip';
    explanation = 'Pas d\'avantage mathematique. Ne pas investir.';
  } else if (f < 0.02) {
    verdict = 'edge_too_small';
    explanation = 'Avantage trop faible pour justifier une position significative.';
  } else {
    verdict = 'bet';
    explanation = `Allocation optimale: ${(f * 100).toFixed(1)}%. Le demi-Kelly (${(f * 50).toFixed(1)}%) offre un meilleur rapport rendement/risque.`;
  }

  return {
    optimalFraction: f,
    halfKelly: f / 2,
    quarterKelly: f / 4,
    edgePercent: edge,
    kellyGrowthRate: growthRate,
    ruinProbability,
    verdict,
    explanation,
  };
}

/**
 * Analyze full portfolio with Kelly sizing.
 * Uses half-Kelly for safety.
 */
export function analyzePortfolioKelly(allocations: AllocationRecommendation[]): PositionSizeResult[] {
  return allocations.map((a) => {
    const winProb = estimateWinProbability(a.product.returnRate, a.product.volatility);
    const monthlyVol = a.product.volatility / Math.sqrt(12);
    const monthlyReturn = a.product.returnRate / 12;
    const avgGain = monthlyReturn + monthlyVol;
    const avgLoss = Math.abs(monthlyReturn - monthlyVol);

    const kelly = calculateKelly({
      winProbability: winProb,
      avgGainPercent: avgGain,
      avgLossPercent: avgLoss > 0 ? avgLoss : 0.1,
    });

    // Scale Kelly to portfolio level (use half-Kelly for safety)
    const kellyPct = kelly.halfKelly * 100;
    const current = a.weight;
    const delta = current - kellyPct;

    let status: 'optimal' | 'overweight' | 'underweight';
    if (Math.abs(delta) < 3) status = 'optimal';
    else if (delta > 0) status = 'overweight';
    else status = 'underweight';

    return {
      assetName: a.product.name,
      productCode: a.product.code,
      currentWeight: current,
      kellyOptimal: Math.round(kellyPct * 10) / 10,
      halfKellyWeight: Math.round(kellyPct * 10) / 10,
      status,
      delta: Math.round(delta * 10) / 10,
    };
  });
}
