/**
 * Investment Module Types — LELE PFM
 *
 * Types for investor profile, asset classes, products, allocations, and projections.
 */

// ─── Investor Profile ───

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
export type InvestmentHorizon = 'short' | 'medium' | 'long'; // <2y, 2-5y, 5y+
export type ShariaCompliance = 'required' | 'preferred' | 'not_required';

export interface InvestorProfile {
  riskTolerance: RiskTolerance;
  horizon: InvestmentHorizon;
  shariaCompliance: ShariaCompliance;
  monthlyInvestTarget: number;
  investmentRatio: number; // % of savings allocated to investment (0-100)
  preferredAssets: AssetClass[];
  taxAdvantageAccount?: string; // PEA, 401k, ISA, etc.
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
  | 'mutual_fund';

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
