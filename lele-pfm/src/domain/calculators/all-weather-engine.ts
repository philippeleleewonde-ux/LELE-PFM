/**
 * All-Weather (Risk Parity) Engine — LELE PFM
 *
 * Analyzes portfolio resilience across 4 macro-economic scenarios
 * (growth rising/falling, inflation rising/falling) inspired by
 * Ray Dalio's All-Weather strategy. Pure functions, no side effects.
 */

import { AssetClass, AllocationRecommendation } from '@/types/investment';

// ─── Types ───

export type MacroScenario =
  | 'growth_rising'
  | 'growth_falling'
  | 'inflation_rising'
  | 'inflation_falling';

export interface ScenarioProtection {
  scenario: MacroScenario;
  label: string;
  score: number; // 0-100
  status: 'strong' | 'moderate' | 'weak';
}

export interface AllWeatherAdjustment {
  asset: AssetClass;
  currentWeight: number;
  suggestedWeight: number;
  reason: string;
}

export interface AllWeatherAnalysis {
  scenarios: ScenarioProtection[];
  overallScore: number;
  recommendation: string;
  suggestedAdjustments: AllWeatherAdjustment[];
}

// ─── Scenario labels (French) ───

const SCENARIO_LABELS: Record<MacroScenario, string> = {
  growth_rising: 'Croissance \u2191',
  growth_falling: 'R\u00e9cession \u2193',
  inflation_rising: 'Inflation \u2191',
  inflation_falling: 'D\u00e9flation \u2193',
};

// ─── Sensitivity matrix: asset × scenario → score (-2 to +2) ───

const SENSITIVITY: Record<AssetClass, Record<MacroScenario, number>> = {
  savings_account:  { growth_rising:  0, growth_falling: +1, inflation_rising: -1, inflation_falling: +1 },
  term_deposit:     { growth_rising:  0, growth_falling: +1, inflation_rising: -1, inflation_falling: +2 },
  government_bonds: { growth_rising: -1, growth_falling: +2, inflation_rising: -1, inflation_falling: +2 },
  corporate_bonds:  { growth_rising: +1, growth_falling: +1, inflation_rising: -1, inflation_falling: +1 },
  stock_index:      { growth_rising: +2, growth_falling: -2, inflation_rising:  0, inflation_falling: +1 },
  local_stocks:     { growth_rising: +2, growth_falling: -2, inflation_rising: +1, inflation_falling:  0 },
  real_estate_fund: { growth_rising: +1, growth_falling: -1, inflation_rising: +2, inflation_falling:  0 },
  gold:             { growth_rising: -1, growth_falling: +2, inflation_rising: +2, inflation_falling:  0 },
  crypto:           { growth_rising: +1, growth_falling: -2, inflation_rising: +1, inflation_falling: -1 },
  tontine:          { growth_rising: +1, growth_falling:  0, inflation_rising: +1, inflation_falling:  0 },
  micro_enterprise: { growth_rising: +2, growth_falling: -2, inflation_rising: +1, inflation_falling: -1 },
  money_market:     { growth_rising:  0, growth_falling: +1, inflation_rising: -1, inflation_falling: +1 },
  sukuk:            { growth_rising:  0, growth_falling: +1, inflation_rising:  0, inflation_falling: +1 },
  mutual_fund:      { growth_rising: +1, growth_falling: -1, inflation_rising:  0, inflation_falling: +1 },
  municipal_bonds:  { growth_rising:  0, growth_falling: +1, inflation_rising: -1, inflation_falling: +2 },
  private_equity:   { growth_rising: +2, growth_falling: -2, inflation_rising: +1, inflation_falling:  0 },
  venture_capital:  { growth_rising: +2, growth_falling: -2, inflation_rising:  0, inflation_falling: -1 },
  venture_debt:     { growth_rising: +1, growth_falling: -1, inflation_rising:  0, inflation_falling: +1 },
  mezzanine:        { growth_rising: +1, growth_falling: -1, inflation_rising:  0, inflation_falling:  0 },
  infrastructure:   { growth_rising: +1, growth_falling:  0, inflation_rising: +1, inflation_falling: +1 },
  mining_assets:    { growth_rising: +2, growth_falling: -1, inflation_rising: +2, inflation_falling: -1 },
  agrobusiness:     { growth_rising: +1, growth_falling:  0, inflation_rising: +2, inflation_falling: -1 },
  commodities:      { growth_rising: +1, growth_falling: -1, inflation_rising: +2, inflation_falling: -1 },
  derivatives:      { growth_rising: +1, growth_falling: -1, inflation_rising:  0, inflation_falling:  0 },
  esg_bonds:        { growth_rising:  0, growth_falling: +1, inflation_rising: -1, inflation_falling: +1 },
  carbon_credits:   { growth_rising:  0, growth_falling:  0, inflation_rising: +1, inflation_falling: +1 },
  tokenized_assets: { growth_rising: +2, growth_falling: -2, inflation_rising: +1, inflation_falling: -1 },
};

// ─── Dalio reference portfolio ───

export const DALIO_REFERENCE: Record<string, number> = {
  stock_index: 30,
  government_bonds: 40,
  corporate_bonds: 15,
  gold: 7.5,
  real_estate_fund: 7.5,
};

// ─── Scenarios list ───

const SCENARIOS: MacroScenario[] = [
  'growth_rising',
  'growth_falling',
  'inflation_rising',
  'inflation_falling',
];

// ─── Main analysis function ───

export function analyzeAllWeather(
  allocations: AllocationRecommendation[],
): AllWeatherAnalysis {
  if (allocations.length === 0) {
    return {
      scenarios: SCENARIOS.map((s) => ({
        scenario: s,
        label: SCENARIO_LABELS[s],
        score: 0,
        status: 'weak' as const,
      })),
      overallScore: 0,
      recommendation: 'Aucune allocation configur\u00e9e.',
      suggestedAdjustments: [],
    };
  }

  const totalWeight = allocations.reduce((sum, a) => sum + a.weight, 0);

  // 1. Compute per-scenario weighted protection score
  const scenarios: ScenarioProtection[] = SCENARIOS.map((scenario) => {
    const rawScore =
      totalWeight > 0
        ? allocations.reduce((sum, a) => {
            const sensitivity = SENSITIVITY[a.product.asset]?.[scenario] ?? 0;
            return sum + a.weight * sensitivity;
          }, 0) / totalWeight
        : 0;

    // Normalize from [-2, +2] to [0, 100]
    const score = Math.round(((rawScore + 2) / 4) * 100);
    const clampedScore = Math.max(0, Math.min(100, score));

    const status: ScenarioProtection['status'] =
      clampedScore > 70 ? 'strong' : clampedScore >= 40 ? 'moderate' : 'weak';

    return {
      scenario,
      label: SCENARIO_LABELS[scenario],
      score: clampedScore,
      status,
    };
  });

  // 2. Overall score = average of 4 scenario scores
  const overallScore = Math.round(
    scenarios.reduce((sum, s) => sum + s.score, 0) / scenarios.length,
  );

  // 3. Generate adjustments for weak scenarios (max 3)
  const suggestedAdjustments = generateAdjustments(allocations, scenarios, totalWeight);

  // 4. Recommendation text
  const recommendation = generateRecommendation(overallScore, scenarios);

  return {
    scenarios,
    overallScore,
    recommendation,
    suggestedAdjustments,
  };
}

// ─── Helpers ───

function generateAdjustments(
  allocations: AllocationRecommendation[],
  scenarios: ScenarioProtection[],
  _totalWeight: number,
): AllWeatherAdjustment[] {
  const weakScenarios = scenarios.filter((s) => s.status === 'weak');
  if (weakScenarios.length === 0) return [];

  const adjustments: AllWeatherAdjustment[] = [];

  for (const weak of weakScenarios) {
    if (adjustments.length >= 3) break;

    // Find the best asset for this weak scenario that is not already dominant
    let bestAsset: AssetClass | null = null;
    let bestScore = -3;

    for (const [asset, scores] of Object.entries(SENSITIVITY)) {
      const scenarioScore = scores[weak.scenario];
      if (scenarioScore > bestScore) {
        bestScore = scenarioScore;
        bestAsset = asset as AssetClass;
      }
    }

    if (!bestAsset) continue;

    // Check if already in portfolio
    const existing = allocations.find((a) => a.product.asset === bestAsset);
    const currentWeight = existing?.weight ?? 0;

    // Only suggest if it would meaningfully change the portfolio
    const suggestedWeight = Math.min(currentWeight + 10, 30);
    if (suggestedWeight <= currentWeight) continue;

    // Avoid duplicate adjustments for the same asset
    if (adjustments.some((a) => a.asset === bestAsset)) continue;

    adjustments.push({
      asset: bestAsset,
      currentWeight,
      suggestedWeight,
      reason: `Renforcer la protection en sc\u00e9nario "${weak.label}"`,
    });
  }

  return adjustments;
}

function generateRecommendation(
  overallScore: number,
  scenarios: ScenarioProtection[],
): string {
  const weakCount = scenarios.filter((s) => s.status === 'weak').length;

  if (overallScore >= 70) {
    return 'Votre portefeuille est bien diversifi\u00e9 et r\u00e9silient face aux diff\u00e9rents sc\u00e9narios macro\u00e9conomiques.';
  }

  if (overallScore >= 50) {
    if (weakCount > 0) {
      const weakLabels = scenarios
        .filter((s) => s.status === 'weak')
        .map((s) => s.label)
        .join(', ');
      return `Protection mod\u00e9r\u00e9e. Attention aux sc\u00e9narios : ${weakLabels}. Consid\u00e9rez diversifier davantage.`;
    }
    return 'Protection mod\u00e9r\u00e9e globalement. Quelques ajustements pourraient am\u00e9liorer la r\u00e9silience.';
  }

  if (weakCount >= 3) {
    return 'Portefeuille vuln\u00e9rable \u00e0 la plupart des sc\u00e9narios. Une diversification importante est recommand\u00e9e.';
  }

  const weakLabels = scenarios
    .filter((s) => s.status === 'weak')
    .map((s) => s.label)
    .join(', ');
  return `Portefeuille concentr\u00e9. Vuln\u00e9rable en cas de : ${weakLabels}. Diversifiez pour r\u00e9duire le risque.`;
}
