/**
 * Pre-Mortem Analysis Engine — LELE PFM
 *
 * Identifies potential failure modes for an investment portfolio
 * and computes survival probability, risk levels, and action plans.
 */

import type { AllocationRecommendation, AssetClass } from '@/types/investment';

// ─── Types ───

export interface FailureMode {
  id: string;
  title: string;
  description: string;
  probability: number; // 0-100
  impact: 'low' | 'medium' | 'high' | 'critical';
  impactPercent: number;
  triggerConditions: string;
  mitigation: string;
  affectedAssets: string[];
}

export interface PreMortemAnalysis {
  failureModes: FailureMode[];
  overallRiskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  survivalProbability: number;
  topThreats: FailureMode[];
  summary: string;
  actionPlan: string[];
}

// ─── Failure Mode Templates ───

interface FailureModeTemplate {
  id: string;
  title: string;
  description: string;
  impact: FailureMode['impact'];
  impactPercent: number;
  triggerConditions: string;
  mitigation: string;
}

const FAILURE_TEMPLATES: Record<string, FailureModeTemplate> = {
  market_crash: {
    id: 'market_crash',
    title: 'Krach boursier',
    description:
      'Une correction majeure des marchés actions (-30% à -50%) efface une partie significative du capital investi en actions.',
    impact: 'critical',
    impactPercent: -40,
    triggerConditions:
      'Récession mondiale, crise géopolitique, bulle spéculative qui éclate, hausse brutale des taux directeurs.',
    mitigation:
      'Diversifier hors actions, maintenir une réserve de liquidités pour racheter en bas de cycle, ne pas vendre en panique.',
  },
  inflation_spike: {
    id: 'inflation_spike',
    title: 'Flambée inflationniste',
    description:
      "Une inflation élevée et prolongée (>10%) érode le pouvoir d'achat réel de l'épargne et des rendements obligataires.",
    impact: 'high',
    impactPercent: -15,
    triggerConditions:
      'Choc pétrolier, création monétaire excessive, ruptures de chaînes d\'approvisionnement, instabilité politique.',
    mitigation:
      "Inclure des actifs réels (immobilier, or), des obligations indexées sur l'inflation, et des actions de secteurs défensifs.",
  },
  crypto_collapse: {
    id: 'crypto_collapse',
    title: 'Effondrement crypto',
    description:
      'Le marché des cryptomonnaies subit un effondrement majeur (-70% à -90%), anéantissant la valeur des positions crypto.',
    impact: 'critical',
    impactPercent: -80,
    triggerConditions:
      'Régulation restrictive, faille de sécurité majeure, perte de confiance généralisée, interdiction gouvernementale.',
    mitigation:
      'Limiter l\'exposition crypto à 5-10% maximum du portefeuille, privilégier les projets établis, utiliser le DCA.',
  },
  rate_shock: {
    id: 'rate_shock',
    title: 'Choc de taux',
    description:
      'Une hausse rapide des taux d\'intérêt fait chuter la valeur des obligations et renchérit le coût de l\'immobilier.',
    impact: 'high',
    impactPercent: -20,
    triggerConditions:
      'Politique monétaire restrictive, lutte contre l\'inflation, normalisation des taux après période de taux bas.',
    mitigation:
      'Privilégier les obligations à court terme, diversifier les maturités, réduire l\'exposition immobilière à crédit.',
  },
  concentration_loss: {
    id: 'concentration_loss',
    title: 'Perte par concentration',
    description:
      'Une position trop concentrée (>25% du portefeuille) subit une perte importante, entraînant le portefeuille global.',
    impact: 'high',
    impactPercent: -25,
    triggerConditions:
      'Faillite d\'un émetteur, défaut de paiement, secteur en crise, événement spécifique à un actif.',
    mitigation:
      'Respecter la règle des 25% maximum par position, rééquilibrer régulièrement, diversifier entre classes d\'actifs.',
  },
  liquidity_crisis: {
    id: 'liquidity_crisis',
    title: 'Crise de liquidité',
    description:
      'Impossibilité de vendre des actifs illiquides au moment où les fonds sont nécessaires, forçant une vente à perte.',
    impact: 'medium',
    impactPercent: -15,
    triggerConditions:
      'Besoin urgent de trésorerie, marché immobilier gelé, tontine non arrivée à terme, micro-entreprise en difficulté.',
    mitigation:
      'Maintenir 3-6 mois de dépenses en actifs liquides, limiter les investissements bloqués à 30% du portefeuille.',
  },
  currency_risk: {
    id: 'currency_risk',
    title: 'Risque de change',
    description:
      'La dévaluation de la monnaie locale réduit la valeur réelle des actifs libellés en monnaie locale.',
    impact: 'medium',
    impactPercent: -20,
    triggerConditions:
      'Instabilité politique, déficit commercial chronique, fuite des capitaux, crise de confiance dans la monnaie.',
    mitigation:
      'Diversifier en devises fortes (USD, EUR), inclure de l\'or comme couverture, limiter l\'exposition locale à 30%.',
  },
  behavioral_failure: {
    id: 'behavioral_failure',
    title: 'Échec comportemental',
    description:
      'Décisions émotionnelles (vente panique, FOMO, excès de confiance) sabotent la stratégie d\'investissement à long terme.',
    impact: 'high',
    impactPercent: -30,
    triggerConditions:
      'Volatilité des marchés, pression sociale, manque de discipline, absence de plan écrit, suivi obsessionnel des cours.',
    mitigation:
      'Suivre un plan écrit, automatiser les investissements (DCA), ne pas consulter le portefeuille quotidiennement, se former.',
  },
};

// ─── Asset Classification Helpers ───

const STOCK_ASSETS: AssetClass[] = ['stock_index', 'local_stocks', 'mutual_fund'];
const BOND_ASSETS: AssetClass[] = ['government_bonds', 'corporate_bonds', 'sukuk'];
const REAL_ESTATE_ASSETS: AssetClass[] = ['real_estate_fund'];
const CRYPTO_ASSETS: AssetClass[] = ['crypto'];
const ILLIQUID_ASSETS: AssetClass[] = ['real_estate_fund', 'tontine', 'micro_enterprise'];
const LOCAL_ASSETS: AssetClass[] = ['local_stocks', 'tontine', 'micro_enterprise'];

function getWeightByAssets(
  allocations: AllocationRecommendation[],
  assetClasses: AssetClass[],
): number {
  return allocations
    .filter((a) => assetClasses.includes(a.product.asset))
    .reduce((sum, a) => sum + a.weight, 0);
}

function getMaxWeight(allocations: AllocationRecommendation[]): number {
  if (allocations.length === 0) return 0;
  return Math.max(...allocations.map((a) => a.weight));
}

function getAffectedNames(
  allocations: AllocationRecommendation[],
  assetClasses: AssetClass[],
): string[] {
  return allocations
    .filter((a) => assetClasses.includes(a.product.asset))
    .map((a) => a.product.name);
}

// ─── Probability Calculators ───

function calcProbability(
  modeId: string,
  allocations: AllocationRecommendation[],
): number {
  const stocksW = getWeightByAssets(allocations, STOCK_ASSETS);
  const cryptoW = getWeightByAssets(allocations, CRYPTO_ASSETS);
  const bondsW = getWeightByAssets(allocations, BOND_ASSETS);
  const illiquidW = getWeightByAssets(allocations, ILLIQUID_ASSETS);
  const localW = getWeightByAssets(allocations, LOCAL_ASSETS);
  const maxW = getMaxWeight(allocations);

  switch (modeId) {
    case 'market_crash':
      return Math.min(100, 15 + stocksW * 0.3);
    case 'inflation_spike':
      return 20;
    case 'crypto_collapse':
      return Math.min(100, 25 + cryptoW * 1.5);
    case 'rate_shock':
      return Math.min(100, 15 + bondsW * 0.3);
    case 'concentration_loss':
      return Math.min(100, maxW * 0.8);
    case 'liquidity_crisis':
      return Math.min(100, illiquidW * 0.6);
    case 'currency_risk':
      return Math.min(100, localW * 0.4);
    case 'behavioral_failure':
      return 40;
    default:
      return 0;
  }
}

// Map each failure mode to the asset classes it affects
const MODE_AFFECTED_ASSETS: Record<string, AssetClass[]> = {
  market_crash: STOCK_ASSETS,
  inflation_spike: [...BOND_ASSETS, 'savings_account', 'term_deposit', 'money_market'],
  crypto_collapse: CRYPTO_ASSETS,
  rate_shock: [...BOND_ASSETS, ...REAL_ESTATE_ASSETS],
  concentration_loss: [], // special: all assets (handled below)
  liquidity_crisis: ILLIQUID_ASSETS,
  currency_risk: LOCAL_ASSETS,
  behavioral_failure: [], // affects everything
};

// ─── Selection Logic ───

function shouldInclude(
  modeId: string,
  allocations: AllocationRecommendation[],
): boolean {
  const stocksW = getWeightByAssets(allocations, STOCK_ASSETS);
  const cryptoW = getWeightByAssets(allocations, CRYPTO_ASSETS);
  const bondsReW =
    getWeightByAssets(allocations, BOND_ASSETS) +
    getWeightByAssets(allocations, REAL_ESTATE_ASSETS);
  const maxW = getMaxWeight(allocations);
  const illiquidW = getWeightByAssets(allocations, ILLIQUID_ASSETS);
  const localW = getWeightByAssets(allocations, LOCAL_ASSETS);

  switch (modeId) {
    case 'market_crash':
      return stocksW > 10;
    case 'inflation_spike':
      return true;
    case 'crypto_collapse':
      return cryptoW > 0;
    case 'rate_shock':
      return bondsReW > 20;
    case 'concentration_loss':
      return maxW > 25;
    case 'liquidity_crisis':
      return illiquidW > 30;
    case 'currency_risk':
      return localW > 30;
    case 'behavioral_failure':
      return true;
    default:
      return false;
  }
}

// ─── Main Function ───

export function runPreMortem(
  allocations: AllocationRecommendation[],
): PreMortemAnalysis {
  const failureModes: FailureMode[] = [];

  for (const [modeId, template] of Object.entries(FAILURE_TEMPLATES)) {
    if (!shouldInclude(modeId, allocations)) continue;

    const probability = Math.round(calcProbability(modeId, allocations));

    // Determine affected asset names
    let affectedAssets: string[];
    if (modeId === 'concentration_loss' || modeId === 'behavioral_failure') {
      affectedAssets = allocations.map((a) => a.product.name);
    } else {
      affectedAssets = getAffectedNames(
        allocations,
        MODE_AFFECTED_ASSETS[modeId] ?? [],
      );
    }

    failureModes.push({
      ...template,
      probability,
      affectedAssets,
    });
  }

  // Score = probability * |impactPercent|
  const scored = failureModes
    .map((fm) => ({ fm, score: fm.probability * Math.abs(fm.impactPercent) }))
    .sort((a, b) => b.score - a.score);

  const topThreats = scored.slice(0, 3).map((s) => s.fm);

  // Overall risk level based on avg of top 3 probabilities
  const top3Probs = topThreats.map((t) => t.probability);
  const avgTop3 =
    top3Probs.length > 0
      ? top3Probs.reduce((s, p) => s + p, 0) / top3Probs.length
      : 0;

  let overallRiskLevel: PreMortemAnalysis['overallRiskLevel'];
  if (avgTop3 < 25) overallRiskLevel = 'low';
  else if (avgTop3 < 40) overallRiskLevel = 'moderate';
  else if (avgTop3 < 55) overallRiskLevel = 'elevated';
  else overallRiskLevel = 'high';

  // Survival probability: 100 - weighted average risk, clamped 20-95
  const totalImpact = scored.reduce(
    (s, x) => s + Math.abs(x.fm.impactPercent),
    0,
  );
  const weightedAvgRisk =
    totalImpact > 0
      ? scored.reduce(
          (s, x) =>
            s +
            (x.fm.probability * Math.abs(x.fm.impactPercent)) / totalImpact,
          0,
        ) * 100
      : 0;
  const survivalProbability = Math.round(
    Math.max(20, Math.min(95, 100 - weightedAvgRisk)),
  );

  // Action plan: top 5 unique mitigations from scored order
  const seen = new Set<string>();
  const actionPlan: string[] = [];
  for (const { fm } of scored) {
    if (!seen.has(fm.mitigation)) {
      seen.add(fm.mitigation);
      actionPlan.push(fm.mitigation);
      if (actionPlan.length >= 5) break;
    }
  }

  // Summary in French
  const riskLabels: Record<string, string> = {
    low: 'faible',
    moderate: 'modéré',
    elevated: 'élevé',
    high: 'élevé',
  };
  const summary =
    failureModes.length === 0
      ? 'Aucun mode de défaillance identifié pour votre portefeuille actuel.'
      : `Votre portefeuille présente un niveau de risque global ${riskLabels[overallRiskLevel]}. ` +
        `${failureModes.length} scénario${failureModes.length > 1 ? 's' : ''} de défaillance ` +
        `identifié${failureModes.length > 1 ? 's' : ''}, avec une probabilité de survie estimée à ${survivalProbability}%. ` +
        `Les menaces principales sont : ${topThreats.map((t) => t.title.toLowerCase()).join(', ')}.`;

  return {
    failureModes,
    overallRiskLevel,
    survivalProbability,
    topThreats,
    summary,
    actionPlan,
  };
}
