/**
 * Investor Journey Types — LELE PFM
 *
 * Types for the complete 5-phase investor journey:
 * Phase 1: Recommendation → Phase 2: Selection → Phase 3: Scenarios
 * → Phase 4: Duration → Phase 5: Accompaniment (Dashboard)
 */

import { AssetClass, InvestmentPillar, InvestmentProduct } from './investment';

// ─── Journey Phases ───

export type JourneyPhase =
  | 'recommendation'
  | 'selection'
  | 'scenarios'
  | 'duration'
  | 'accompaniment';

// ─── Selected Asset ───

export type AssetSelectionStatus = 'recommended' | 'accepted' | 'rejected' | 'custom';

export interface SelectedAsset {
  id: string;
  assetClass: AssetClass;
  name: string;
  status: AssetSelectionStatus;
  expectedReturnRate: number;
  volatility: number;
  riskLevel: 1 | 2 | 3 | 4 | 5;
  allocationPercent: number;
  pillar: InvestmentPillar;
  isCustom: boolean;
  shariaCompliant: boolean;
  liquidity: 'immediate' | 'days' | 'weeks' | 'months' | 'locked';
  product?: InvestmentProduct;
  recommendationScore?: number;
}

// ─── Investment Strategy ───

export type StrategyId = 'ultra_safe' | 'safe' | 'balanced' | 'growth' | 'aggressive';

export interface StrategyProjection {
  month: number;
  invested: number;
  value: number;
  returns: number;
}

export interface PillarWeight {
  pillar: InvestmentPillar;
  weight: number;
}

export interface InvestmentStrategy {
  id: StrategyId;
  labelKey: string;
  pillarWeights: PillarWeight[];
  projections: StrategyProjection[];
  finalValue: number;
  totalReturns: number;
  cagr: number;
  weightedReturnRate: number;
  weightedVolatility: number;
}

// ─── Investment Duration ───

export interface InvestmentDuration {
  months: number;
  startDate: string; // ISO string
  endDate: string;   // ISO string
}

// ─── Check-In Records ───

export interface AssetSnapshot {
  assetId: string;
  assetClass: AssetClass;
  name: string;
  currentValue: number;
  amountInvested: number;
  performance: number; // % gain/loss
}

export type CheckInStatus = 'completed' | 'skipped' | 'missed';

export interface CheckInRecord {
  id: string;
  date: string; // ISO string
  status: CheckInStatus;
  assetSnapshots: AssetSnapshot[];
  totalPortfolioValue: number;
  totalInvested: number;
  overallPerformance: number;
  notes?: string;
}

// ─── Advisory Messages ───

export type AdvisoryType =
  | 'rebalance'
  | 'performance_alert'
  | 'milestone'
  | 'savings_opportunity'
  | 'risk_warning'
  | 'procedure_nudge';

export type AdvisorySeverity = 'info' | 'warning' | 'success' | 'urgent';

export interface AdvisoryMessage {
  id: string;
  type: AdvisoryType;
  severity: AdvisorySeverity;
  titleKey: string;
  messageKey: string;
  messageParams?: Record<string, string | number>;
  createdAt: string;
  dismissed: boolean;
  relatedAssetId?: string;
}

// ─── Investment Procedures (Knowledge Base) ───

export interface ProcedureStep {
  order: number;
  titleKey: string;
  descriptionKey: string;
  institution: string;
  documents: string[];
  estimatedCostXOF?: number;
  estimatedCostEUR?: number;
  estimatedCostUSD?: number;
  estimatedDays: number;
  tips: string[];
  completed?: boolean;
}

export interface InvestmentProcedure {
  countryCode: string;
  assetClass: AssetClass;
  steps: ProcedureStep[];
  lastUpdated?: string;
  sourceNotes?: string;
}

// ─── Rendez-vous Configuration ───

export type RendezVousFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

export interface RendezVousConfig {
  frequency: RendezVousFrequency;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday
  reminderHoursBefore: number;
  enabled: boolean;
}

// ─── Procedure Progress ───

export interface ProcedureProgress {
  assetId: string;
  assetClass: AssetClass;
  countryCode: string;
  completedSteps: number[];
  startedAt: string;
  lastUpdatedAt: string;
}

// ─── Recommendation Score Breakdown ───

export interface RecommendationScoreBreakdown {
  riskAlignment: number;       // /25
  returnAttractiveness: number; // /20
  liquidityMatch: number;      // /15
  shariaCompliance: number;    // /10
  ekhGate: number;             // /10
  diversification: number;     // /10
  countryInfra: number;        // /5
  taxAdvantage: number;        // /5
  total: number;               // /100
}

// ─── Asset Category (v2 expanded) ───

export interface AssetCategoryMeta {
  code: AssetClass;
  labelKey: string;
  descKey: string;
  icon: string;
  pillar: InvestmentPillar;
  minEKH: number;              // Minimum EKH score required
  complexityLevel: 1 | 2 | 3; // 1=simple, 3=complex
  typicalReturn: { min: number; max: number };
  typicalVolatility: { min: number; max: number };
  typicalLiquidity: 'immediate' | 'days' | 'weeks' | 'months' | 'locked';
  shariaAvailable: boolean;
}

// ─── Journey Store State ───

export interface JourneyState {
  currentPhase: JourneyPhase;
  recommendedAssets: SelectedAsset[];
  selectedAssets: SelectedAsset[];
  activeStrategies: InvestmentStrategy[];
  chosenStrategyId: StrategyId | null;
  investmentDuration: InvestmentDuration | null;
  rendezVousConfig: RendezVousConfig;
  checkIns: CheckInRecord[];
  advisoryMessages: AdvisoryMessage[];
  procedureProgress: Record<string, ProcedureProgress>;
  journeyStartedAt: string | null;
  lastCheckInAt: string | null;
}
