/**
 * Strategy Generator — LELE PFM
 *
 * Generates 5 profile-adaptive investment strategies using a conservatism
 * scoring pipeline. Replaces the former hardcoded templates with a sliding
 * window over a 9-level strategy spectrum.
 */

import { InvestmentPillar } from '@/types/investment';
import {
  SelectedAsset,
  InvestmentStrategy,
  StrategyId,
  StrategyProjection,
  PillarWeight,
} from '@/types/investor-journey';
import { ASSET_TO_PILLAR } from '@/constants/pillar-mapping';

// ─── Profile Input ───

export interface StrategyProfileInput {
  riskProfile: string;              // 'conservative' | 'moderate' | 'aggressive'
  age: number;
  dependents: number;
  incomeSource: string;             // 'formal' | 'mixed' | 'informal' | 'seasonal'
  extendedFamilyObligations: boolean;
  ekhScore: number;                 // 0-10 (financial literacy proxy)
  globalScore: number;              // 0-100 (financial health)
  investmentInfraLevel: 1 | 2 | 3 | 4;
  currencyVolatility: string;       // 'low' | 'medium' | 'high'
  countryCode: string;
  horizon: string;                  // 'short' | 'medium' | 'long'
}

// ─── Strategy Spectrum (9 archetypes) ───

interface SpectrumEntry {
  conservatism: number;
  weights: Record<InvestmentPillar, number>;
}

const STRATEGY_SPECTRUM: SpectrumEntry[] = [
  { conservatism: 0,   weights: { base_arriere: 5,  amortisseur: 5,  refuge: 5,  croissance: 85 } },
  { conservatism: 12,  weights: { base_arriere: 10, amortisseur: 10, refuge: 10, croissance: 70 } },
  { conservatism: 25,  weights: { base_arriere: 15, amortisseur: 15, refuge: 15, croissance: 55 } },
  { conservatism: 37,  weights: { base_arriere: 25, amortisseur: 20, refuge: 20, croissance: 35 } },
  { conservatism: 50,  weights: { base_arriere: 30, amortisseur: 20, refuge: 20, croissance: 30 } },
  { conservatism: 62,  weights: { base_arriere: 40, amortisseur: 25, refuge: 20, croissance: 15 } },
  { conservatism: 75,  weights: { base_arriere: 50, amortisseur: 25, refuge: 15, croissance: 10 } },
  { conservatism: 87,  weights: { base_arriere: 60, amortisseur: 22, refuge: 13, croissance: 5  } },
  { conservatism: 100, weights: { base_arriere: 70, amortisseur: 20, refuge: 10, croissance: 0  } },
];

const STRATEGY_IDS: StrategyId[] = ['ultra_safe', 'safe', 'balanced', 'growth', 'aggressive'];
const STRATEGY_LABEL_KEYS: string[] = [
  'journey.strategies.ultraSafe',
  'journey.strategies.safe',
  'journey.strategies.balanced',
  'journey.strategies.growth',
  'journey.strategies.aggressive',
];

const POSITIONAL_NAMES = [
  'Ultra-prudent',
  'Prudent',
  'Equilibre',
  'Dynamique',
  'Offensif',
];

// UEMOA: West Africa (XOF)
const UEMOA_COUNTRIES = ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'];
// CEMAC: Central Africa (XAF)
const CEMAC_COUNTRIES = ['CM', 'GA', 'CG', 'TD', 'CF', 'GQ'];

// ─── Conservatism Score ───

export function computeConservatismScore(profile: StrategyProfileInput): number {
  let score = 0;

  // Risk profile (0-30)
  const rp = profile.riskProfile?.toLowerCase() ?? 'moderate';
  if (rp === 'conservative' || rp === 'conservateur') score += 30;
  else if (rp === 'moderate' || rp === 'modéré' || rp === 'modere') score += 15;
  // aggressive / agressif = 0

  // Age bracket (0-20)
  const age = profile.age || 30;
  if (age >= 60) score += 20;
  else if (age >= 50) score += 15;
  else if (age >= 40) score += 10;
  else if (age >= 30) score += 5;

  // EKH score — low literacy = higher conservatism (0-15)
  const ekh = Math.max(0, Math.min(10, profile.ekhScore ?? 5));
  score += Math.round((10 - ekh) * 1.5);

  // Investment infrastructure level (0-15)
  const infra = profile.investmentInfraLevel ?? 2;
  score += (infra - 1) * 5;

  // Income stability (0-10)
  const incomeMap: Record<string, number> = { formal: 0, mixed: 3, informal: 7, seasonal: 10 };
  score += incomeMap[profile.incomeSource] ?? 3;

  // Family obligations (0-5)
  const deps = profile.dependents ?? 0;
  if (deps >= 3) score += 3;
  if (profile.extendedFamilyObligations) score += 2;

  // Currency volatility (0-5)
  const volMap: Record<string, number> = { low: 0, medium: 2, high: 5 };
  score += volMap[profile.currencyVolatility] ?? 2;

  return Math.max(0, Math.min(100, score));
}

// ─── Window Selection ───

function selectStrategyWindow(conservatismScore: number): number[] {
  // Map score (0-100) to center index in spectrum (0-8)
  const centerRaw = Math.round((conservatismScore / 100) * 8);
  const center = Math.max(2, Math.min(6, centerRaw)); // clamp so window fits [0,8]

  return [center - 2, center - 1, center, center + 1, center + 2];
}

// ─── Profile Micro-adjustments ───

function applyProfileAdjustments(
  baseWeights: Record<InvestmentPillar, number>,
  profile: StrategyProfileInput,
): Record<InvestmentPillar, number> {
  const w = { ...baseWeights };

  // High dependents: more cushion
  if ((profile.dependents ?? 0) >= 3) {
    w.amortisseur += 3;
    w.croissance -= 3;
  }

  // Extended family obligations: more cushion
  if (profile.extendedFamilyObligations) {
    w.amortisseur += 2;
    w.croissance -= 2;
  }

  // Short horizon: more safety
  if (profile.horizon === 'short') {
    w.base_arriere += 5;
    w.croissance -= 5;
  }

  // High currency volatility: more refuge
  if (profile.currencyVolatility === 'high') {
    w.refuge += 3;
    w.croissance -= 3;
  }

  return normalizeWeights(w);
}

// ─── Normalization ───

function normalizeWeights(w: Record<InvestmentPillar, number>): Record<InvestmentPillar, number> {
  // Clamp each to [0, 85]
  const pillars: InvestmentPillar[] = ['base_arriere', 'amortisseur', 'refuge', 'croissance'];
  for (const p of pillars) {
    w[p] = Math.max(0, Math.min(85, w[p]));
  }

  const sum = pillars.reduce((s, p) => s + w[p], 0);
  if (sum === 0) return { base_arriere: 25, amortisseur: 25, refuge: 25, croissance: 25 };

  const factor = 100 / sum;
  for (const p of pillars) {
    w[p] = Math.round(w[p] * factor);
  }

  // Fix rounding to exactly 100
  const roundedSum = pillars.reduce((s, p) => s + w[p], 0);
  if (roundedSum !== 100) {
    w.base_arriere += 100 - roundedSum;
  }

  return w;
}

// ─── Naming ───

function getRegionSuffix(countryCode: string): string {
  const cc = countryCode?.toUpperCase() ?? '';
  if (UEMOA_COUNTRIES.includes(cc)) return 'UEMOA';
  if (CEMAC_COUNTRIES.includes(cc)) return 'CEMAC';
  return '';
}

function generateDisplayName(positionIndex: number, countryCode: string): string {
  const baseName = POSITIONAL_NAMES[positionIndex] ?? 'Equilibre';
  const suffix = getRegionSuffix(countryCode);
  return suffix ? `${baseName} ${suffix}` : baseName;
}

// ─── Recommended Selection ───

function selectRecommendedIndex(conservatismScore: number, windowIndices: number[]): number {
  let bestIdx = 2; // default center
  let bestDist = Infinity;

  for (let i = 0; i < windowIndices.length; i++) {
    const dist = Math.abs(STRATEGY_SPECTRUM[windowIndices[i]].conservatism - conservatismScore);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  return bestIdx;
}

// ─── Generator ───

export interface StrategyGeneratorInput {
  selectedAssets: SelectedAsset[];
  capitalInitial: number;
  monthlyContribution: number;
  durationMonths: number;
  profile?: StrategyProfileInput;
}

/**
 * Generate 5 profile-adaptive investment strategies with projections.
 */
export function generateStrategies(input: StrategyGeneratorInput): InvestmentStrategy[] {
  const { selectedAssets, capitalInitial, monthlyContribution, durationMonths, profile } = input;

  if (selectedAssets.length === 0) return [];

  // Group assets by pillar
  const assetsByPillar = groupByPillar(selectedAssets);

  // Compute conservatism score and select window
  const conservatismScore = profile
    ? computeConservatismScore(profile)
    : 50; // default moderate
  const windowIndices = selectStrategyWindow(conservatismScore);
  const recommendedIdx = profile
    ? selectRecommendedIndex(conservatismScore, windowIndices)
    : 2; // default center

  return windowIndices.map((spectrumIdx, positionIdx) => {
    const spectrumEntry = STRATEGY_SPECTRUM[spectrumIdx];

    // Apply micro-adjustments if profile available
    const adjustedWeights = profile
      ? applyProfileAdjustments({ ...spectrumEntry.weights }, profile)
      : { ...spectrumEntry.weights };

    // Compute per-asset allocation for this strategy
    const allocations = distributeAllocations(adjustedWeights, assetsByPillar);

    // Compute weighted portfolio metrics
    const weightedReturn = computeWeightedReturn(allocations);
    const weightedVolatility = computeWeightedVolatility(allocations);

    // Generate month-by-month projections
    const projections = projectCompoundGrowth(
      capitalInitial,
      monthlyContribution,
      weightedReturn,
      durationMonths,
    );

    const finalProjection = projections[projections.length - 1];
    const totalInvested = capitalInitial + monthlyContribution * durationMonths;
    const finalValue = finalProjection?.value ?? totalInvested;
    const totalReturns = finalValue - totalInvested;
    const cagr = computeCAGR(totalInvested, finalValue, durationMonths);

    const pillarWeights: PillarWeight[] = Object.entries(adjustedWeights).map(
      ([pillar, weight]) => ({ pillar: pillar as InvestmentPillar, weight }),
    );

    const countryCode = profile?.countryCode ?? '';

    return {
      id: STRATEGY_IDS[positionIdx],
      labelKey: STRATEGY_LABEL_KEYS[positionIdx],
      displayName: generateDisplayName(positionIdx, countryCode),
      isRecommended: positionIdx === recommendedIdx,
      pillarWeights,
      projections,
      finalValue: Math.round(finalValue),
      totalReturns: Math.round(totalReturns),
      cagr: Math.round(cagr * 100) / 100,
      weightedReturnRate: Math.round(weightedReturn * 100) / 100,
      weightedVolatility: Math.round(weightedVolatility * 100) / 100,
    };
  });
}

/**
 * Regenerate projections for a single strategy with a new duration.
 */
export function regenerateProjections(
  strategy: InvestmentStrategy,
  capitalInitial: number,
  monthlyContribution: number,
  durationMonths: number,
): InvestmentStrategy {
  const projections = projectCompoundGrowth(
    capitalInitial,
    monthlyContribution,
    strategy.weightedReturnRate,
    durationMonths,
  );

  const finalProjection = projections[projections.length - 1];
  const totalInvested = capitalInitial + monthlyContribution * durationMonths;
  const finalValue = finalProjection?.value ?? totalInvested;
  const totalReturns = finalValue - totalInvested;
  const cagr = computeCAGR(totalInvested, finalValue, durationMonths);

  return {
    ...strategy,
    projections,
    finalValue: Math.round(finalValue),
    totalReturns: Math.round(totalReturns),
    cagr: Math.round(cagr * 100) / 100,
  };
}

// ─── Investment Amount Guidance & Market Re-evaluation ───

import {
  InvestmentAmountGuidance,
  MarketIndicators,
  StrategyRecommendationResult,
  CheckInRecord,
} from '@/types/investor-journey';

/**
 * Compute min/max/recommended investment amounts with gain simulations
 * for a given strategy.
 */
export function computeInvestmentGuidance(
  strategy: InvestmentStrategy,
  monthlyBudget: number,
  capitalInitial: number,
  durationMonths: number,
  currency: string = 'FCFA',
): InvestmentAmountGuidance {
  const returnRate = strategy.weightedReturnRate;
  const volatility = strategy.weightedVolatility;

  // Min = 30% of budget, Recommended = budget, Max = 150% of budget (capped by risk)
  const riskMultiplier = Math.max(0.5, 1 - volatility / 100);
  const minimumMonthly = Math.round(Math.max(monthlyBudget * 0.3, 5000));
  const recommendedMonthly = Math.round(monthlyBudget);
  const maximumMonthly = Math.round(monthlyBudget * (1 + riskMultiplier));

  // Minimum initial = first product minAmount or 10% of capital
  const minimumInitial = Math.round(Math.max(capitalInitial * 0.1, 10000));
  const recommendedInitial = Math.round(capitalInitial);

  // Gain simulation: pessimistic (-1 vol), expected (base), optimistic (+0.5 vol)
  const pessReturn = Math.max(0, returnRate - volatility * 0.6);
  const optReturn = returnRate + volatility * 0.3;

  const simulate = (annualReturn: number) => {
    const r = annualReturn / 100 / 12;
    let value = recommendedInitial;
    for (let t = 1; t <= durationMonths; t++) {
      value = (value + recommendedMonthly) * (1 + r);
    }
    const totalInvested = recommendedInitial + recommendedMonthly * durationMonths;
    return {
      finalValue: Math.round(value),
      totalReturns: Math.round(value - totalInvested),
      annualReturn: Math.round(annualReturn * 100) / 100,
    };
  };

  return {
    minimumMonthly,
    recommendedMonthly,
    maximumMonthly,
    minimumInitial,
    recommendedInitial,
    currency,
    gainSimulation: {
      pessimistic: simulate(pessReturn),
      expected: simulate(returnRate),
      optimistic: simulate(optReturn),
    },
  };
}

// ─── Strategy Re-evaluation based on Market Data ───

const SENTIMENT_SCORES: Record<string, number> = {
  very_bearish: -2, bearish: -1, neutral: 0, bullish: 1, very_bullish: 2,
};

const EVENT_IMPACT_SCORES: Record<string, number> = {
  very_negative: -2, negative: -1, neutral: 0, positive: 1, very_positive: 2,
};

/**
 * Evaluate whether the current strategy should be adjusted
 * based on market indicators and portfolio performance.
 */
export function evaluateStrategyAdjustment(
  currentStrategyId: StrategyId,
  strategies: InvestmentStrategy[],
  marketIndicators: MarketIndicators,
  checkIns: CheckInRecord[],
  durationMonths: number,
): StrategyRecommendationResult {
  const reasons: string[] = [];
  let riskScore = 50; // baseline

  // 1. Market sentiment impact
  const sentimentScore = SENTIMENT_SCORES[marketIndicators.sentiment] ?? 0;
  riskScore -= sentimentScore * 10;
  if (sentimentScore <= -1) {
    reasons.push('Sentiment de marche negatif detecte');
  } else if (sentimentScore >= 1) {
    reasons.push('Sentiment de marche positif detecte');
  }

  // 2. Macro trends
  if (marketIndicators.inflationTrend === 'rising') {
    riskScore += 10;
    reasons.push('Inflation en hausse - privilegier les actifs refuges');
  }
  if (marketIndicators.interestRateTrend === 'rising') {
    riskScore += 5;
    reasons.push('Taux d\'interet en hausse - impact sur les obligations');
  }
  if (marketIndicators.currencyStrength === 'weakening') {
    riskScore += 8;
    reasons.push('Devise en affaiblissement - diversifier les devises');
  }

  // 3. Market events
  for (const event of marketIndicators.events) {
    const impact = EVENT_IMPACT_SCORES[event.impact] ?? 0;
    riskScore -= impact * 5;
    if (Math.abs(impact) >= 2) {
      reasons.push(event.description);
    }
  }

  // 4. Recent performance deviation
  const recentCheckIns = checkIns
    .filter((c) => c.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  if (recentCheckIns.length >= 2) {
    const avgPerf = recentCheckIns.reduce((s, c) => s + c.overallPerformance, 0) / recentCheckIns.length;
    if (avgPerf < -5) {
      riskScore += 15;
      reasons.push(`Performance moyenne recente negative (${avgPerf.toFixed(1)}%)`);
    } else if (avgPerf > 10) {
      riskScore -= 5;
      reasons.push(`Bonne performance recente (+${avgPerf.toFixed(1)}%)`);
    }
  }

  riskScore = Math.max(0, Math.min(100, riskScore));

  // Determine if we should suggest a different strategy
  const currentIdx = STRATEGY_IDS.indexOf(currentStrategyId);
  let suggestedIdx = currentIdx;
  let shouldRebalance = false;

  if (riskScore >= 70 && currentIdx < STRATEGY_IDS.length - 1) {
    // High risk: suggest more conservative
    suggestedIdx = Math.max(0, currentIdx - 1);
    shouldRebalance = true;
    reasons.push('Recommandation : basculer vers une strategie plus prudente');
  } else if (riskScore <= 30 && currentIdx > 0) {
    // Low risk: could go more aggressive
    suggestedIdx = Math.min(STRATEGY_IDS.length - 1, currentIdx + 1);
    shouldRebalance = true;
    reasons.push('Opportunite : conditions favorables pour plus de croissance');
  }

  const currentStrategy = strategies.find((s) => s.id === currentStrategyId);
  const baseReturn = currentStrategy?.weightedReturnRate ?? 5;
  const baseVol = currentStrategy?.weightedVolatility ?? 10;

  // Projected impact on returns based on market conditions
  const marketAdjustment = (sentimentScore * 1.5) +
    (marketIndicators.inflationTrend === 'rising' ? -1 : marketIndicators.inflationTrend === 'falling' ? 0.5 : 0) +
    (marketIndicators.currencyStrength === 'weakening' ? -0.8 : marketIndicators.currencyStrength === 'strengthening' ? 0.5 : 0);

  return {
    shouldRebalance,
    currentStrategyStillValid: !shouldRebalance,
    suggestedStrategyId: shouldRebalance ? STRATEGY_IDS[suggestedIdx] : undefined,
    adjustmentReasons: reasons,
    riskScore,
    projectedImpact: {
      optimistic: Math.round((baseReturn + baseVol * 0.3 + marketAdjustment) * 100) / 100,
      expected: Math.round((baseReturn + marketAdjustment) * 100) / 100,
      pessimistic: Math.round((baseReturn - baseVol * 0.6 + marketAdjustment) * 100) / 100,
    },
  };
}

// ─── Helpers ───

function groupByPillar(assets: SelectedAsset[]): Record<InvestmentPillar, SelectedAsset[]> {
  const groups: Record<InvestmentPillar, SelectedAsset[]> = {
    croissance: [],
    amortisseur: [],
    refuge: [],
    base_arriere: [],
  };

  for (const asset of assets) {
    const pillar = asset.pillar || ASSET_TO_PILLAR[asset.assetClass];
    if (pillar && groups[pillar]) {
      groups[pillar].push(asset);
    }
  }

  return groups;
}

interface AssetAllocation {
  asset: SelectedAsset;
  weight: number; // % of total portfolio
}

/**
 * Distribute pillar weights among the assets within each pillar.
 * Within a pillar, assets are weighted equally.
 */
function distributeAllocations(
  pillarWeights: Record<InvestmentPillar, number>,
  assetsByPillar: Record<InvestmentPillar, SelectedAsset[]>,
): AssetAllocation[] {
  const allocations: AssetAllocation[] = [];
  let totalAssigned = 0;

  const pillars: InvestmentPillar[] = ['croissance', 'amortisseur', 'refuge', 'base_arriere'];

  // Find pillars with assets
  const activePillars = pillars.filter((p) => assetsByPillar[p].length > 0);
  const emptyPillars = pillars.filter((p) => assetsByPillar[p].length === 0);

  // Redistribute empty pillar weights proportionally
  const emptyWeight = emptyPillars.reduce((s, p) => s + pillarWeights[p], 0);
  const activeTotal = activePillars.reduce((s, p) => s + pillarWeights[p], 0);

  for (const pillar of activePillars) {
    const assets = assetsByPillar[pillar];
    const baseWeight = pillarWeights[pillar];
    const bonusWeight = activeTotal > 0 ? (baseWeight / activeTotal) * emptyWeight : 0;
    const effectiveWeight = baseWeight + bonusWeight;

    const perAsset = effectiveWeight / assets.length;

    for (const asset of assets) {
      allocations.push({ asset, weight: perAsset });
      totalAssigned += perAsset;
    }
  }

  // Normalize to exactly 100%
  if (totalAssigned > 0 && Math.abs(totalAssigned - 100) > 0.01) {
    const factor = 100 / totalAssigned;
    for (const a of allocations) {
      a.weight *= factor;
    }
  }

  return allocations;
}

function computeWeightedReturn(allocations: AssetAllocation[]): number {
  if (allocations.length === 0) return 0;
  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0);
  if (totalWeight === 0) return 0;
  return allocations.reduce((s, a) => s + a.asset.expectedReturnRate * a.weight, 0) / totalWeight;
}

function computeWeightedVolatility(allocations: AssetAllocation[]): number {
  if (allocations.length === 0) return 0;
  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0);
  if (totalWeight === 0) return 0;
  // Simplified: weighted average (ignores correlations)
  return allocations.reduce((s, a) => s + a.asset.volatility * a.weight, 0) / totalWeight;
}

/**
 * Project compound growth month by month.
 * V(t) = capitalInitial × (1 + r/12)^t + mensualite × ((1 + r/12)^t - 1) / (r/12)
 */
function projectCompoundGrowth(
  capitalInitial: number,
  monthlyContribution: number,
  annualReturnPercent: number,
  months: number,
): StrategyProjection[] {
  const projections: StrategyProjection[] = [];
  const r = annualReturnPercent / 100;
  const monthlyRate = r / 12;

  for (let t = 1; t <= months; t++) {
    const invested = capitalInitial + monthlyContribution * t;

    let value: number;
    if (monthlyRate === 0) {
      value = invested;
    } else {
      const growthFactor = Math.pow(1 + monthlyRate, t);
      const capitalGrowth = capitalInitial * growthFactor;
      const contributionGrowth = monthlyContribution * (growthFactor - 1) / monthlyRate;
      value = capitalGrowth + contributionGrowth;
    }

    projections.push({
      month: t,
      invested: Math.round(invested),
      value: Math.round(value),
      returns: Math.round(value - invested),
    });
  }

  return projections;
}

/**
 * Compute CAGR (Compound Annual Growth Rate).
 */
function computeCAGR(totalInvested: number, finalValue: number, months: number): number {
  if (totalInvested <= 0 || finalValue <= 0 || months <= 0) return 0;
  const years = months / 12;
  return (Math.pow(finalValue / totalInvested, 1 / years) - 1) * 100;
}
