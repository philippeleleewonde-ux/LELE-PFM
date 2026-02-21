/**
 * Wisdom Synthesis Meta-Engine -- LELE PFM
 *
 * Aggregates results from all 12 investment analysis engines into a unified
 * dashboard: global health score, pillar scores, strengths/risks, action plan.
 * Pure functions, no side effects.
 */

import { AllocationRecommendation } from '@/types/investment';

import { analyzeAllWeather } from './all-weather-engine';
import { analyzePortfolioKelly } from './kelly-criterion';
import { analyzeFactors } from './factor-scoring-engine';
import { runMonteCarlo } from './monte-carlo-simulator';
import { stressTestPortfolio } from './stress-test-engine';
import { analyzeScenario, PRESET_SCENARIOS } from './macro-scenario-engine';
import { analyzeBiases } from './behavioral-bias-engine';
import { runPreMortem } from './pre-mortem-engine';
import { calculateACE } from './ace-score-engine';
import { analyzePortfolioTax } from './tax-optimization-engine';
import { analyzeEmergingMarkets } from './emerging-markets-engine';
import { scanCompliance } from './regulatory-engine';

// ─── Types ───

export interface PillarScore {
  pillar: 'strategy' | 'simulation' | 'psychology' | 'global';
  label: string;
  score: number;
  grade: string;
  engineScores: { engine: string; score: number; label: string }[];
}

export interface WisdomAction {
  priority: number;
  action: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
}

export interface WisdomSynthesis {
  globalScore: number;
  globalGrade: string;
  pillars: PillarScore[];
  topStrengths: string[];
  topRisks: string[];
  actionPlan: WisdomAction[];
  maturityLevel: 'debutant' | 'intermediaire' | 'avance' | 'expert';
  maturityLabel: string;
  verdict: string;
}

// ─── Helpers ───

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function gradeFromScore(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'E';
}

function avg(...values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
}

// ─── Engine labels (French) ───

interface EngineInfo {
  key: string;
  label: string;
  actionWhenLow: string;
  category: string;
}

const ENGINE_INFO: EngineInfo[] = [
  { key: 'all-weather', label: 'Resilience All-Weather', actionWhenLow: 'Reequilibrer vers le modele All-Weather de Dalio', category: 'Strategie' },
  { key: 'kelly', label: 'Dimensionnement Kelly', actionWhenLow: 'Ajuster la taille de vos positions selon Kelly', category: 'Strategie' },
  { key: 'factor', label: 'Analyse factorielle', actionWhenLow: 'Diversifier vos facteurs d\'investissement', category: 'Strategie' },
  { key: 'monte-carlo', label: 'Simulation Monte Carlo', actionWhenLow: 'Reduire la volatilite globale du portefeuille', category: 'Simulation' },
  { key: 'stress-test', label: 'Resistance aux crises', actionWhenLow: 'Renforcer la resilience aux crises historiques', category: 'Simulation' },
  { key: 'macro', label: 'Scenarios macroeconomiques', actionWhenLow: 'Preparer le portefeuille aux chocs macroeconomiques', category: 'Simulation' },
  { key: 'bias', label: 'Biais comportementaux', actionWhenLow: 'Corriger les biais comportementaux detectes', category: 'Psychologie' },
  { key: 'pre-mortem', label: 'Analyse pre-mortem', actionWhenLow: 'Adresser les scenarios de defaillance identifies', category: 'Psychologie' },
  { key: 'ace', label: 'Score psychologique ACE', actionWhenLow: 'Ameliorer votre maturite psychologique d\'investisseur', category: 'Psychologie' },
  { key: 'tax', label: 'Optimisation fiscale', actionWhenLow: 'Optimiser la structure fiscale du portefeuille', category: 'Vision Globale' },
  { key: 'emerging', label: 'Marches emergents', actionWhenLow: 'Explorer les opportunites des marches emergents', category: 'Vision Globale' },
  { key: 'regulatory', label: 'Conformite reglementaire', actionWhenLow: 'Mettre en conformite avec les cadres reglementaires', category: 'Vision Globale' },
];

// ─── Score extraction per engine ───

function extractScores(allocations: AllocationRecommendation[]): Map<string, number> {
  const scores = new Map<string, number>();
  const DEFAULT = 50;

  // 1. All-Weather
  try {
    const r = analyzeAllWeather(allocations);
    scores.set('all-weather', clamp(r.overallScore, 0, 100));
  } catch { scores.set('all-weather', DEFAULT); }

  // 2. Kelly Criterion
  try {
    const results = analyzePortfolioKelly(allocations);
    if (results.length === 0) {
      scores.set('kelly', DEFAULT);
    } else {
      const avgDeviation = results.reduce((sum, r) => sum + Math.abs(r.delta), 0) / results.length;
      scores.set('kelly', clamp(Math.round(100 - avgDeviation * 100), 0, 100));
    }
  } catch { scores.set('kelly', DEFAULT); }

  // 3. Factor Scoring
  try {
    const r = analyzeFactors(allocations);
    scores.set('factor', clamp(Math.round(r.diversificationScore * 10), 0, 100));
  } catch { scores.set('factor', DEFAULT); }

  // 4. Monte Carlo
  try {
    const r = runMonteCarlo(allocations, 100);
    const medianFinal = r.finalValues.median;
    const invested = r.investedCapital;
    const medianReturn = invested > 0 ? ((medianFinal - invested) / invested) * 100 : 0;
    scores.set('monte-carlo', clamp(Math.round(medianReturn * 2), 0, 100));
  } catch { scores.set('monte-carlo', DEFAULT); }

  // 5. Stress Test
  try {
    const results = stressTestPortfolio(allocations);
    if (results.length === 0) {
      scores.set('stress-test', DEFAULT);
    } else {
      const worstDrawdown = Math.min(...results.map((r) => r.portfolioMaxDrawdown));
      scores.set('stress-test', clamp(Math.round(100 - Math.abs(worstDrawdown)), 0, 100));
    }
  } catch { scores.set('stress-test', DEFAULT); }

  // 6. Macro Scenario
  try {
    if (PRESET_SCENARIOS.length > 0) {
      const r = analyzeScenario(allocations, PRESET_SCENARIOS[0]);
      const impact = r.portfolioImpact;
      const score = impact >= 0 ? 80 + Math.min(20, impact * 10) : 80 + impact * 10;
      scores.set('macro', clamp(Math.round(score), 0, 100));
    } else {
      scores.set('macro', DEFAULT);
    }
  } catch { scores.set('macro', DEFAULT); }

  // 7. Behavioral Bias
  try {
    const r = analyzeBiases(allocations);
    scores.set('bias', clamp(Math.round(r.overallScore * 10), 0, 100));
  } catch { scores.set('bias', DEFAULT); }

  // 8. Pre-Mortem
  try {
    const r = runPreMortem(allocations);
    scores.set('pre-mortem', clamp(Math.round(r.survivalProbability), 0, 100));
  } catch { scores.set('pre-mortem', DEFAULT); }

  // 9. ACE Score
  try {
    const r = calculateACE(allocations);
    scores.set('ace', clamp(Math.round(r.globalScore), 0, 100));
  } catch { scores.set('ace', DEFAULT); }

  // 10. Tax Optimization
  try {
    const r = analyzePortfolioTax(allocations, 'flat_tax');
    scores.set('tax', clamp(Math.round(r.taxEfficiencyScore), 0, 100));
  } catch { scores.set('tax', DEFAULT); }

  // 11. Emerging Markets
  try {
    const r = analyzeEmergingMarkets(allocations);
    scores.set('emerging', clamp(Math.round(r.diversificationScore), 0, 100));
  } catch { scores.set('emerging', DEFAULT); }

  // 12. Regulatory Compliance
  try {
    const r = scanCompliance(allocations);
    scores.set('regulatory', clamp(Math.round(r.globalScore), 0, 100));
  } catch { scores.set('regulatory', DEFAULT); }

  return scores;
}

// ─── Main synthesis function ───

export function synthesizeWisdom(allocations: AllocationRecommendation[]): WisdomSynthesis {
  const scores = extractScores(allocations);

  const get = (key: string) => scores.get(key) ?? 50;

  // ─── Pillar scores ───
  const strategyEngines = [
    { engine: 'all-weather', score: get('all-weather'), label: ENGINE_INFO[0].label },
    { engine: 'kelly', score: get('kelly'), label: ENGINE_INFO[1].label },
    { engine: 'factor', score: get('factor'), label: ENGINE_INFO[2].label },
  ];
  const simulationEngines = [
    { engine: 'monte-carlo', score: get('monte-carlo'), label: ENGINE_INFO[3].label },
    { engine: 'stress-test', score: get('stress-test'), label: ENGINE_INFO[4].label },
    { engine: 'macro', score: get('macro'), label: ENGINE_INFO[5].label },
  ];
  const psychologyEngines = [
    { engine: 'bias', score: get('bias'), label: ENGINE_INFO[6].label },
    { engine: 'pre-mortem', score: get('pre-mortem'), label: ENGINE_INFO[7].label },
    { engine: 'ace', score: get('ace'), label: ENGINE_INFO[8].label },
  ];
  const globalEngines = [
    { engine: 'tax', score: get('tax'), label: ENGINE_INFO[9].label },
    { engine: 'emerging', score: get('emerging'), label: ENGINE_INFO[10].label },
    { engine: 'regulatory', score: get('regulatory'), label: ENGINE_INFO[11].label },
  ];

  const strategyScore = avg(...strategyEngines.map((e) => e.score));
  const simulationScore = avg(...simulationEngines.map((e) => e.score));
  const psychologyScore = avg(...psychologyEngines.map((e) => e.score));
  const globalPillarScore = avg(...globalEngines.map((e) => e.score));

  const pillars: PillarScore[] = [
    { pillar: 'strategy', label: 'Strategie', score: strategyScore, grade: gradeFromScore(strategyScore), engineScores: strategyEngines },
    { pillar: 'simulation', label: 'Simulation', score: simulationScore, grade: gradeFromScore(simulationScore), engineScores: simulationEngines },
    { pillar: 'psychology', label: 'Psychologie', score: psychologyScore, grade: gradeFromScore(psychologyScore), engineScores: psychologyEngines },
    { pillar: 'global', label: 'Vision Globale', score: globalPillarScore, grade: gradeFromScore(globalPillarScore), engineScores: globalEngines },
  ];

  // ─── Global score (weighted) ───
  const globalScore = Math.round(
    strategyScore * 0.30 +
    simulationScore * 0.25 +
    psychologyScore * 0.25 +
    globalPillarScore * 0.20,
  );
  const globalGrade = gradeFromScore(globalScore);

  // ─── Top strengths & risks ───
  const allEngineScores = ENGINE_INFO.map((info) => ({
    key: info.key,
    label: info.label,
    score: get(info.key),
  }));

  const sorted = [...allEngineScores].sort((a, b) => b.score - a.score);
  const topStrengths = sorted.slice(0, 3).map(
    (e) => `Excellente ${e.label.toLowerCase()} (${e.score}/100)`,
  );
  const topRisks = sorted.slice(-3).reverse().map(
    (e) => `${e.label} insuffisante (${e.score}/100)`,
  );

  // ─── Action plan (5 weakest engines) ───
  const weakest = [...allEngineScores].sort((a, b) => a.score - b.score).slice(0, 5);
  const actionPlan: WisdomAction[] = weakest.map((e, i) => {
    const info = ENGINE_INFO.find((ei) => ei.key === e.key)!;
    return {
      priority: i + 1,
      action: info.actionWhenLow,
      impact: e.score < 40 ? 'high' : e.score < 60 ? 'medium' : 'low',
      category: info.category,
    };
  });

  // ─── Maturity level ───
  let maturityLevel: WisdomSynthesis['maturityLevel'];
  let maturityLabel: string;
  if (globalScore >= 85) {
    maturityLevel = 'expert';
    maturityLabel = 'Expert';
  } else if (globalScore >= 70) {
    maturityLevel = 'avance';
    maturityLabel = 'Avance';
  } else if (globalScore >= 50) {
    maturityLevel = 'intermediaire';
    maturityLabel = 'Intermediaire';
  } else {
    maturityLevel = 'debutant';
    maturityLabel = 'Debutant';
  }

  // ─── Verdict ───
  const strongestPillar = [...pillars].sort((a, b) => b.score - a.score)[0];
  const weakestPillar = [...pillars].sort((a, b) => a.score - b.score)[0];

  let verdict: string;
  if (maturityLevel === 'expert') {
    verdict = `Investisseur expert avec une maitrise remarquable en ${strongestPillar.label.toLowerCase()}. Poursuivez l'optimisation de votre ${weakestPillar.label.toLowerCase()} pour atteindre l'excellence.`;
  } else if (maturityLevel === 'avance') {
    verdict = `Investisseur avance avec une excellente ${strongestPillar.label.toLowerCase()} mais une ${weakestPillar.label.toLowerCase()} a renforcer. Concentrez-vous sur les axes d'amelioration identifies.`;
  } else if (maturityLevel === 'intermediaire') {
    verdict = `Investisseur intermediaire avec des bases solides en ${strongestPillar.label.toLowerCase()}. Renforcez votre ${weakestPillar.label.toLowerCase()} pour progresser vers le niveau avance.`;
  } else {
    verdict = `Investisseur debutant en phase d'apprentissage. Commencez par consolider votre ${strongestPillar.label.toLowerCase()} et travaillez progressivement sur votre ${weakestPillar.label.toLowerCase()}.`;
  }

  return {
    globalScore,
    globalGrade,
    pillars,
    topStrengths,
    topRisks,
    actionPlan,
    maturityLevel,
    maturityLabel,
    verdict,
  };
}
