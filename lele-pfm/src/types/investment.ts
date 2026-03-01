/**
 * Investment Module Types — LELE PFM
 *
 * Types for investor profile, asset classes, products, allocations, and projections.
 */

// ─── Investor Profile ───

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
export type InvestmentHorizon = 'short' | 'medium' | 'long'; // <2y, 2-5y, 5y+
export type ShariaCompliance = 'required' | 'preferred' | 'not_required';
export type BouclierLiquidite = 'full' | 'partial' | 'none';
export type StressReaction = 'sell_all' | 'sell_some' | 'hold' | 'buy_more';
export type InvestmentPillar = 'croissance' | 'amortisseur' | 'refuge' | 'base_arriere';

export interface InvestorProfile {
  riskTolerance: RiskTolerance;
  horizon: InvestmentHorizon;
  shariaCompliance: ShariaCompliance;
  monthlyInvestTarget: number;
  investmentRatio: number; // % of savings allocated to investment (0-100)
  preferredAssets: AssetClass[];
  taxAdvantageAccount?: string; // PEA, 401k, ISA, etc.
  bouclierLiquidite?: BouclierLiquidite;
  stressReaction?: StressReaction;
  capitalInitial?: number;
}

// ─── GPS Strategique Types ───

export interface PillarAllocation {
  pillar: InvestmentPillar;
  targetPercent: number;
  currentPercent: number;
  products: AllocationRecommendation[];
  drift: number; // absolute difference target vs current
}

export interface PillarConfig {
  code: InvestmentPillar;
  labelKey: string;
  descKey: string;
  color: string;
  icon: string;
  defaultWeight: number;
}

export interface MissionTemplate {
  id: string;
  month: number; // 1-12
  titleKey: string;
  descKey: string;
  pillar: InvestmentPillar;
  difficulty: 1 | 2 | 3;
  actionType: 'open_account' | 'setup_transfer' | 'first_invest' | 'rebalance' | 'review' | 'diversify';
}

export interface MissionRecord {
  templateId: string;
  month: number;
  year: number;
  status: 'pending' | 'completed' | 'skipped';
  completedAt?: string;
}

export interface TippingPoint {
  monthsToReach: number;
  valueAtTipping: number;
  monthlyPassiveIncome: number;
}

// ─── Asset Classes ───

export type AssetClass =
  | 'savings_account'
  | 'term_deposit'
  | 'government_bonds'
  | 'corporate_bonds'
  | 'stock_index'
  | 'local_stocks'
  | 'real_estate_fund'
  | 'gold'
  | 'crypto'
  | 'tontine'
  | 'micro_enterprise'
  | 'money_market'
  | 'sukuk'
  | 'mutual_fund'
  | 'municipal_bonds'
  | 'private_equity'
  | 'venture_capital'
  | 'venture_debt'
  | 'mezzanine'
  | 'infrastructure'
  | 'mining_assets'
  | 'agrobusiness'
  | 'commodities'
  | 'derivatives'
  | 'esg_bonds'
  | 'carbon_credits'
  | 'tokenized_assets';

// ─── Investment Product ───

export interface InvestmentProduct {
  code: string;
  asset: AssetClass;
  name: string;
  returnRate: number; // Annual average return (%)
  volatility: number; // Annual volatility (%)
  minAmount: number;
  currency: string;
  liquidity: 'immediate' | 'days' | 'weeks' | 'months' | 'locked';
  shariaCompliant: boolean;
  taxAdvantaged: boolean;
  taxAdvantageName?: string;
  riskLevel: 1 | 2 | 3 | 4 | 5; // 1=very low, 5=very high
  availableIn: string[]; // ISO country codes
  description: string;
}

// ─── Allocation Recommendation ───

export interface AllocationRecommendation {
  product: InvestmentProduct;
  weight: number; // % of allocation (sum = 100)
  monthlyAmount: number;
  projectedReturn12m: number;
  projectedReturn36m: number;
}

// ─── Investment Projection ───

export interface InvestmentProjection {
  month: number; // 1-36
  invested: number; // Cumulative invested capital
  returns: number; // Cumulative returns
  total: number; // invested + returns
  inflationAdjusted: number; // Total adjusted for inflation
}

// ─── Weekly Investment Record ───

export interface WeeklyInvestmentRecord {
  week_number: number;
  year: number;
  amount: number;
  source: 'auto' | 'manual';
}
