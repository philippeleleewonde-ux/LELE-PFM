/**
 * Strategy Generator — LELE PFM
 *
 * Generates 5 investment strategies (Ultra-Safe → Aggressive) for the
 * selected assets, with compound interest projections per strategy.
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

// ─── Strategy Definitions ───

interface StrategyTemplate {
  id: StrategyId;
  labelKey: string;
  pillarWeights: Record<InvestmentPillar, number>;
}

const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    id: 'ultra_safe',
    labelKey: 'journey.strategies.ultraSafe',
    pillarWeights: { base_arriere: 70, amortisseur: 20, refuge: 10, croissance: 0 },
  },
  {
    id: 'safe',
    labelKey: 'journey.strategies.safe',
    pillarWeights: { base_arriere: 50, amortisseur: 25, refuge: 15, croissance: 10 },
  },
  {
    id: 'balanced',
    labelKey: 'journey.strategies.balanced',
    pillarWeights: { base_arriere: 30, amortisseur: 20, refuge: 20, croissance: 30 },
  },
  {
    id: 'growth',
    labelKey: 'journey.strategies.growth',
    pillarWeights: { base_arriere: 15, amortisseur: 15, refuge: 15, croissance: 55 },
  },
  {
    id: 'aggressive',
    labelKey: 'journey.strategies.aggressive',
    pillarWeights: { base_arriere: 10, amortisseur: 10, refuge: 10, croissance: 70 },
  },
];

// ─── Generator ───

export interface StrategyGeneratorInput {
  selectedAssets: SelectedAsset[];
  capitalInitial: number;
  monthlyContribution: number;
  durationMonths: number;
}

/**
 * Generate 5 investment strategies with projections.
 */
export function generateStrategies(input: StrategyGeneratorInput): InvestmentStrategy[] {
  const { selectedAssets, capitalInitial, monthlyContribution, durationMonths } = input;

  if (selectedAssets.length === 0) return [];

  // Group assets by pillar
  const assetsByPillar = groupByPillar(selectedAssets);

  return STRATEGY_TEMPLATES.map((template) => {
    // Compute per-asset allocation for this strategy
    const allocations = distributeAllocations(template.pillarWeights, assetsByPillar);

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

    const pillarWeights: PillarWeight[] = Object.entries(template.pillarWeights).map(
      ([pillar, weight]) => ({ pillar: pillar as InvestmentPillar, weight }),
    );

    return {
      id: template.id,
      labelKey: template.labelKey,
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
