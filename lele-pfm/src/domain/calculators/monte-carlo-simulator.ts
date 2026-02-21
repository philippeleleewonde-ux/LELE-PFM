/**
 * Monte Carlo Stochastic Simulator — LELE PFM
 *
 * Pure functions for running Monte Carlo simulations on investment portfolios.
 * Uses Box-Muller transform for normal random generation.
 * No side effects, no state.
 */

import { AllocationRecommendation } from '@/types/investment';

// ─── Types ───

export interface MonteCarloConfig {
  numSimulations: number;
  months: number;
  inflation: number;
}

export interface SimulationPath {
  month: number;
  value: number;
}

export interface MonteCarloResult {
  percentile5: SimulationPath[];
  percentile25: SimulationPath[];
  median: SimulationPath[];
  percentile75: SimulationPath[];
  percentile95: SimulationPath[];
  finalValues: {
    worst: number;
    belowAvg: number;
    median: number;
    aboveAvg: number;
    best: number;
  };
  probabilityOfLoss: number;
  expectedValue: number;
  investedCapital: number;
  confidenceInterval: { lower: number; upper: number };
}

// ─── Helpers ───

/**
 * Box-Muller transform for generating normally distributed random numbers.
 */
function randomNormal(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Compute weighted portfolio volatility from allocations.
 */
export function portfolioVolatility(allocations: AllocationRecommendation[]): number {
  if (allocations.length === 0) return 0;
  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0);
  return totalWeight > 0
    ? allocations.reduce((s, a) => s + (a.product.volatility * a.weight), 0) / totalWeight
    : 0;
}

// ─── Main simulation ───

const DEFAULT_CONFIG: MonteCarloConfig = {
  numSimulations: 1000,
  months: 36,
  inflation: 3,
};

/**
 * Run Monte Carlo simulation on a portfolio of allocations.
 *
 * For each simulation path, monthly contributions are added and compounded
 * with a stochastic return drawn from a normal distribution parameterized
 * by the portfolio's weighted return and volatility.
 */
export function runMonteCarlo(
  allocations: AllocationRecommendation[],
  monthlyInvestment: number,
  config?: Partial<MonteCarloConfig>,
): MonteCarloResult {
  const cfg: MonteCarloConfig = { ...DEFAULT_CONFIG, ...config };

  // Weighted annual return (%)
  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0);
  const annualReturn = totalWeight > 0
    ? allocations.reduce((s, a) => s + (a.product.returnRate * a.weight), 0) / totalWeight
    : 0;

  // Weighted annual volatility (%)
  const annualVol = portfolioVolatility(allocations);

  // Convert to monthly
  const monthlyReturn = annualReturn / 100 / 12;
  const monthlyVol = annualVol / 100 / Math.sqrt(12);

  // Run simulations
  const allPaths: SimulationPath[][] = [];
  const allFinalValues: number[] = [];

  for (let sim = 0; sim < cfg.numSimulations; sim++) {
    let value = 0;
    const path: SimulationPath[] = [];

    for (let m = 1; m <= cfg.months; m++) {
      const rndReturn = monthlyReturn + monthlyVol * randomNormal();
      value = (value + monthlyInvestment) * (1 + rndReturn);
      path.push({ month: m, value: Math.round(value) });
    }

    allPaths.push(path);
    allFinalValues.push(path[path.length - 1].value);
  }

  // Sort simulations by final value
  const sortedIndices = allFinalValues
    .map((v, i) => ({ v, i }))
    .sort((a, b) => a.v - b.v)
    .map((x) => x.i);

  // Extract percentile paths
  const p5Idx = Math.floor(5 * cfg.numSimulations / 100);
  const p25Idx = Math.floor(25 * cfg.numSimulations / 100);
  const p50Idx = Math.floor(50 * cfg.numSimulations / 100);
  const p75Idx = Math.floor(75 * cfg.numSimulations / 100);
  const p95Idx = Math.floor(95 * cfg.numSimulations / 100);

  const percentile5 = allPaths[sortedIndices[p5Idx]];
  const percentile25 = allPaths[sortedIndices[p25Idx]];
  const median = allPaths[sortedIndices[p50Idx]];
  const percentile75 = allPaths[sortedIndices[p75Idx]];
  const percentile95 = allPaths[sortedIndices[p95Idx]];

  // Invested capital
  const investedCapital = monthlyInvestment * cfg.months;

  // Probability of loss
  const lossCount = allFinalValues.filter((v) => v < investedCapital).length;
  const probabilityOfLoss = (lossCount / cfg.numSimulations) * 100;

  // Expected value (mean of all final values)
  const expectedValue = Math.round(
    allFinalValues.reduce((s, v) => s + v, 0) / cfg.numSimulations,
  );

  // Confidence interval (5th and 95th percentile final values)
  const sortedFinals = [...allFinalValues].sort((a, b) => a - b);
  const confidenceInterval = {
    lower: sortedFinals[p5Idx],
    upper: sortedFinals[p95Idx],
  };

  return {
    percentile5,
    percentile25,
    median,
    percentile75,
    percentile95,
    finalValues: {
      worst: sortedFinals[p5Idx],
      belowAvg: sortedFinals[p25Idx],
      median: sortedFinals[p50Idx],
      aboveAvg: sortedFinals[p75Idx],
      best: sortedFinals[p95Idx],
    },
    probabilityOfLoss,
    expectedValue,
    investedCapital,
    confidenceInterval,
  };
}
