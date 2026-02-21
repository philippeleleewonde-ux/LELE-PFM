/**
 * Macro Scenario Engine -- LELE PFM
 *
 * Pure functions for analyzing how macroeconomic variable changes
 * impact a user's investment portfolio. No side effects, no state.
 */

import { AssetClass, AllocationRecommendation } from '@/types/investment';

// ─── Types ───

export type MacroVariable = 'inflation' | 'interest_rates' | 'gdp_growth' | 'unemployment';

export interface MacroHypothesis {
  variable: MacroVariable;
  label: string;
  currentValue: number;
  newValue: number;
  delta: number;
}

export interface AssetImpact {
  asset: AssetClass;
  assetName: string;
  baseReturn: number;
  adjustedReturn: number;
  impact: number;
  direction: 'positive' | 'negative' | 'neutral';
}

export interface MacroScenarioResult {
  hypothesis: MacroHypothesis;
  assetImpacts: AssetImpact[];
  portfolioBaseReturn: number;
  portfolioAdjustedReturn: number;
  portfolioImpact: number;
  verdict: 'favorable' | 'neutral' | 'unfavorable';
  explanation: string;
}

// ─── Sensitivity matrix (impact in % return change per 1pp change) ───

const MACRO_SENSITIVITY: Record<AssetClass, Record<MacroVariable, number>> = {
  savings_account:  { inflation: -0.8, interest_rates: +0.9, gdp_growth: +0.1, unemployment: -0.1 },
  term_deposit:     { inflation: -0.5, interest_rates: +0.8, gdp_growth: +0.1, unemployment: -0.1 },
  government_bonds: { inflation: -1.5, interest_rates: -2.0, gdp_growth: -0.3, unemployment: +0.5 },
  corporate_bonds:  { inflation: -1.0, interest_rates: -1.5, gdp_growth: +0.5, unemployment: -0.8 },
  stock_index:      { inflation: -0.5, interest_rates: -1.0, gdp_growth: +2.0, unemployment: -1.5 },
  local_stocks:     { inflation: -0.3, interest_rates: -0.8, gdp_growth: +2.5, unemployment: -2.0 },
  real_estate_fund: { inflation: +0.5, interest_rates: -1.8, gdp_growth: +1.0, unemployment: -0.5 },
  gold:             { inflation: +2.0, interest_rates: -0.5, gdp_growth: -0.5, unemployment: +0.3 },
  crypto:           { inflation: +0.5, interest_rates: -0.3, gdp_growth: +1.0, unemployment: -0.5 },
  tontine:          { inflation: -0.3, interest_rates: +0.2, gdp_growth: +0.5, unemployment: -0.3 },
  micro_enterprise: { inflation: -0.5, interest_rates: -0.5, gdp_growth: +3.0, unemployment: -2.5 },
  money_market:     { inflation: -0.5, interest_rates: +0.8, gdp_growth: +0.1, unemployment: 0 },
  sukuk:            { inflation: -0.8, interest_rates: -1.0, gdp_growth: +0.3, unemployment: -0.2 },
  mutual_fund:      { inflation: -0.5, interest_rates: -0.8, gdp_growth: +1.5, unemployment: -1.0 },
};

// ─── Preset scenarios ───

export const PRESET_SCENARIOS: MacroHypothesis[] = [
  { variable: 'inflation',      label: 'Inflation haute (+5%)',      currentValue: 2, newValue: 5,  delta: 3 },
  { variable: 'inflation',      label: 'Deflation (-1%)',            currentValue: 2, newValue: -1, delta: -3 },
  { variable: 'interest_rates', label: 'Hausse des taux (+2%)',      currentValue: 3, newValue: 5,  delta: 2 },
  { variable: 'interest_rates', label: 'Baisse des taux (-2%)',      currentValue: 3, newValue: 1,  delta: -2 },
  { variable: 'gdp_growth',     label: 'Recession (-3%)',            currentValue: 2, newValue: -1, delta: -3 },
  { variable: 'gdp_growth',     label: 'Boom economique (+5%)',      currentValue: 2, newValue: 5,  delta: 3 },
  { variable: 'unemployment',   label: 'Chomage en hausse (+4%)',    currentValue: 5, newValue: 9,  delta: 4 },
];

// ─── Labels ───

export const MACRO_LABELS: Record<MacroVariable, { label: string; unit: string }> = {
  inflation:      { label: 'Inflation',       unit: '%' },
  interest_rates: { label: 'Taux directeurs', unit: '%' },
  gdp_growth:     { label: 'Croissance PIB',  unit: '%' },
  unemployment:   { label: 'Chomage',         unit: '%' },
};

// ─── Main analysis function ───

/**
 * Analyze the impact of a macroeconomic hypothesis on a portfolio of allocations.
 * Returns per-asset impacts, weighted portfolio impact, verdict, and explanation.
 */
export function analyzeScenario(
  allocations: AllocationRecommendation[],
  hypothesis: MacroHypothesis,
): MacroScenarioResult {
  const { variable, delta } = hypothesis;

  // Per-asset impacts
  const assetImpacts: AssetImpact[] = allocations.map((alloc) => {
    const sensitivity = MACRO_SENSITIVITY[alloc.product.asset]?.[variable] ?? 0;
    const baseReturn = alloc.product.returnRate;
    const impact = sensitivity * delta;
    const adjustedReturn = baseReturn + impact;
    const direction: AssetImpact['direction'] =
      impact > 0.5 ? 'positive' : impact < -0.5 ? 'negative' : 'neutral';

    return {
      asset: alloc.product.asset,
      assetName: alloc.product.name,
      baseReturn,
      adjustedReturn,
      impact,
      direction,
    };
  });

  // Weighted portfolio returns
  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0);
  const portfolioBaseReturn = totalWeight > 0
    ? allocations.reduce((s, a) => s + a.product.returnRate * a.weight, 0) / totalWeight
    : 0;
  const portfolioAdjustedReturn = totalWeight > 0
    ? assetImpacts.reduce(
        (s, ai, i) => s + ai.adjustedReturn * allocations[i].weight,
        0,
      ) / totalWeight
    : 0;
  const portfolioImpact = portfolioAdjustedReturn - portfolioBaseReturn;

  // Verdict
  const verdict: MacroScenarioResult['verdict'] =
    portfolioImpact > 0.5 ? 'favorable' : portfolioImpact < -0.5 ? 'unfavorable' : 'neutral';

  // Explanation
  const explanation = buildExplanation(hypothesis, portfolioImpact, verdict, assetImpacts);

  return {
    hypothesis,
    assetImpacts,
    portfolioBaseReturn,
    portfolioAdjustedReturn,
    portfolioImpact,
    verdict,
    explanation,
  };
}

// ─── Explanation builder ───

function buildExplanation(
  hypothesis: MacroHypothesis,
  portfolioImpact: number,
  verdict: MacroScenarioResult['verdict'],
  assetImpacts: AssetImpact[],
): string {
  const varLabel = MACRO_LABELS[hypothesis.variable].label;
  const direction = hypothesis.delta > 0 ? 'hausse' : 'baisse';
  const impactSign = portfolioImpact >= 0 ? '+' : '';
  const impactStr = `${impactSign}${portfolioImpact.toFixed(1)}%`;

  const verdictText =
    verdict === 'favorable'
      ? 'favorable pour votre portefeuille'
      : verdict === 'unfavorable'
        ? 'defavorable pour votre portefeuille'
        : 'neutre pour votre portefeuille';

  // Find most impacted asset
  const sorted = [...assetImpacts].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const mostImpacted = sorted[0];
  const mostImpactedText = mostImpacted
    ? ` L'actif le plus touche est ${mostImpacted.assetName} (${mostImpacted.impact >= 0 ? '+' : ''}${mostImpacted.impact.toFixed(1)}%).`
    : '';

  return `Une ${direction} de ${varLabel} de ${Math.abs(hypothesis.delta)}pp aurait un impact ${verdictText} (${impactStr} rendement annuel).${mostImpactedText}`;
}
