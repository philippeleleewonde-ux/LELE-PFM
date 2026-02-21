/**
 * ACE Psychological Score Engine — LELE PFM
 *
 * Measures investment psychological maturity across 3 dimensions:
 *   A = Awareness (diversification consciousness)
 *   C = Control (risk management discipline)
 *   E = Execution (portfolio construction quality)
 *
 * Pure functions. No side effects, no state.
 */

import { AllocationRecommendation, AssetClass } from '@/types/investment';

// ─── Types ───

export interface ACEFactor {
  name: string;
  label: string;
  score: number;
  weight: number;
  explanation: string;
}

export interface ACEDimension {
  dimension: 'awareness' | 'control' | 'execution';
  label: string;
  score: number;
  grade: string;
  factors: ACEFactor[];
  recommendation: string;
}

export interface ACEAnalysis {
  awareness: ACEDimension;
  control: ACEDimension;
  execution: ACEDimension;
  globalScore: number;
  globalGrade: string;
  profile: string;
  profileDescription: string;
  strengths: string[];
  improvements: string[];
}

// ─── Grade mapping ───

function gradeFromScore(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

// ─── Helpers ───

const ALTERNATIVE_ASSETS: AssetClass[] = ['gold', 'crypto', 'tontine', 'micro_enterprise'];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function uniqueAssetClasses(allocations: AllocationRecommendation[]): Set<AssetClass> {
  return new Set(allocations.map((a) => a.product.asset));
}

function maxWeight(allocations: AllocationRecommendation[]): number {
  if (allocations.length === 0) return 0;
  return Math.max(...allocations.map((a) => a.weight));
}

function totalWeight(allocations: AllocationRecommendation[]): number {
  return allocations.reduce((sum, a) => sum + a.weight, 0);
}

/** Risk level 1-2 = safe, 3 = moderate, 4-5 = aggressive */
function hasSafe(allocations: AllocationRecommendation[]): boolean {
  return allocations.some((a) => a.product.riskLevel <= 2);
}
function hasModerate(allocations: AllocationRecommendation[]): boolean {
  return allocations.some((a) => a.product.riskLevel === 3);
}
function hasAggressive(allocations: AllocationRecommendation[]): boolean {
  return allocations.some((a) => a.product.riskLevel >= 4);
}

function safeWeight(allocations: AllocationRecommendation[]): number {
  return allocations
    .filter((a) => a.product.riskLevel <= 2)
    .reduce((sum, a) => sum + a.weight, 0);
}

// ─── Awareness Factors ───

function calcAwareness(allocations: AllocationRecommendation[]): ACEDimension {
  const assets = uniqueAssetClasses(allocations);
  const mw = maxWeight(allocations);

  // 1. Asset diversity
  const diversityScore = clamp(Math.round((assets.size / 8) * 100), 0, 100);
  const f1: ACEFactor = {
    name: 'asset_diversity',
    label: 'Diversite des actifs',
    score: diversityScore,
    weight: 0.3,
    explanation: `${assets.size} classe(s) d'actifs sur 8 possibles.`,
  };

  // 2. Risk spectrum
  const categories = [hasSafe(allocations), hasModerate(allocations), hasAggressive(allocations)];
  const spectrumScore = clamp(categories.filter(Boolean).length * 33, 0, 100);
  const f2: ACEFactor = {
    name: 'risk_spectrum',
    label: 'Spectre de risque',
    score: spectrumScore,
    weight: 0.3,
    explanation: `${categories.filter(Boolean).length}/3 categories de risque couvertes.`,
  };

  // 3. Alternative exposure
  const altCount = [...assets].filter((a) => ALTERNATIVE_ASSETS.includes(a)).length;
  const altScore = clamp(altCount * 25, 0, 100);
  const f3: ACEFactor = {
    name: 'alternative_exposure',
    label: 'Actifs alternatifs',
    score: altScore,
    weight: 0.2,
    explanation: `${altCount} actif(s) alternatif(s) (or, crypto, tontine, micro-entreprise).`,
  };

  // 4. Balance check
  const balanceScore = clamp(Math.round(100 - (mw - 30) * 3), 0, 100);
  const f4: ACEFactor = {
    name: 'balance_check',
    label: 'Equilibre du portefeuille',
    score: balanceScore,
    weight: 0.2,
    explanation: mw <= 30
      ? 'Aucune position ne domine le portefeuille.'
      : `Position max a ${mw}%, idealement <= 30%.`,
  };

  const factors = [f1, f2, f3, f4];
  const score = Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0));

  return {
    dimension: 'awareness',
    label: 'Conscience (Awareness)',
    score,
    grade: gradeFromScore(score),
    factors,
    recommendation: score >= 70
      ? 'Bonne conscience de la diversification. Continuez a explorer de nouvelles classes.'
      : 'Elargissez votre univers d\'investissement pour mieux diversifier.',
  };
}

// ─── Control Factors ───

function calcControl(allocations: AllocationRecommendation[]): ACEDimension {
  const mw = maxWeight(allocations);
  const sw = safeWeight(allocations);

  // 1. Max concentration
  const concScore = clamp(Math.round(100 - mw * 2), 0, 100);
  const f1: ACEFactor = {
    name: 'max_concentration',
    label: 'Controle de concentration',
    score: concScore,
    weight: 0.3,
    explanation: `Position max: ${mw}%. Moins de concentration = meilleur controle.`,
  };

  // 2. Defensive cushion (optimal at 25%)
  const cushionScore = clamp(Math.round(100 - Math.abs(sw - 25) * 3), 0, 100);
  const f2: ACEFactor = {
    name: 'defensive_cushion',
    label: 'Coussin defensif',
    score: cushionScore,
    weight: 0.25,
    explanation: `${sw}% en actifs surs (ideal ~25%).`,
  };

  // 3. Risk-adjusted return
  const weightedReturn = allocations.reduce((s, a) => s + a.product.returnRate * a.weight, 0);
  const tw = totalWeight(allocations);
  const avgReturn = tw > 0 ? weightedReturn / tw : 0;
  const avgVol = tw > 0
    ? allocations.reduce((s, a) => s + (a.product.volatility || 1) * a.weight, 0) / tw
    : 1;
  const raScore = clamp(Math.round((avgReturn / Math.max(avgVol, 0.5)) * 20), 0, 100);
  const f3: ACEFactor = {
    name: 'risk_adjusted',
    label: 'Rendement ajuste au risque',
    score: raScore,
    weight: 0.25,
    explanation: `Ratio rendement/volatilite: ${(avgReturn / Math.max(avgVol, 0.5)).toFixed(1)}.`,
  };

  // 4. Correlation spread
  const assets = uniqueAssetClasses(allocations);
  const uncorrelatedPairs: [AssetClass, AssetClass][] = [
    ['stock_index', 'government_bonds'],
    ['stock_index', 'gold'],
    ['government_bonds', 'gold'],
    ['real_estate_fund', 'stock_index'],
  ];
  // Also count local_stocks as stock equivalent
  const effectiveAssets = new Set(assets);
  if (assets.has('local_stocks')) effectiveAssets.add('stock_index');
  if (assets.has('corporate_bonds')) effectiveAssets.add('government_bonds');

  const pairCount = uncorrelatedPairs.filter(
    ([a, b]) => effectiveAssets.has(a) && effectiveAssets.has(b),
  ).length;
  const corrScore = clamp(pairCount * 25, 0, 100);
  const f4: ACEFactor = {
    name: 'correlation_spread',
    label: 'Decorrelation',
    score: corrScore,
    weight: 0.2,
    explanation: `${pairCount}/4 paires d'actifs decorrelees.`,
  };

  const factors = [f1, f2, f3, f4];
  const score = Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0));

  return {
    dimension: 'control',
    label: 'Maitrise (Control)',
    score,
    grade: gradeFromScore(score),
    factors,
    recommendation: score >= 70
      ? 'Bonne maitrise du risque. Affinez le coussin defensif et la decorrelation.'
      : 'Reduisez la concentration et equilibrez les niveaux de risque.',
  };
}

// ─── Execution Factors ───

function calcExecution(allocations: AllocationRecommendation[]): ACEDimension {
  const n = allocations.length;
  const tw = totalWeight(allocations);

  // 1. Position count (optimal 5-10)
  let posScore: number;
  if (n >= 5 && n <= 10) {
    posScore = 100;
  } else if (n < 5) {
    posScore = clamp(Math.round((n / 5) * 100), 0, 100);
  } else {
    posScore = clamp(Math.round(100 - (n - 10) * 15), 0, 100);
  }
  const f1: ACEFactor = {
    name: 'position_count',
    label: 'Nombre de positions',
    score: posScore,
    weight: 0.3,
    explanation: `${n} position(s). Optimal: 5-10.`,
  };

  // 2. Weight precision (positions not divisible by 5 = more deliberate)
  const nonRoundCount = allocations.filter((a) => a.weight % 5 !== 0).length;
  const precisionScore = n > 0 ? clamp(Math.round((nonRoundCount / n) * 100), 0, 100) : 0;
  const f2: ACEFactor = {
    name: 'weight_precision',
    label: 'Precision des allocations',
    score: precisionScore,
    weight: 0.2,
    explanation: `${nonRoundCount}/${n} poids non arrondis a 5%. Plus = plus reflechi.`,
  };

  // 3. Completeness (total should be ~100%)
  const complScore = clamp(Math.round(100 - Math.abs(100 - tw) * 3), 0, 100);
  const f3: ACEFactor = {
    name: 'completeness',
    label: 'Completude',
    score: complScore,
    weight: 0.25,
    explanation: `Total allocation: ${tw}%. Objectif: 100%.`,
  };

  // 4. Systematic score (% positions with weight 2-30%)
  const systematicCount = allocations.filter((a) => a.weight >= 2 && a.weight <= 30).length;
  const systematicScore = n > 0 ? clamp(Math.round((systematicCount / n) * 100), 0, 100) : 0;
  const f4: ACEFactor = {
    name: 'systematic_score',
    label: 'Approche systematique',
    score: systematicScore,
    weight: 0.25,
    explanation: `${systematicCount}/${n} positions entre 2% et 30%.`,
  };

  const factors = [f1, f2, f3, f4];
  const score = Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0));

  return {
    dimension: 'execution',
    label: 'Execution',
    score,
    grade: gradeFromScore(score),
    factors,
    recommendation: score >= 70
      ? 'Execution solide. Verifiez que le total est bien a 100% et affinez les poids.'
      : 'Ajustez le nombre de positions (5-10) et visez des poids plus precis.',
  };
}

// ─── Profiles ───

function getProfile(score: number): { profile: string; description: string } {
  if (score >= 85)
    return {
      profile: 'Investisseur Stratege',
      description: 'Methodique, diversifie, maitrise. Votre portefeuille reflete une approche structuree.',
    };
  if (score >= 70)
    return {
      profile: 'Investisseur Discipline',
      description: 'Bonnes bases, quelques ajustements a faire pour atteindre l\'excellence.',
    };
  if (score >= 55)
    return {
      profile: 'Investisseur en Progression',
      description: 'Intentions positives mais manque de structure. L\'apprentissage continue.',
    };
  if (score >= 40)
    return {
      profile: 'Investisseur Emotionnel',
      description: 'Influence par les emotions et les tendances. Besoin de discipline.',
    };
  return {
    profile: 'Investisseur Debutant',
    description: 'Besoin de refonte structurelle. Commencez par les fondamentaux.',
  };
}

// ─── Strengths & Improvements ───

function getStrengthsAndImprovements(dimensions: ACEDimension[]): {
  strengths: string[];
  improvements: string[];
} {
  const allFactors = dimensions.flatMap((d) =>
    d.factors.map((f) => ({ ...f, dimension: d.label })),
  );

  const sorted = [...allFactors].sort((a, b) => b.score - a.score);
  const weakest = [...allFactors].sort((a, b) => a.score - b.score);

  const strengths = sorted.slice(0, 2).map(
    (f) => `${f.label} (${f.score}/100) — ${f.explanation}`,
  );

  const improvements = weakest.slice(0, 3).map(
    (f) => `${f.label} (${f.score}/100) — ${f.explanation}`,
  );

  return { strengths, improvements };
}

// ─── Main entry point ───

export function calculateACE(allocations: AllocationRecommendation[]): ACEAnalysis {
  const awareness = calcAwareness(allocations);
  const control = calcControl(allocations);
  const execution = calcExecution(allocations);

  const globalScore = Math.round(
    awareness.score * 0.3 + control.score * 0.4 + execution.score * 0.3,
  );

  const { profile, description } = getProfile(globalScore);
  const { strengths, improvements } = getStrengthsAndImprovements([awareness, control, execution]);

  return {
    awareness,
    control,
    execution,
    globalScore,
    globalGrade: gradeFromScore(globalScore),
    profile,
    profileDescription: description,
    strengths,
    improvements,
  };
}
