/**
 * Investment Simulator — LELE PFM
 *
 * Pure functions for investment projections, allocation recommendations,
 * and strategy comparisons. No side effects, no state.
 */

import {
  InvestorProfile,
  InvestmentProduct,
  AllocationRecommendation,
  InvestmentProjection,
  RiskTolerance,
} from '@/types/investment';
import { getProductsForCountry, filterShariaProducts } from '@/constants/investment-products';

// ─── Risk score mapping ───
const RISK_SCORES: Record<RiskTolerance, number> = {
  conservative: 2,
  moderate: 3,
  aggressive: 4,
};

/**
 * Simulate compound investment returns over N months.
 * Uses deterministic monthly compounding (no stochastic simulation).
 */
export function simulateInvestment(
  monthlyAmount: number,
  annualReturn: number,
  volatility: number,
  months: number,
  inflation: number,
): InvestmentProjection[] {
  const projections: InvestmentProjection[] = [];
  const monthlyReturn = annualReturn / 100 / 12;
  const monthlyInflation = inflation / 100 / 12;
  let invested = 0;
  let total = 0;

  for (let m = 1; m <= months; m++) {
    invested += monthlyAmount;
    total = (total + monthlyAmount) * (1 + monthlyReturn);
    const returns = total - invested;
    const inflationFactor = Math.pow(1 + monthlyInflation, m);
    const inflationAdjusted = total / inflationFactor;

    projections.push({
      month: m,
      invested: Math.round(invested),
      returns: Math.round(returns),
      total: Math.round(total),
      inflationAdjusted: Math.round(inflationAdjusted),
    });
  }

  return projections;
}

/**
 * Recommend allocation based on investor profile and available products.
 */
export function recommendAllocation(
  profile: InvestorProfile,
  countryCode: string,
  monthlyBudget: number,
): AllocationRecommendation[] {
  // Get products for this country
  let products = getProductsForCountry(countryCode);

  // Filter by sharia compliance
  products = filterShariaProducts(products, profile.shariaCompliance);

  if (products.length === 0) return [];

  // Score each product based on profile fit
  const maxRisk = RISK_SCORES[profile.riskTolerance];
  const scored = products
    .filter((p) => p.riskLevel <= maxRisk + 1) // Allow one level above tolerance
    .map((p) => ({
      product: p,
      score: scoreProduct(p, profile),
    }))
    .sort((a, b) => b.score - a.score);

  // Pick top products (max 5)
  const selected = scored.slice(0, Math.min(5, scored.length));
  const totalScore = selected.reduce((s, p) => s + p.score, 0);

  // Distribute budget by score weight
  return selected.map((s) => {
    const weight = Math.round((s.score / totalScore) * 100);
    const monthlyAmount = Math.round(monthlyBudget * weight / 100);
    const projections12 = simulateInvestment(monthlyAmount, s.product.returnRate, s.product.volatility, 12, 0);
    const projections36 = simulateInvestment(monthlyAmount, s.product.returnRate, s.product.volatility, 36, 0);

    return {
      product: s.product,
      weight,
      monthlyAmount,
      projectedReturn12m: projections12[11]?.returns ?? 0,
      projectedReturn36m: projections36[35]?.returns ?? 0,
    };
  });
}

/**
 * Score a product based on how well it fits the investor profile.
 */
function scoreProduct(product: InvestmentProduct, profile: InvestorProfile): number {
  let score = 0;

  // Return rate (higher = better, up to a point)
  score += product.returnRate * 2;

  // Risk alignment
  const riskMax = RISK_SCORES[profile.riskTolerance];
  if (product.riskLevel <= riskMax) {
    score += (riskMax - product.riskLevel + 1) * 5;
  } else {
    score -= (product.riskLevel - riskMax) * 10;
  }

  // Liquidity preference for short horizon
  if (profile.horizon === 'short') {
    if (product.liquidity === 'immediate' || product.liquidity === 'days') score += 10;
    if (product.liquidity === 'locked') score -= 15;
  } else if (profile.horizon === 'long') {
    if (product.liquidity === 'locked' || product.liquidity === 'months') score += 5;
  }

  // Tax advantage bonus
  if (product.taxAdvantaged) score += 8;

  // Sharia compliance bonus if required/preferred
  if (profile.shariaCompliance === 'required' && product.shariaCompliant) score += 10;
  if (profile.shariaCompliance === 'preferred' && product.shariaCompliant) score += 5;

  // Preferred asset class bonus
  if (profile.preferredAssets.includes(product.asset)) score += 8;

  return Math.max(0, score);
}

/**
 * Calculate weighted portfolio return from allocations.
 */
export function portfolioReturn(allocations: AllocationRecommendation[]): number {
  if (allocations.length === 0) return 0;
  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0);
  const weightedReturn = allocations.reduce(
    (s, a) => s + (a.product.returnRate * a.weight),
    0,
  );
  return totalWeight > 0 ? weightedReturn / totalWeight : 0;
}

/**
 * Compare savings-only vs investment strategy over 36 months.
 */
export function compareStrategies(
  monthlyAmount: number,
  savingsRate: number,
  portfolioReturnRate: number,
  inflation: number,
): { savings36m: number; investment36m: number; delta: number; deltaPercent: number } {
  // Pure savings (compound at savings rate)
  const savingsProjection = simulateInvestment(monthlyAmount, savingsRate, 0, 36, inflation);
  const savings36m = savingsProjection[35]?.inflationAdjusted ?? 0;

  // Investment (compound at portfolio rate)
  const investProjection = simulateInvestment(monthlyAmount, portfolioReturnRate, 0, 36, inflation);
  const investment36m = investProjection[35]?.inflationAdjusted ?? 0;

  const delta = investment36m - savings36m;
  const deltaPercent = savings36m > 0 ? Math.round((delta / savings36m) * 100) : 0;

  return { savings36m, investment36m, delta, deltaPercent };
}
