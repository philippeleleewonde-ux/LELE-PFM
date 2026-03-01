/**
 * Asset Categories V2 — LELE PFM
 *
 * Complete metadata for all 26 asset classes.
 * Maps each AssetClass to its pillar, risk profile, typical returns/volatility, and UI info.
 */

import { AssetClass } from '@/types/investment';
import { AssetCategoryMeta } from '@/types/investor-journey';

export const ASSET_CATEGORIES: Record<AssetClass, AssetCategoryMeta> = {

  // ═══════════════════════════════════════════
  // BASE ARRIERE — Capital garanti, liquidite maximale
  // ═══════════════════════════════════════════

  savings_account: {
    code: 'savings_account',
    labelKey: 'assets.savings_account.label',
    descKey: 'assets.savings_account.desc',
    icon: 'PiggyBank',
    pillar: 'base_arriere',
    minEKH: 0,
    complexityLevel: 1,
    typicalReturn: { min: 1, max: 3 },
    typicalVolatility: { min: 0, max: 1 },
    typicalLiquidity: 'immediate',
    shariaAvailable: true,
  },

  term_deposit: {
    code: 'term_deposit',
    labelKey: 'assets.term_deposit.label',
    descKey: 'assets.term_deposit.desc',
    icon: 'Timer',
    pillar: 'base_arriere',
    minEKH: 0,
    complexityLevel: 1,
    typicalReturn: { min: 2, max: 5 },
    typicalVolatility: { min: 0, max: 2 },
    typicalLiquidity: 'locked',
    shariaAvailable: true,
  },

  money_market: {
    code: 'money_market',
    labelKey: 'assets.money_market.label',
    descKey: 'assets.money_market.desc',
    icon: 'Banknote',
    pillar: 'base_arriere',
    minEKH: 0,
    complexityLevel: 1,
    typicalReturn: { min: 1, max: 4 },
    typicalVolatility: { min: 1, max: 3 },
    typicalLiquidity: 'immediate',
    shariaAvailable: true,
  },

  tontine: {
    code: 'tontine',
    labelKey: 'assets.tontine.label',
    descKey: 'assets.tontine.desc',
    icon: 'Users',
    pillar: 'base_arriere',
    minEKH: 0,
    complexityLevel: 1,
    typicalReturn: { min: 3, max: 8 },
    typicalVolatility: { min: 5, max: 10 },
    typicalLiquidity: 'locked',
    shariaAvailable: true,
  },

  // ═══════════════════════════════════════════
  // AMORTISSEUR — Revenus fixes, stabilite
  // ═══════════════════════════════════════════

  government_bonds: {
    code: 'government_bonds',
    labelKey: 'assets.government_bonds.label',
    descKey: 'assets.government_bonds.desc',
    icon: 'Building2',
    pillar: 'amortisseur',
    minEKH: 3,
    complexityLevel: 1,
    typicalReturn: { min: 3, max: 7 },
    typicalVolatility: { min: 3, max: 8 },
    typicalLiquidity: 'days',
    shariaAvailable: true,
  },

  corporate_bonds: {
    code: 'corporate_bonds',
    labelKey: 'assets.corporate_bonds.label',
    descKey: 'assets.corporate_bonds.desc',
    icon: 'Building',
    pillar: 'amortisseur',
    minEKH: 5,
    complexityLevel: 2,
    typicalReturn: { min: 4, max: 9 },
    typicalVolatility: { min: 5, max: 12 },
    typicalLiquidity: 'days',
    shariaAvailable: true,
  },

  sukuk: {
    code: 'sukuk',
    labelKey: 'assets.sukuk.label',
    descKey: 'assets.sukuk.desc',
    icon: 'Moon',
    pillar: 'amortisseur',
    minEKH: 5,
    complexityLevel: 2,
    typicalReturn: { min: 3, max: 7 },
    typicalVolatility: { min: 4, max: 8 },
    typicalLiquidity: 'days',
    shariaAvailable: true,
  },

  municipal_bonds: {
    code: 'municipal_bonds',
    labelKey: 'assets.municipal_bonds.label',
    descKey: 'assets.municipal_bonds.desc',
    icon: 'Landmark',
    pillar: 'amortisseur',
    minEKH: 3,
    complexityLevel: 1,
    typicalReturn: { min: 3, max: 6 },
    typicalVolatility: { min: 3, max: 7 },
    typicalLiquidity: 'days',
    shariaAvailable: true,
  },

  venture_debt: {
    code: 'venture_debt',
    labelKey: 'assets.venture_debt.label',
    descKey: 'assets.venture_debt.desc',
    icon: 'FileText',
    pillar: 'amortisseur',
    minEKH: 8,
    complexityLevel: 2,
    typicalReturn: { min: 8, max: 15 },
    typicalVolatility: { min: 10, max: 20 },
    typicalLiquidity: 'months',
    shariaAvailable: true,
  },

  mezzanine: {
    code: 'mezzanine',
    labelKey: 'assets.mezzanine.label',
    descKey: 'assets.mezzanine.desc',
    icon: 'Layers',
    pillar: 'amortisseur',
    minEKH: 8,
    complexityLevel: 3,
    typicalReturn: { min: 10, max: 18 },
    typicalVolatility: { min: 12, max: 22 },
    typicalLiquidity: 'months',
    shariaAvailable: true,
  },

  esg_bonds: {
    code: 'esg_bonds',
    labelKey: 'assets.esg_bonds.label',
    descKey: 'assets.esg_bonds.desc',
    icon: 'Leaf',
    pillar: 'amortisseur',
    minEKH: 3,
    complexityLevel: 1,
    typicalReturn: { min: 3, max: 7 },
    typicalVolatility: { min: 4, max: 8 },
    typicalLiquidity: 'days',
    shariaAvailable: true,
  },

  // ═══════════════════════════════════════════
  // CROISSANCE — Actions, capital-risque, rendement eleve
  // ═══════════════════════════════════════════

  stock_index: {
    code: 'stock_index',
    labelKey: 'assets.stock_index.label',
    descKey: 'assets.stock_index.desc',
    icon: 'BarChart3',
    pillar: 'croissance',
    minEKH: 5,
    complexityLevel: 2,
    typicalReturn: { min: 6, max: 12 },
    typicalVolatility: { min: 12, max: 25 },
    typicalLiquidity: 'days',
    shariaAvailable: true,
  },

  local_stocks: {
    code: 'local_stocks',
    labelKey: 'assets.local_stocks.label',
    descKey: 'assets.local_stocks.desc',
    icon: 'TrendingUp',
    pillar: 'croissance',
    minEKH: 5,
    complexityLevel: 2,
    typicalReturn: { min: 5, max: 15 },
    typicalVolatility: { min: 15, max: 30 },
    typicalLiquidity: 'days',
    shariaAvailable: true,
  },

  mutual_fund: {
    code: 'mutual_fund',
    labelKey: 'assets.mutual_fund.label',
    descKey: 'assets.mutual_fund.desc',
    icon: 'Layers',
    pillar: 'croissance',
    minEKH: 3,
    complexityLevel: 1,
    typicalReturn: { min: 4, max: 10 },
    typicalVolatility: { min: 8, max: 18 },
    typicalLiquidity: 'days',
    shariaAvailable: true,
  },

  crypto: {
    code: 'crypto',
    labelKey: 'assets.crypto.label',
    descKey: 'assets.crypto.desc',
    icon: 'Bitcoin',
    pillar: 'croissance',
    minEKH: 8,
    complexityLevel: 3,
    typicalReturn: { min: 10, max: 50 },
    typicalVolatility: { min: 30, max: 80 },
    typicalLiquidity: 'immediate',
    shariaAvailable: false,
  },

  micro_enterprise: {
    code: 'micro_enterprise',
    labelKey: 'assets.micro_enterprise.label',
    descKey: 'assets.micro_enterprise.desc',
    icon: 'Store',
    pillar: 'croissance',
    minEKH: 5,
    complexityLevel: 2,
    typicalReturn: { min: 8, max: 25 },
    typicalVolatility: { min: 20, max: 40 },
    typicalLiquidity: 'locked',
    shariaAvailable: true,
  },

  private_equity: {
    code: 'private_equity',
    labelKey: 'assets.private_equity.label',
    descKey: 'assets.private_equity.desc',
    icon: 'Briefcase',
    pillar: 'croissance',
    minEKH: 10,
    complexityLevel: 3,
    typicalReturn: { min: 12, max: 25 },
    typicalVolatility: { min: 20, max: 35 },
    typicalLiquidity: 'locked',
    shariaAvailable: true,
  },

  venture_capital: {
    code: 'venture_capital',
    labelKey: 'assets.venture_capital.label',
    descKey: 'assets.venture_capital.desc',
    icon: 'Rocket',
    pillar: 'croissance',
    minEKH: 10,
    complexityLevel: 3,
    typicalReturn: { min: 15, max: 40 },
    typicalVolatility: { min: 30, max: 50 },
    typicalLiquidity: 'locked',
    shariaAvailable: true,
  },

  mining_assets: {
    code: 'mining_assets',
    labelKey: 'assets.mining_assets.label',
    descKey: 'assets.mining_assets.desc',
    icon: 'Mountain',
    pillar: 'croissance',
    minEKH: 8,
    complexityLevel: 3,
    typicalReturn: { min: 8, max: 20 },
    typicalVolatility: { min: 20, max: 35 },
    typicalLiquidity: 'days',
    shariaAvailable: true,
  },

  agrobusiness: {
    code: 'agrobusiness',
    labelKey: 'assets.agrobusiness.label',
    descKey: 'assets.agrobusiness.desc',
    icon: 'Sprout',
    pillar: 'croissance',
    minEKH: 5,
    complexityLevel: 2,
    typicalReturn: { min: 6, max: 15 },
    typicalVolatility: { min: 12, max: 25 },
    typicalLiquidity: 'weeks',
    shariaAvailable: true,
  },

  derivatives: {
    code: 'derivatives',
    labelKey: 'assets.derivatives.label',
    descKey: 'assets.derivatives.desc',
    icon: 'Shuffle',
    pillar: 'croissance',
    minEKH: 10,
    complexityLevel: 3,
    typicalReturn: { min: 5, max: 30 },
    typicalVolatility: { min: 25, max: 60 },
    typicalLiquidity: 'days',
    shariaAvailable: false,
  },

  tokenized_assets: {
    code: 'tokenized_assets',
    labelKey: 'assets.tokenized_assets.label',
    descKey: 'assets.tokenized_assets.desc',
    icon: 'QrCode',
    pillar: 'croissance',
    minEKH: 8,
    complexityLevel: 3,
    typicalReturn: { min: 8, max: 20 },
    typicalVolatility: { min: 20, max: 40 },
    typicalLiquidity: 'days',
    shariaAvailable: false,
  },

  // ═══════════════════════════════════════════
  // REFUGE — Protection, valeurs tangibles
  // ═══════════════════════════════════════════

  gold: {
    code: 'gold',
    labelKey: 'assets.gold.label',
    descKey: 'assets.gold.desc',
    icon: 'Gem',
    pillar: 'refuge',
    minEKH: 3,
    complexityLevel: 1,
    typicalReturn: { min: 3, max: 8 },
    typicalVolatility: { min: 10, max: 20 },
    typicalLiquidity: 'days',
    shariaAvailable: true,
  },

  real_estate_fund: {
    code: 'real_estate_fund',
    labelKey: 'assets.real_estate_fund.label',
    descKey: 'assets.real_estate_fund.desc',
    icon: 'Home',
    pillar: 'refuge',
    minEKH: 5,
    complexityLevel: 2,
    typicalReturn: { min: 4, max: 10 },
    typicalVolatility: { min: 8, max: 15 },
    typicalLiquidity: 'weeks',
    shariaAvailable: true,
  },

  infrastructure: {
    code: 'infrastructure',
    labelKey: 'assets.infrastructure.label',
    descKey: 'assets.infrastructure.desc',
    icon: 'Factory',
    pillar: 'refuge',
    minEKH: 5,
    complexityLevel: 2,
    typicalReturn: { min: 6, max: 12 },
    typicalVolatility: { min: 8, max: 15 },
    typicalLiquidity: 'months',
    shariaAvailable: true,
  },

  commodities: {
    code: 'commodities',
    labelKey: 'assets.commodities.label',
    descKey: 'assets.commodities.desc',
    icon: 'Package',
    pillar: 'refuge',
    minEKH: 5,
    complexityLevel: 2,
    typicalReturn: { min: 4, max: 12 },
    typicalVolatility: { min: 15, max: 25 },
    typicalLiquidity: 'days',
    shariaAvailable: true,
  },

  carbon_credits: {
    code: 'carbon_credits',
    labelKey: 'assets.carbon_credits.label',
    descKey: 'assets.carbon_credits.desc',
    icon: 'Wind',
    pillar: 'refuge',
    minEKH: 8,
    complexityLevel: 2,
    typicalReturn: { min: 5, max: 15 },
    typicalVolatility: { min: 15, max: 30 },
    typicalLiquidity: 'weeks',
    shariaAvailable: true,
  },
};
