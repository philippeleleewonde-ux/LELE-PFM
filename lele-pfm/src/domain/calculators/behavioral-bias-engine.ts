/**
 * Behavioral Bias Detection Engine — LELE PFM
 *
 * Detects 8 common behavioral biases from portfolio allocations.
 * Pure functions, no side effects.
 */

import { AssetClass, AllocationRecommendation } from '@/types/investment';

// ─── Types ───

export type BiasType =
  | 'home_bias'
  | 'overconfidence'
  | 'loss_aversion'
  | 'recency_bias'
  | 'herding'
  | 'anchoring'
  | 'disposition_effect'
  | 'concentration_bias';

export interface BiasDetection {
  bias: BiasType;
  label: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  score: number;          // 0-10
  detected: boolean;
  explanation: string;
  debiasing: string;
}

export interface BiasAnalysis {
  biases: BiasDetection[];
  overallScore: number;           // 0-10 (0=many biases, 10=rational)
  rationalityGrade: string;       // A+ to E
  topRisks: BiasDetection[];      // Top 3 most severe
  summary: string;
}

// ─── Bias Definitions (French) ───

interface BiasDefinition {
  label: string;
  description: string;
  debiasing: string;
}

const BIAS_DEFINITIONS: Record<BiasType, BiasDefinition> = {
  home_bias: {
    label: 'Biais domestique',
    description:
      'Tendance a surponderer les investissements locaux (actions locales, tontine, micro-entreprise) au detriment de la diversification internationale.',
    debiasing:
      'Diversifiez avec des fonds indiciels internationaux. Les marches emergents et developpes offrent des opportunites decorrelees de votre economie locale.',
  },
  overconfidence: {
    label: 'Exces de confiance',
    description:
      'Concentration excessive sur un petit nombre de positions, suggerant une confiance demesure dans ses propres choix.',
    debiasing:
      'Limitez chaque position a 15-20% max du portefeuille. Utilisez des fonds diversifies plutot que des paris concentres.',
  },
  loss_aversion: {
    label: 'Aversion aux pertes',
    description:
      'Surponderation des actifs sans risque (epargne, depots, monetaire) au detriment du rendement long terme.',
    debiasing:
      'Gardez 3-6 mois de depenses en epargne de precaution, puis investissez le reste selon votre horizon. Le risque de ne pas investir est aussi un risque.',
  },
  recency_bias: {
    label: 'Biais de recence',
    description:
      'Surponderation des actifs recemment performants (crypto) sans analyse fondamentale, influencee par les tendances recentes.',
    debiasing:
      'Les performances passees ne presagent pas des performances futures. Limitez les actifs speculatifs a 5-10% de votre portefeuille.',
  },
  herding: {
    label: 'Effet de troupeau',
    description:
      'Tendance a suivre les choix populaires (indices, epargne, obligations d\'Etat) sans reflexion personnelle sur ses besoins.',
    debiasing:
      'Construisez une allocation basee sur VOS objectifs et horizon, pas sur ce que \"tout le monde\" fait. Un conseiller peut aider.',
  },
  anchoring: {
    label: 'Ancrage',
    description:
      'Utilisation de chiffres ronds (10%, 20%, 25%) pour les allocations, suggerant un manque d\'analyse precisise.',
    debiasing:
      'Calculez vos allocations en fonction de votre profil de risque et de vos objectifs, pas en arrondissant a des chiffres \"pratiques\".',
  },
  disposition_effect: {
    label: 'Effet de disposition',
    description:
      'Tendance a vendre les gagnants trop tot et a garder les perdants trop longtemps. Difficile a detecter statiquement.',
    debiasing:
      'Definissez des regles de vente a l\'avance (stop-loss, objectifs de gain). Rebalancez periodiquement sans emotion.',
  },
  concentration_bias: {
    label: 'Biais de concentration',
    description:
      'Une position domine le portefeuille, creant un risque specifique eleve en cas de retournement de cet actif.',
    debiasing:
      'Aucun actif ne devrait depasser 25-30% du portefeuille. Rebalancez trimestriellement pour maintenir la diversification.',
  },
};

// ─── Detection Functions ───

const LOCAL_ASSETS: AssetClass[] = ['local_stocks', 'tontine', 'micro_enterprise'];
const SAFE_ASSETS: AssetClass[] = ['savings_account', 'term_deposit', 'money_market'];
const POPULAR_ASSETS: AssetClass[] = ['stock_index', 'savings_account', 'government_bonds'];

function totalWeight(allocations: AllocationRecommendation[]): number {
  return allocations.reduce((sum, a) => sum + a.weight, 0);
}

function weightOfAssets(allocations: AllocationRecommendation[], assets: AssetClass[]): number {
  return allocations
    .filter((a) => assets.includes(a.product.asset))
    .reduce((sum, a) => sum + a.weight, 0);
}

function detectHomeBias(allocations: AllocationRecommendation[]): number {
  const total = totalWeight(allocations);
  if (total === 0) return 0;
  const localWeight = weightOfAssets(allocations, LOCAL_ASSETS);
  return Math.min(10, (localWeight / total) * 10);
}

function detectOverconfidence(allocations: AllocationRecommendation[]): number {
  const concentrated = allocations.filter((a) => a.weight > 25).length;
  return Math.min(10, concentrated * 2.5);
}

function detectLossAversion(allocations: AllocationRecommendation[]): number {
  const total = totalWeight(allocations);
  if (total === 0) return 0;
  const safeWeight = weightOfAssets(allocations, SAFE_ASSETS);
  return Math.min(10, (safeWeight / total) * 10);
}

function detectRecencyBias(allocations: AllocationRecommendation[]): number {
  const total = totalWeight(allocations);
  if (total === 0) return 0;
  const cryptoWeight = weightOfAssets(allocations, ['crypto']);
  return Math.min(10, (cryptoWeight / total) * 15);
}

function detectHerding(allocations: AllocationRecommendation[]): number {
  const total = totalWeight(allocations);
  if (total === 0) return 0;
  const popularWeight = weightOfAssets(allocations, POPULAR_ASSETS);
  const ratio = popularWeight / total;
  if (ratio > 0.7) return Math.min(10, 8 + (ratio - 0.7) * 10);
  return Math.min(10, ratio * 10);
}

function detectAnchoring(allocations: AllocationRecommendation[]): number {
  if (allocations.length === 0) return 0;
  const roundCount = allocations.filter((a) => a.weight % 5 === 0).length;
  const ratio = roundCount / allocations.length;
  if (ratio > 0.7) return Math.min(10, 7 + (ratio - 0.7) * 10);
  return Math.min(10, ratio * 8);
}

function detectDispositionEffect(): number {
  // Cannot detect statically from allocation snapshot
  return 3;
}

function detectConcentrationBias(allocations: AllocationRecommendation[]): number {
  if (allocations.length === 0) return 0;
  const maxWeight = Math.max(...allocations.map((a) => a.weight));
  return Math.min(10, (maxWeight / 50) * 10);
}

// ─── Severity & Grade Helpers ───

function getSeverity(score: number): 'low' | 'medium' | 'high' {
  if (score > 6) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function getExplanation(bias: BiasType, score: number, allocations: AllocationRecommendation[]): string {
  const total = totalWeight(allocations);
  switch (bias) {
    case 'home_bias': {
      const pct = total > 0 ? ((weightOfAssets(allocations, LOCAL_ASSETS) / total) * 100).toFixed(0) : '0';
      return `${pct}% de votre portefeuille est investi localement. ${score >= 4 ? 'C\'est au-dessus du seuil recommande de 30-40%.' : 'C\'est dans une fourchette acceptable.'}`;
    }
    case 'overconfidence': {
      const count = allocations.filter((a) => a.weight > 25).length;
      return `${count} position(s) depassent 25% du portefeuille. ${score >= 4 ? 'Cela indique une concentration excessive.' : 'La diversification est correcte.'}`;
    }
    case 'loss_aversion': {
      const pct = total > 0 ? ((weightOfAssets(allocations, SAFE_ASSETS) / total) * 100).toFixed(0) : '0';
      return `${pct}% en actifs sans risque (epargne, depots, monetaire). ${score >= 4 ? 'Vous sacrifiez du rendement par aversion au risque.' : 'L\'equilibre est raisonnable.'}`;
    }
    case 'recency_bias': {
      const pct = total > 0 ? ((weightOfAssets(allocations, ['crypto']) / total) * 100).toFixed(0) : '0';
      return `${pct}% en crypto-actifs. ${score >= 4 ? 'La surexposition aux actifs tendances est risquee.' : 'L\'exposition reste moderee.'}`;
    }
    case 'herding': {
      const pct = total > 0 ? ((weightOfAssets(allocations, POPULAR_ASSETS) / total) * 100).toFixed(0) : '0';
      return `${pct}% dans les 3 actifs les plus populaires. ${score >= 4 ? 'Votre portefeuille ressemble a celui de la majorite.' : 'Votre allocation est personnalisee.'}`;
    }
    case 'anchoring': {
      const roundCount = allocations.filter((a) => a.weight % 5 === 0).length;
      return `${roundCount}/${allocations.length} allocations sont des chiffres ronds (multiples de 5). ${score >= 4 ? 'Cela suggere un manque d\'optimisation fine.' : 'Les allocations semblent calculees.'}`;
    }
    case 'disposition_effect':
      return 'Ce biais ne peut etre detecte que par l\'analyse de vos transactions historiques d\'achat/vente. Score par defaut attribue.';
    case 'concentration_bias': {
      const maxW = allocations.length > 0 ? Math.max(...allocations.map((a) => a.weight)) : 0;
      return `Position la plus lourde : ${maxW}%. ${score >= 4 ? 'Risque de concentration eleve.' : 'La diversification est bonne.'}`;
    }
  }
}

const GRADE_MAP: Record<number, string> = {
  10: 'A+', 9: 'A+', 8: 'A', 7: 'B', 6: 'B', 5: 'C', 4: 'C', 3: 'D', 2: 'D', 1: 'E', 0: 'E',
};

function getGrade(score: number): string {
  const rounded = Math.min(10, Math.max(0, Math.round(score)));
  return GRADE_MAP[rounded] ?? 'E';
}

// ─── Main Analysis Function ───

export function analyzeBiases(allocations: AllocationRecommendation[]): BiasAnalysis {
  const detectors: Record<BiasType, (allocs: AllocationRecommendation[]) => number> = {
    home_bias: detectHomeBias,
    overconfidence: detectOverconfidence,
    loss_aversion: detectLossAversion,
    recency_bias: detectRecencyBias,
    herding: detectHerding,
    anchoring: detectAnchoring,
    disposition_effect: detectDispositionEffect,
    concentration_bias: detectConcentrationBias,
  };

  const biases: BiasDetection[] = (Object.keys(detectors) as BiasType[]).map((biasType) => {
    const score = detectors[biasType](allocations);
    const def = BIAS_DEFINITIONS[biasType];
    return {
      bias: biasType,
      label: def.label,
      description: def.description,
      severity: getSeverity(score),
      score: Math.round(score * 10) / 10,
      detected: score >= 4,
      explanation: getExplanation(biasType, score, allocations),
      debiasing: def.debiasing,
    };
  });

  const avgScore = biases.length > 0
    ? biases.reduce((sum, b) => sum + b.score, 0) / biases.length
    : 0;
  const overallScore = Math.max(0, Math.min(10, Math.round((10 - avgScore) * 10) / 10));
  const rationalityGrade = getGrade(overallScore);

  const topRisks = [...biases]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const detectedCount = biases.filter((b) => b.detected).length;
  let summary: string;
  if (detectedCount === 0) {
    summary = 'Excellent ! Aucun biais comportemental significatif detecte. Votre approche d\'investissement semble rationnelle et bien diversifiee.';
  } else if (detectedCount <= 2) {
    summary = `${detectedCount} biais detecte(s). Quelques ajustements pourraient ameliorer la rationalite de votre portefeuille.`;
  } else if (detectedCount <= 4) {
    summary = `${detectedCount} biais detectes. Votre portefeuille presente des desequilibres comportementaux a corriger pour optimiser vos resultats.`;
  } else {
    summary = `${detectedCount} biais detectes. Attention, votre portefeuille est fortement influence par des biais cognitifs. Une revision complete est recommandee.`;
  }

  return {
    biases,
    overallScore,
    rationalityGrade,
    topRisks,
    summary,
  };
}
