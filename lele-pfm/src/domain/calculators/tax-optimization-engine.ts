/**
 * Tax Optimization Engine — LELE PFM
 *
 * Pure functions for tax regime analysis, per-asset tax efficiency,
 * and optimization strategy recommendations. No side effects, no state.
 */

import { AssetClass, AllocationRecommendation } from '@/types/investment';

// ─── Types ───

export type TaxRegime =
  | 'flat_tax'
  | 'progressive'
  | 'capital_gains'
  | 'exempt'
  | 'sharia_zakat';

export interface TaxRegimeInfo {
  id: TaxRegime;
  label: string;
  description: string;
  rate: number; // Effective rate %
  applicableTo: string; // Which income types
}

export interface AssetTaxProfile {
  asset: AssetClass;
  assetName: string;
  grossReturn: number; // Pre-tax %
  taxRate: number; // Applied tax rate %
  netReturn: number; // After-tax %
  taxDrag: number; // Gross - Net (lost to tax)
  taxEfficiency: number; // netReturn / grossReturn * 100
  optimizationTip: string; // French tip
}

export interface TaxStrategy {
  id: string;
  title: string;
  description: string;
  potentialSaving: number; // Estimated annual saving %
  difficulty: 'easy' | 'moderate' | 'advanced';
  applicable: boolean; // Relevant to this portfolio
}

export interface TaxOptimizationResult {
  regime: TaxRegimeInfo;
  assetProfiles: AssetTaxProfile[];
  portfolioGrossReturn: number;
  portfolioNetReturn: number;
  portfolioTaxDrag: number; // Total % lost to tax
  taxEfficiencyScore: number; // 0-100
  strategies: TaxStrategy[];
  annualTaxEstimate: number; // % of portfolio value
  verdict: string; // French verdict
}

// ─── Constants ───

export const TAX_REGIMES: TaxRegimeInfo[] = [
  {
    id: 'flat_tax',
    label: 'Flat Tax (PFU)',
    description: 'Pr\u00e9l\u00e8vement forfaitaire unique sur les revenus du capital (ex: France 30%)',
    rate: 30,
    applicableTo: 'Dividendes, plus-values, int\u00e9r\u00eats',
  },
  {
    id: 'progressive',
    label: 'Bar\u00e8me progressif',
    description: 'Imposition au bar\u00e8me de l\'imp\u00f4t sur le revenu selon tranches',
    rate: 25,
    applicableTo: 'Tous revenus du capital int\u00e9gr\u00e9s aux revenus',
  },
  {
    id: 'capital_gains',
    label: 'Plus-values uniquement',
    description: 'Taxe uniquement sur les plus-values r\u00e9alis\u00e9es (ex: pays anglo-saxons)',
    rate: 20,
    applicableTo: 'Plus-values r\u00e9alis\u00e9es uniquement',
  },
  {
    id: 'exempt',
    label: 'Exon\u00e9ration fiscale',
    description: 'Revenus du capital exon\u00e9r\u00e9s (ex: certains pays du Golfe, zones franches)',
    rate: 0,
    applicableTo: 'Tous revenus exon\u00e9r\u00e9s',
  },
  {
    id: 'sharia_zakat',
    label: 'Zakat (2.5%)',
    description: 'Contribution religieuse sur le patrimoine net (finance islamique)',
    rate: 2.5,
    applicableTo: 'Patrimoine net au-dessus du nisab',
  },
];

const TAX_MODIFIERS: Record<AssetClass, { modifier: number; tip: string }> = {
  savings_account: {
    modifier: 1.0,
    tip: 'Int\u00e9r\u00eats pleinement imposables. Privil\u00e9giez les livrets r\u00e9glement\u00e9s exon\u00e9r\u00e9s.',
  },
  term_deposit: {
    modifier: 1.0,
    tip: 'Int\u00e9r\u00eats imposables \u00e0 100%. Comparez avec des alternatives d\u00e9fiscalis\u00e9es.',
  },
  government_bonds: {
    modifier: 0.7,
    tip: 'Certaines obligations d\'\u00c9tat b\u00e9n\u00e9ficient d\'exon\u00e9rations partielles.',
  },
  corporate_bonds: {
    modifier: 0.9,
    tip: 'Coupons imposables. Les obligations \u00e0 z\u00e9ro coupon reportent l\'imposition.',
  },
  stock_index: {
    modifier: 0.8,
    tip: 'Enveloppes fiscales (PEA, assurance-vie) r\u00e9duisent significativement l\'imposition.',
  },
  local_stocks: {
    modifier: 0.8,
    tip: 'Les abattements pour dur\u00e9e de d\u00e9tention peuvent r\u00e9duire l\'imp\u00f4t sur les plus-values.',
  },
  real_estate_fund: {
    modifier: 0.85,
    tip: 'Les SCPI en assurance-vie b\u00e9n\u00e9ficient d\'une fiscalit\u00e9 all\u00e9g\u00e9e.',
  },
  gold: {
    modifier: 0.6,
    tip: 'L\'or physique b\u00e9n\u00e9ficie souvent d\'un r\u00e9gime fiscal sp\u00e9cifique (taxe forfaitaire).',
  },
  crypto: {
    modifier: 1.0,
    tip: 'Fiscalit\u00e9 variable selon les pays. Le DCA r\u00e9duit les \u00e9v\u00e9nements imposables.',
  },
  tontine: {
    modifier: 0.3,
    tip: 'La tontine b\u00e9n\u00e9ficie d\'une fiscalit\u00e9 tr\u00e8s avantageuse \u00e0 long terme.',
  },
  micro_enterprise: {
    modifier: 0.5,
    tip: 'R\u00e9gime micro-entrepreneur avec abattement forfaitaire sur le chiffre d\'affaires.',
  },
  money_market: {
    modifier: 1.0,
    tip: 'Rendements faibles mais pleinement imposables. Optimisez via des enveloppes.',
  },
  sukuk: {
    modifier: 0.4,
    tip: 'Les sukuk b\u00e9n\u00e9ficient souvent d\'un traitement fiscal favorable en finance islamique.',
  },
  mutual_fund: {
    modifier: 0.85,
    tip: 'Privil\u00e9giez les fonds capitalisants pour reporter l\'imposition des gains.',
  },
};

const ASSET_LABELS: Record<AssetClass, string> = {
  savings_account: 'Compte \u00e9pargne',
  term_deposit: 'D\u00e9p\u00f4t \u00e0 terme',
  government_bonds: 'Obligations d\'\u00c9tat',
  corporate_bonds: 'Obligations entreprise',
  stock_index: 'Indice boursier',
  local_stocks: 'Actions locales',
  real_estate_fund: 'Fonds immobilier',
  gold: 'Or',
  crypto: 'Crypto-actifs',
  tontine: 'Tontine',
  micro_enterprise: 'Micro-entreprise',
  money_market: 'March\u00e9 mon\u00e9taire',
  sukuk: 'Sukuk',
  mutual_fund: 'Fonds commun',
};

// ─── Predefined strategies ───

const TAX_STRATEGIES: Omit<TaxStrategy, 'applicable'>[] = [
  {
    id: 'enveloppe',
    title: 'Utiliser des enveloppes fiscales',
    description: 'PEA, assurance-vie, PER r\u00e9duisent ou suppriment l\'imposition des gains.',
    potentialSaving: 5,
    difficulty: 'easy',
  },
  {
    id: 'holding_period',
    title: 'Allonger la dur\u00e9e de d\u00e9tention',
    description: 'Les abattements pour dur\u00e9e de d\u00e9tention r\u00e9duisent l\'imp\u00f4t sur les plus-values.',
    potentialSaving: 3,
    difficulty: 'easy',
  },
  {
    id: 'tax_loss',
    title: 'R\u00e9colte de pertes fiscales',
    description: 'Vendre les positions en perte pour compenser les gains imposables.',
    potentialSaving: 2,
    difficulty: 'moderate',
  },
  {
    id: 'capitalizing',
    title: 'Fonds capitalisants',
    description: 'Pr\u00e9f\u00e9rer les fonds qui r\u00e9investissent plut\u00f4t que distribuent pour reporter l\'imp\u00f4t.',
    potentialSaving: 2,
    difficulty: 'easy',
  },
  {
    id: 'geographic',
    title: 'Optimisation g\u00e9ographique',
    description: 'Certaines juridictions offrent des r\u00e9gimes fiscaux plus favorables.',
    potentialSaving: 4,
    difficulty: 'advanced',
  },
  {
    id: 'donation',
    title: 'Transmission anticip\u00e9e',
    description: 'Les donations b\u00e9n\u00e9ficient d\'abattements renouvelables r\u00e9duisant les droits.',
    potentialSaving: 3,
    difficulty: 'moderate',
  },
];

function buildStrategies(allocations: AllocationRecommendation[]): TaxStrategy[] {
  const assets = allocations.map((a) => a.product.asset);
  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0);
  const stockWeight = allocations
    .filter((a) => a.product.asset === 'stock_index' || a.product.asset === 'local_stocks')
    .reduce((s, a) => s + a.weight, 0);
  const stockPercent = totalWeight > 0 ? (stockWeight / totalWeight) * 100 : 0;
  const hasMutualFund = assets.includes('mutual_fund');

  return TAX_STRATEGIES.map((s) => {
    let applicable = false;
    switch (s.id) {
      case 'enveloppe':
        applicable = stockPercent > 10;
        break;
      case 'holding_period':
        applicable = true;
        break;
      case 'tax_loss':
        applicable = allocations.length > 5;
        break;
      case 'capitalizing':
        applicable = hasMutualFund;
        break;
      case 'geographic':
        applicable = true;
        break;
      case 'donation':
        applicable = true;
        break;
    }
    return { ...s, applicable };
  });
}

// ─── Main Analysis ───

/**
 * Analyze tax efficiency of a portfolio under a given regime.
 */
export function analyzePortfolioTax(
  allocations: AllocationRecommendation[],
  regime: TaxRegime,
): TaxOptimizationResult {
  const regimeInfo = TAX_REGIMES.find((r) => r.id === regime) ?? TAX_REGIMES[0];

  if (allocations.length === 0) {
    return {
      regime: regimeInfo,
      assetProfiles: [],
      portfolioGrossReturn: 0,
      portfolioNetReturn: 0,
      portfolioTaxDrag: 0,
      taxEfficiencyScore: 0,
      strategies: [],
      annualTaxEstimate: 0,
      verdict: 'Aucune allocation \u00e0 analyser.',
    };
  }

  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0);

  // Per-asset profiles
  const assetProfiles: AssetTaxProfile[] = allocations.map((a) => {
    const mod = TAX_MODIFIERS[a.product.asset] ?? { modifier: 1.0, tip: '' };
    const taxRate = regimeInfo.rate * mod.modifier;
    const grossReturn = a.product.returnRate;
    const netReturn = grossReturn * (1 - taxRate / 100);
    const taxDrag = grossReturn - netReturn;
    const taxEfficiency = grossReturn > 0 ? (netReturn / grossReturn) * 100 : 100;

    return {
      asset: a.product.asset,
      assetName: ASSET_LABELS[a.product.asset] ?? a.product.name,
      grossReturn,
      taxRate: Math.round(taxRate * 10) / 10,
      netReturn: Math.round(netReturn * 100) / 100,
      taxDrag: Math.round(taxDrag * 100) / 100,
      taxEfficiency: Math.round(taxEfficiency * 10) / 10,
      optimizationTip: mod.tip,
    };
  });

  // Weighted portfolio returns
  const portfolioGrossReturn =
    totalWeight > 0
      ? allocations.reduce((s, a) => s + a.product.returnRate * a.weight, 0) / totalWeight
      : 0;

  const portfolioNetReturn =
    totalWeight > 0
      ? assetProfiles.reduce((s, p, i) => s + p.netReturn * allocations[i].weight, 0) / totalWeight
      : 0;

  const portfolioTaxDrag = portfolioGrossReturn - portfolioNetReturn;

  // Tax efficiency score (0-100)
  const taxEfficiencyScore =
    portfolioGrossReturn > 0
      ? Math.round((portfolioNetReturn / portfolioGrossReturn) * 1000) / 10
      : 100;

  // Annual tax estimate as % of portfolio value
  const annualTaxEstimate = Math.round(portfolioTaxDrag * 100) / 100;

  // Strategies
  const strategies = buildStrategies(allocations);

  // Verdict
  const verdict = buildVerdict(taxEfficiencyScore, regimeInfo, strategies);

  return {
    regime: regimeInfo,
    assetProfiles,
    portfolioGrossReturn: Math.round(portfolioGrossReturn * 100) / 100,
    portfolioNetReturn: Math.round(portfolioNetReturn * 100) / 100,
    portfolioTaxDrag: Math.round(portfolioTaxDrag * 100) / 100,
    taxEfficiencyScore,
    strategies,
    annualTaxEstimate,
    verdict,
  };
}

function buildVerdict(
  score: number,
  regime: TaxRegimeInfo,
  strategies: TaxStrategy[],
): string {
  const applicableCount = strategies.filter((s) => s.applicable).length;

  if (regime.id === 'exempt') {
    return 'Votre portefeuille est dans une enveloppe exon\u00e9r\u00e9e. Efficacit\u00e9 fiscale maximale.';
  }

  if (score >= 90) {
    return `Excellente efficacit\u00e9 fiscale (${score}%). Votre portefeuille est bien optimis\u00e9 sous le r\u00e9gime ${regime.label}.`;
  }

  if (score >= 75) {
    return `Bonne efficacit\u00e9 fiscale (${score}%). ${applicableCount} strat\u00e9gie${applicableCount > 1 ? 's' : ''} d'optimisation disponible${applicableCount > 1 ? 's' : ''} pour am\u00e9liorer votre rendement net.`;
  }

  if (score >= 60) {
    return `Efficacit\u00e9 fiscale mod\u00e9r\u00e9e (${score}%). Explorez les ${applicableCount} strat\u00e9gies recommand\u00e9es pour r\u00e9duire significativement votre charge fiscale.`;
  }

  return `Efficacit\u00e9 fiscale faible (${score}%). Une restructuration fiscale est fortement recommand\u00e9e. ${applicableCount} piste${applicableCount > 1 ? 's' : ''} d'optimisation identifi\u00e9e${applicableCount > 1 ? 's' : ''}.`;
}
