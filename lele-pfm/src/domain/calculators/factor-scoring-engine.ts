/**
 * Factor Scoring Engine — LELE PFM
 *
 * Pure functions for factor investing analysis.
 * Computes weighted factor exposures from portfolio allocations.
 * No side effects, no state.
 */

import { AssetClass, AllocationRecommendation } from '@/types/investment';

// ─── Types ───

export type InvestmentFactor = 'value' | 'momentum' | 'quality' | 'low_volatility';

export interface FactorExposure {
  factor: InvestmentFactor;
  label: string;
  score: number;        // 0-10
  level: 'high' | 'moderate' | 'low';
  description: string;
}

export interface FactorAnalysis {
  factors: FactorExposure[];
  dominantFactor: InvestmentFactor;
  weakestFactor: InvestmentFactor;
  diversificationScore: number; // 0-10
  recommendation: string;
}

// ─── Factor scores per asset class ───

const FACTOR_SCORES: Record<AssetClass, Record<InvestmentFactor, number>> = {
  savings_account:   { value: 2, momentum: 1, quality: 8, low_volatility: 10 },
  term_deposit:      { value: 3, momentum: 1, quality: 8, low_volatility: 9 },
  government_bonds:  { value: 4, momentum: 3, quality: 9, low_volatility: 8 },
  corporate_bonds:   { value: 5, momentum: 3, quality: 7, low_volatility: 7 },
  stock_index:       { value: 5, momentum: 7, quality: 6, low_volatility: 4 },
  local_stocks:      { value: 7, momentum: 6, quality: 5, low_volatility: 3 },
  real_estate_fund:  { value: 6, momentum: 4, quality: 7, low_volatility: 6 },
  gold:              { value: 4, momentum: 5, quality: 5, low_volatility: 5 },
  crypto:            { value: 3, momentum: 8, quality: 2, low_volatility: 1 },
  tontine:           { value: 6, momentum: 2, quality: 4, low_volatility: 7 },
  micro_enterprise:  { value: 8, momentum: 3, quality: 3, low_volatility: 2 },
  money_market:      { value: 2, momentum: 1, quality: 9, low_volatility: 10 },
  sukuk:             { value: 5, momentum: 2, quality: 7, low_volatility: 7 },
  mutual_fund:       { value: 5, momentum: 6, quality: 6, low_volatility: 5 },
};

// ─── Factor metadata ───

export const FACTOR_INFO: Record<InvestmentFactor, { label: string; emoji: string; color: string; description: string }> = {
  value:          { label: 'Value',       emoji: '\u{1F48E}', color: '#FBBF24', description: 'Actifs sous-\u00e9valu\u00e9s par rapport \u00e0 leur valeur fondamentale' },
  momentum:       { label: 'Momentum',    emoji: '\u{1F680}', color: '#60A5FA', description: 'Actifs avec une tendance haussi\u00e8re r\u00e9cente' },
  quality:        { label: 'Qualit\u00e9', emoji: '\u{1F3DB}\uFE0F', color: '#4ADE80', description: 'Actifs avec des fondamentaux solides et stables' },
  low_volatility: { label: 'Faible Vol.', emoji: '\u{1F6E1}\uFE0F', color: '#A78BFA', description: 'Actifs moins volatils que la moyenne du march\u00e9' },
};

const ALL_FACTORS: InvestmentFactor[] = ['value', 'momentum', 'quality', 'low_volatility'];

// ─── Main analysis function ───

/**
 * Analyze factor exposures from portfolio allocations.
 * Computes weighted scores, dominant/weakest factors,
 * diversification score, and a recommendation.
 */
export function analyzeFactors(allocations: AllocationRecommendation[]): FactorAnalysis {
  if (allocations.length === 0) {
    return {
      factors: ALL_FACTORS.map(f => ({
        factor: f,
        label: FACTOR_INFO[f].label,
        score: 0,
        level: 'low' as const,
        description: FACTOR_INFO[f].description,
      })),
      dominantFactor: 'value',
      weakestFactor: 'value',
      diversificationScore: 0,
      recommendation: 'Aucune allocation en portefeuille. Configurez vos investissements pour voir l\'analyse factorielle.',
    };
  }

  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0);

  // Compute weighted score for each factor
  const factorScores: Record<InvestmentFactor, number> = { value: 0, momentum: 0, quality: 0, low_volatility: 0 };

  for (const alloc of allocations) {
    const scores = FACTOR_SCORES[alloc.product.asset];
    if (!scores) continue;
    const w = alloc.weight / totalWeight;
    factorScores.value += scores.value * w;
    factorScores.momentum += scores.momentum * w;
    factorScores.quality += scores.quality * w;
    factorScores.low_volatility += scores.low_volatility * w;
  }

  // Build factor exposures
  const factors: FactorExposure[] = ALL_FACTORS.map(f => {
    const score = Math.round(factorScores[f] * 10) / 10;
    const level = score >= 7 ? 'high' : score >= 4 ? 'moderate' : 'low';
    return {
      factor: f,
      label: FACTOR_INFO[f].label,
      score,
      level,
      description: FACTOR_INFO[f].description,
    };
  });

  // Dominant and weakest
  const sorted = [...factors].sort((a, b) => b.score - a.score);
  const dominantFactor = sorted[0].factor;
  const weakestFactor = sorted[sorted.length - 1].factor;

  // Diversification score: 10 - stddev * 2, clamped 0-10
  const mean = factors.reduce((s, f) => s + f.score, 0) / 4;
  const variance = factors.reduce((s, f) => s + (f.score - mean) ** 2, 0) / 4;
  const stddev = Math.sqrt(variance);
  const diversificationScore = Math.max(0, Math.min(10, Math.round((10 - stddev * 2) * 10) / 10));

  // Recommendation
  const weak = sorted[sorted.length - 1];
  let recommendation: string;
  if (weak.score < 4) {
    const hint =
      weak.factor === 'value' ? 'sous-\u00e9valu\u00e9s (actions locales, micro-entreprises)' :
      weak.factor === 'momentum' ? '\u00e0 forte tendance (indices, fonds)' :
      weak.factor === 'quality' ? 'de haute qualit\u00e9 (obligations, fonds mon\u00e9taires)' :
      '\u00e0 faible volatilit\u00e9 (d\u00e9p\u00f4ts, obligations souveraines)';
    recommendation = `Votre exposition ${FACTOR_INFO[weak.factor].label} est faible (${weak.score}/10). Diversifiez vers des actifs ${hint}.`;
  } else if (diversificationScore >= 7) {
    recommendation = '\u00c9quilibre factoriel excellent. Votre portefeuille est bien diversifi\u00e9 sur les 4 dimensions.';
  } else {
    recommendation = `Portefeuille concentr\u00e9 sur le facteur ${FACTOR_INFO[dominantFactor].label}. R\u00e9\u00e9quilibrez pour r\u00e9duire le risque factoriel.`;
  }

  return { factors, dominantFactor, weakestFactor, diversificationScore, recommendation };
}
