/**
 * Historical Crisis Scenarios — LELE PFM
 *
 * Embedded data for stress-testing investment portfolios against
 * major historical crises. No external API required.
 */

import { AssetClass } from '@/types/investment';

export interface CrisisPhase {
  name: string;
  startMonth: number;
  endMonth: number;
  description: string;
}

export interface CrisisImpact {
  maxDrawdown: number;
  recoveryMonths: number;
  totalReturn: number;
}

export interface HistoricalCrisis {
  id: string;
  name: string;
  period: string;
  description: string;
  duration_months: number;
  phases: CrisisPhase[];
  assetImpacts: Record<AssetClass, CrisisImpact>;
}

// Human-readable labels for asset classes (French)
export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  savings_account: 'Livret epargne',
  term_deposit: 'Depot a terme',
  government_bonds: 'Obligations souveraines',
  corporate_bonds: 'Obligations entreprises',
  stock_index: 'Indices boursiers',
  local_stocks: 'Actions locales',
  real_estate_fund: 'Fonds immobilier',
  gold: 'Or',
  crypto: 'Cryptomonnaies',
  tontine: 'Tontine',
  micro_enterprise: 'Micro-entreprise',
  money_market: 'Marche monetaire',
  sukuk: 'Sukuk',
  mutual_fund: 'Fonds commun',
};

export const HISTORICAL_CRISES: HistoricalCrisis[] = [
  {
    id: '2008',
    name: 'Crise financiere mondiale',
    period: '2007-2009',
    description: 'Effondrement des subprimes, faillite de Lehman Brothers, crise bancaire mondiale.',
    duration_months: 18,
    phases: [
      { name: 'Chute', startMonth: 1, endMonth: 6, description: 'Effondrement des marches' },
      { name: 'Creux', startMonth: 7, endMonth: 12, description: 'Stabilisation au plus bas' },
      { name: 'Recuperation', startMonth: 13, endMonth: 18, description: 'Debut de reprise' },
    ],
    assetImpacts: {
      savings_account: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: 3 },
      term_deposit: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: 4 },
      government_bonds: { maxDrawdown: -2, recoveryMonths: 1, totalReturn: 12 },
      corporate_bonds: { maxDrawdown: -15, recoveryMonths: 18, totalReturn: -5 },
      stock_index: { maxDrawdown: -55, recoveryMonths: 48, totalReturn: -38 },
      local_stocks: { maxDrawdown: -60, recoveryMonths: 54, totalReturn: -42 },
      real_estate_fund: { maxDrawdown: -40, recoveryMonths: 60, totalReturn: -30 },
      gold: { maxDrawdown: -10, recoveryMonths: 3, totalReturn: 25 },
      crypto: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: 0 },
      tontine: { maxDrawdown: -5, recoveryMonths: 6, totalReturn: -2 },
      micro_enterprise: { maxDrawdown: -35, recoveryMonths: 36, totalReturn: -20 },
      money_market: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: 2 },
      sukuk: { maxDrawdown: -8, recoveryMonths: 12, totalReturn: -3 },
      mutual_fund: { maxDrawdown: -45, recoveryMonths: 42, totalReturn: -30 },
    },
  },
  {
    id: 'covid',
    name: 'COVID-19',
    period: '2020',
    description: 'Pandemie mondiale, confinements, choc economique brutal mais recuperation rapide.',
    duration_months: 6,
    phases: [
      { name: 'Chute', startMonth: 1, endMonth: 2, description: 'Panique et confinements' },
      { name: 'Creux', startMonth: 3, endMonth: 3, description: 'Point bas de mars 2020' },
      { name: 'Recuperation', startMonth: 4, endMonth: 6, description: 'Rebond en V' },
    ],
    assetImpacts: {
      savings_account: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: 1 },
      term_deposit: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: 1.5 },
      government_bonds: { maxDrawdown: -3, recoveryMonths: 1, totalReturn: 8 },
      corporate_bonds: { maxDrawdown: -12, recoveryMonths: 5, totalReturn: 2 },
      stock_index: { maxDrawdown: -34, recoveryMonths: 5, totalReturn: 15 },
      local_stocks: { maxDrawdown: -38, recoveryMonths: 8, totalReturn: 5 },
      real_estate_fund: { maxDrawdown: -25, recoveryMonths: 12, totalReturn: -10 },
      gold: { maxDrawdown: -5, recoveryMonths: 1, totalReturn: 18 },
      crypto: { maxDrawdown: -50, recoveryMonths: 8, totalReturn: 300 },
      tontine: { maxDrawdown: -3, recoveryMonths: 3, totalReturn: 0 },
      micro_enterprise: { maxDrawdown: -30, recoveryMonths: 18, totalReturn: -15 },
      money_market: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: 0.5 },
      sukuk: { maxDrawdown: -5, recoveryMonths: 4, totalReturn: 3 },
      mutual_fund: { maxDrawdown: -30, recoveryMonths: 6, totalReturn: 10 },
    },
  },
  {
    id: 'stagflation70s',
    name: 'Stagflation des annees 70',
    period: '1973-1975',
    description: "Choc petrolier, inflation galopante, recession prolongee. L'or et les actifs reels surperforment.",
    duration_months: 24,
    phases: [
      { name: 'Chute', startMonth: 1, endMonth: 8, description: 'Choc petrolier et recession' },
      { name: 'Creux', startMonth: 9, endMonth: 16, description: 'Stagflation persistante' },
      { name: 'Recuperation', startMonth: 17, endMonth: 24, description: 'Reprise lente' },
    ],
    assetImpacts: {
      savings_account: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: -5 },
      term_deposit: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: -3 },
      government_bonds: { maxDrawdown: -12, recoveryMonths: 24, totalReturn: -8 },
      corporate_bonds: { maxDrawdown: -18, recoveryMonths: 30, totalReturn: -12 },
      stock_index: { maxDrawdown: -45, recoveryMonths: 36, totalReturn: -30 },
      local_stocks: { maxDrawdown: -50, recoveryMonths: 42, totalReturn: -35 },
      real_estate_fund: { maxDrawdown: -5, recoveryMonths: 6, totalReturn: 5 },
      gold: { maxDrawdown: -8, recoveryMonths: 2, totalReturn: 150 },
      crypto: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: 0 },
      tontine: { maxDrawdown: -5, recoveryMonths: 12, totalReturn: -3 },
      micro_enterprise: { maxDrawdown: -25, recoveryMonths: 30, totalReturn: -15 },
      money_market: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: -4 },
      sukuk: { maxDrawdown: -6, recoveryMonths: 12, totalReturn: -2 },
      mutual_fund: { maxDrawdown: -35, recoveryMonths: 36, totalReturn: -22 },
    },
  },
  {
    id: 'dotcom',
    name: 'Bulle Internet',
    period: '2000-2003',
    description: 'Eclatement de la bulle technologique. Baisse longue et progressive des marches actions.',
    duration_months: 30,
    phases: [
      { name: 'Chute', startMonth: 1, endMonth: 12, description: "Debut de l'eclatement" },
      { name: 'Creux', startMonth: 13, endMonth: 24, description: 'Baisse continue' },
      { name: 'Recuperation', startMonth: 25, endMonth: 30, description: 'Stabilisation' },
    ],
    assetImpacts: {
      savings_account: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: 8 },
      term_deposit: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: 10 },
      government_bonds: { maxDrawdown: -1, recoveryMonths: 1, totalReturn: 15 },
      corporate_bonds: { maxDrawdown: -5, recoveryMonths: 12, totalReturn: 5 },
      stock_index: { maxDrawdown: -49, recoveryMonths: 60, totalReturn: -40 },
      local_stocks: { maxDrawdown: -55, recoveryMonths: 66, totalReturn: -45 },
      real_estate_fund: { maxDrawdown: -10, recoveryMonths: 12, totalReturn: 8 },
      gold: { maxDrawdown: -5, recoveryMonths: 3, totalReturn: 8 },
      crypto: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: 0 },
      tontine: { maxDrawdown: -3, recoveryMonths: 6, totalReturn: 2 },
      micro_enterprise: { maxDrawdown: -20, recoveryMonths: 24, totalReturn: -10 },
      money_market: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: 8 },
      sukuk: { maxDrawdown: -2, recoveryMonths: 6, totalReturn: 5 },
      mutual_fund: { maxDrawdown: -40, recoveryMonths: 54, totalReturn: -32 },
    },
  },
  {
    id: 'euro2011',
    name: 'Crise dette europeenne',
    period: '2011-2012',
    description: 'Crise des dettes souveraines en zone euro. Grece, Espagne, Italie sous pression.',
    duration_months: 12,
    phases: [
      { name: 'Chute', startMonth: 1, endMonth: 4, description: 'Panique sur les dettes souveraines' },
      { name: 'Creux', startMonth: 5, endMonth: 8, description: '"Whatever it takes"' },
      { name: 'Recuperation', startMonth: 9, endMonth: 12, description: 'Intervention BCE' },
    ],
    assetImpacts: {
      savings_account: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: 1 },
      term_deposit: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: 2 },
      government_bonds: { maxDrawdown: -5, recoveryMonths: 6, totalReturn: 5 },
      corporate_bonds: { maxDrawdown: -8, recoveryMonths: 9, totalReturn: -2 },
      stock_index: { maxDrawdown: -22, recoveryMonths: 12, totalReturn: -8 },
      local_stocks: { maxDrawdown: -28, recoveryMonths: 18, totalReturn: -15 },
      real_estate_fund: { maxDrawdown: -15, recoveryMonths: 12, totalReturn: -8 },
      gold: { maxDrawdown: -3, recoveryMonths: 1, totalReturn: 10 },
      crypto: { maxDrawdown: -20, recoveryMonths: 6, totalReturn: 5 },
      tontine: { maxDrawdown: -2, recoveryMonths: 3, totalReturn: 1 },
      micro_enterprise: { maxDrawdown: -15, recoveryMonths: 18, totalReturn: -8 },
      money_market: { maxDrawdown: 0, recoveryMonths: 0, totalReturn: 1 },
      sukuk: { maxDrawdown: -3, recoveryMonths: 4, totalReturn: 2 },
      mutual_fund: { maxDrawdown: -18, recoveryMonths: 12, totalReturn: -5 },
    },
  },
];
