// Pillar mapping: asset classes → pillars, pillar configs, risk allocation weights

import { AssetClass, InvestmentPillar, PillarConfig, RiskTolerance } from '@/types/investment';

export const ASSET_TO_PILLAR: Record<AssetClass, InvestmentPillar> = {
  stock_index: 'croissance',
  local_stocks: 'croissance',
  crypto: 'croissance',
  micro_enterprise: 'croissance',
  mutual_fund: 'croissance',
  government_bonds: 'amortisseur',
  corporate_bonds: 'amortisseur',
  sukuk: 'amortisseur',
  gold: 'refuge',
  real_estate_fund: 'refuge',
  savings_account: 'base_arriere',
  term_deposit: 'base_arriere',
  money_market: 'base_arriere',
  tontine: 'base_arriere',
};

export const PILLAR_CONFIG: Record<InvestmentPillar, PillarConfig> = {
  croissance: {
    code: 'croissance',
    labelKey: 'gps.pillars.croissance',
    descKey: 'gps.pillars.croissanceDesc',
    color: '#4ADE80',
    icon: 'Rocket',
    defaultWeight: 25,
  },
  amortisseur: {
    code: 'amortisseur',
    labelKey: 'gps.pillars.amortisseur',
    descKey: 'gps.pillars.amortisseurDesc',
    color: '#60A5FA',
    icon: 'Shield',
    defaultWeight: 20,
  },
  refuge: {
    code: 'refuge',
    labelKey: 'gps.pillars.refuge',
    descKey: 'gps.pillars.refugeDesc',
    color: '#FBBF24',
    icon: 'Landmark',
    defaultWeight: 15,
  },
  base_arriere: {
    code: 'base_arriere',
    labelKey: 'gps.pillars.baseArriere',
    descKey: 'gps.pillars.baseArriereDesc',
    color: '#A78BFA',
    icon: 'Vault',
    defaultWeight: 40,
  },
};

export const RISK_ALLOCATION_WEIGHTS: Record<RiskTolerance, Record<InvestmentPillar, number>> = {
  conservative: {
    croissance: 15,
    amortisseur: 20,
    refuge: 25,
    base_arriere: 40,
  },
  moderate: {
    croissance: 25,
    amortisseur: 20,
    refuge: 15,
    base_arriere: 40,
  },
  aggressive: {
    croissance: 40,
    amortisseur: 15,
    refuge: 10,
    base_arriere: 35,
  },
};
