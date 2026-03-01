/**
 * Asset Recommender — LELE PFM
 *
 * Multi-criteria scoring engine that recommends 7-12 assets based on
 * investor profile, country context, and diversification requirements.
 * Guarantees at least 1 asset per pillar.
 */

import {
  AssetClass,
  InvestmentPillar,
  InvestmentProduct,
  InvestorProfile,
  RiskTolerance,
} from '@/types/investment';
import {
  SelectedAsset,
  RecommendationScoreBreakdown,
} from '@/types/investor-journey';
import { getProductsForCountry, filterShariaProducts } from '@/constants/investment-products';
import { ASSET_TO_PILLAR } from '@/constants/pillar-mapping';

// ─── Constants ───

const MIN_RECOMMENDED = 7;
const MAX_RECOMMENDED = 12;

const RISK_MAX: Record<RiskTolerance, number> = {
  conservative: 2,
  moderate: 3,
  aggressive: 5,
};

/** Minimum EKH score required for complex assets */
const COMPLEX_ASSET_MIN_EKH: Partial<Record<AssetClass, number>> = {
  private_equity: 10,
  venture_capital: 10,
  derivatives: 10,
  crypto: 8,
  mezzanine: 8,
  venture_debt: 8,
  mining_assets: 8,
  carbon_credits: 8,
  tokenized_assets: 8,
};

// ─── Main Recommender ───

export interface RecommenderInput {
  profile: InvestorProfile;
  countryCode: string;
  ekhScore: number;
  investmentInfraLevel: 1 | 2 | 3 | 4;
  currentPillarCounts: Record<InvestmentPillar, number>;
}

export interface RecommenderResult {
  assets: SelectedAsset[];
  scoreBreakdowns: Record<string, RecommendationScoreBreakdown>;
  pillarCoverage: Record<InvestmentPillar, number>;
}

/**
 * Recommend assets for the investor journey.
 * Returns 7-12 assets with at least 1 per pillar.
 */
export function recommendAssets(input: RecommenderInput): RecommenderResult {
  const { profile, countryCode, ekhScore, investmentInfraLevel } = input;

  // 1. Get available products
  let products = getProductsForCountry(countryCode);
  products = filterShariaProducts(products, profile.shariaCompliance);

  if (products.length === 0) {
    return { assets: [], scoreBreakdowns: {}, pillarCoverage: { croissance: 0, amortisseur: 0, refuge: 0, base_arriere: 0 } };
  }

  // 2. Score all products
  const scored = products.map((product) => {
    const breakdown = scoreProduct(product, profile, ekhScore, investmentInfraLevel, input.currentPillarCounts);
    return { product, breakdown, total: breakdown.total };
  });

  // 3. Sort by score descending
  scored.sort((a, b) => b.total - a.total);

  // 4. Ensure pillar coverage (at least 1 per pillar)
  const selected: typeof scored = [];
  const pillarCounts: Record<InvestmentPillar, number> = {
    croissance: 0,
    amortisseur: 0,
    refuge: 0,
    base_arriere: 0,
  };
  const usedCodes = new Set<string>();

  // First pass: pick best product per pillar
  const pillars: InvestmentPillar[] = ['croissance', 'amortisseur', 'refuge', 'base_arriere'];
  for (const pillar of pillars) {
    const best = scored.find(
      (s) => ASSET_TO_PILLAR[s.product.asset] === pillar && !usedCodes.has(s.product.code),
    );
    if (best) {
      selected.push(best);
      pillarCounts[pillar]++;
      usedCodes.add(best.product.code);
    }
  }

  // Second pass: fill remaining slots by score
  for (const item of scored) {
    if (selected.length >= MAX_RECOMMENDED) break;
    if (usedCodes.has(item.product.code)) continue;
    if (item.total < 20) continue; // Skip very low scores

    selected.push(item);
    const pillar = ASSET_TO_PILLAR[item.product.asset];
    if (pillar) pillarCounts[pillar]++;
    usedCodes.add(item.product.code);
  }

  // Ensure minimum count
  if (selected.length < MIN_RECOMMENDED) {
    for (const item of scored) {
      if (selected.length >= MIN_RECOMMENDED) break;
      if (usedCodes.has(item.product.code)) continue;
      selected.push(item);
      const pillar = ASSET_TO_PILLAR[item.product.asset];
      if (pillar) pillarCounts[pillar]++;
      usedCodes.add(item.product.code);
    }
  }

  // 5. Convert to SelectedAsset[]
  const assets: SelectedAsset[] = selected.map((s) => ({
    id: s.product.code,
    assetClass: s.product.asset,
    name: s.product.name,
    status: 'recommended' as const,
    expectedReturnRate: s.product.returnRate,
    volatility: s.product.volatility,
    riskLevel: s.product.riskLevel,
    allocationPercent: 0, // Will be set in strategy phase
    pillar: ASSET_TO_PILLAR[s.product.asset],
    isCustom: false,
    shariaCompliant: s.product.shariaCompliant,
    liquidity: s.product.liquidity,
    product: s.product,
    recommendationScore: s.total,
  }));

  const scoreBreakdowns: Record<string, RecommendationScoreBreakdown> = {};
  for (const s of selected) {
    scoreBreakdowns[s.product.code] = s.breakdown;
  }

  return { assets, scoreBreakdowns, pillarCoverage: pillarCounts };
}

// ─── Scoring Functions ───

export function scoreProduct(
  product: InvestmentProduct,
  profile: InvestorProfile,
  ekhScore: number,
  infraLevel: 1 | 2 | 3 | 4,
  currentPillarCounts: Record<InvestmentPillar, number>,
): RecommendationScoreBreakdown {
  const riskAlignment = scoreRiskAlignment(product, profile);
  const returnAttractiveness = scoreReturnAttractiveness(product);
  const liquidityMatch = scoreLiquidityMatch(product, profile);
  const shariaCompliance = scoreShariaCompliance(product, profile);
  const ekhGate = scoreEkhGate(product, ekhScore);
  const diversification = scoreDiversification(product, currentPillarCounts);
  const countryInfra = scoreCountryInfra(product, infraLevel);
  const taxAdvantage = scoreTaxAdvantage(product);

  const total = riskAlignment + returnAttractiveness + liquidityMatch +
    shariaCompliance + ekhGate + diversification + countryInfra + taxAdvantage;

  return {
    riskAlignment,
    returnAttractiveness,
    liquidityMatch,
    shariaCompliance,
    ekhGate,
    diversification,
    countryInfra,
    taxAdvantage,
    total,
  };
}

/** Risk alignment (25 pts): penalize if riskLevel > profile tolerance */
function scoreRiskAlignment(product: InvestmentProduct, profile: InvestorProfile): number {
  const maxRisk = RISK_MAX[profile.riskTolerance];
  const diff = maxRisk - product.riskLevel;

  if (diff >= 2) return 20; // Well within tolerance
  if (diff >= 1) return 25; // Sweet spot
  if (diff >= 0) return 22; // At limit
  if (diff >= -1) return 10; // Slightly over
  return 0; // Too risky
}

/** Return attractiveness (20 pts): higher return = more points */
function scoreReturnAttractiveness(product: InvestmentProduct): number {
  const rate = product.returnRate;
  if (rate >= 15) return 20;
  if (rate >= 10) return 17;
  if (rate >= 7) return 14;
  if (rate >= 4) return 10;
  if (rate >= 2) return 6;
  return 3;
}

/** Liquidity match (15 pts): short horizon needs liquid assets */
function scoreLiquidityMatch(product: InvestmentProduct, profile: InvestorProfile): number {
  const horizon = profile.horizon;
  const liq = product.liquidity;

  if (horizon === 'short') {
    if (liq === 'immediate') return 15;
    if (liq === 'days') return 13;
    if (liq === 'weeks') return 8;
    if (liq === 'months') return 3;
    return 0; // locked
  }
  if (horizon === 'medium') {
    if (liq === 'immediate') return 10;
    if (liq === 'days') return 13;
    if (liq === 'weeks') return 15;
    if (liq === 'months') return 10;
    return 5;
  }
  // long horizon: locked is fine
  if (liq === 'immediate') return 8;
  if (liq === 'days') return 10;
  if (liq === 'weeks') return 12;
  if (liq === 'months') return 14;
  return 15; // locked
}

/** Sharia compliance (10 pts): bonus or hard filter */
function scoreShariaCompliance(product: InvestmentProduct, profile: InvestorProfile): number {
  if (profile.shariaCompliance === 'required') {
    return product.shariaCompliant ? 10 : 0;
  }
  if (profile.shariaCompliance === 'preferred') {
    return product.shariaCompliant ? 10 : 5;
  }
  return 7; // not_required: neutral
}

/** EKH gate (10 pts): complex products need minimum EKH score */
function scoreEkhGate(product: InvestmentProduct, ekhScore: number): number {
  const minEKH = COMPLEX_ASSET_MIN_EKH[product.asset];
  if (!minEKH) return 10; // No gate required
  if (ekhScore >= minEKH) return 10;
  if (ekhScore >= minEKH - 2) return 5; // Close but not quite
  return 0; // Blocked
}

/** Diversification (10 pts): bonus if pillar is under-represented */
function scoreDiversification(
  product: InvestmentProduct,
  currentPillarCounts: Record<InvestmentPillar, number>,
): number {
  const pillar = ASSET_TO_PILLAR[product.asset];
  if (!pillar) return 5;

  const count = currentPillarCounts[pillar] ?? 0;
  if (count === 0) return 10; // Empty pillar = max bonus
  if (count === 1) return 7;
  if (count === 2) return 4;
  return 2; // Already well-represented
}

/** Country infrastructure (5 pts): penalize if infra insufficient for complex assets */
function scoreCountryInfra(product: InvestmentProduct, infraLevel: 1 | 2 | 3 | 4): number {
  // Complex assets need better infrastructure
  if (product.riskLevel >= 4 && infraLevel <= 1) return 0;
  if (product.riskLevel >= 4 && infraLevel <= 2) return 2;
  if (infraLevel >= 3) return 5;
  return 3;
}

/** Tax advantage (5 pts): bonus if tax-advantaged */
function scoreTaxAdvantage(product: InvestmentProduct): number {
  return product.taxAdvantaged ? 5 : 0;
}
