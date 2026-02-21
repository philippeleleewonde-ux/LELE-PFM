/**
 * Engine-specific TypeScript interfaces and types
 * All monetary amounts are in CENTS (integer)
 * This ensures precision without floating-point errors
 */

// ============================================================================
// TRANSACTION TYPES - CRITICAL: Only 4 types allowed
// ============================================================================

export type TransactionType = 'Fixe' | 'Variable' | 'Imprévue' | 'Épargne-Dette';

export interface Transaction {
  id: string;
  type: TransactionType;
  montant: number; // cents
  devise: string; // EUR, USD, etc.
  date: Date;
  description: string;
  coicop_code: string; // 01-08 only
}

// ============================================================================
// REVENUE TYPES
// ============================================================================

export type RevenueType =
  | 'salaire_net'
  | 'salaire_prime'
  | 'freelance'
  | 'investissement'
  | 'autre';

export interface Revenue {
  id: string;
  type: RevenueType;
  montant_mensuel: number; // cents
  montant_annuel: number; // cents
  progression_pct: number; // 0-100, growth rate
  devise: string;
  date_debut: Date;
  date_fin?: Date;
  stable: boolean;
}

// ============================================================================
// EXPENSE TYPES
// ============================================================================

export type ExpenseType =
  | 'fixe'
  | 'variable'
  | 'imprévue'
  | 'épargne_dette';

export interface Expense {
  id: string;
  type: ExpenseType;
  montant_mensuel?: number; // cents
  montant_annuel?: number; // cents
  montant_reel?: number; // cents (for actual tracking)
  devise: string;
  description: string;
  coicop_code: string; // 01-08
  date_debut: Date;
  date_fin?: Date;
  flexibilite: number; // 0-100
  incompressibilite: number; // 0-100
}

// ============================================================================
// FINANCIAL HISTORY
// ============================================================================

export interface FinancialHistory {
  annee: number;
  revenus_annuels: number; // cents
  depenses_annuels: number; // cents
  epargne_nette: number; // cents
  variation_pct: number; // -100 to +300
}

// ============================================================================
// FINANCIAL COMMITMENTS & RISK
// ============================================================================

export interface FinancialCommitment {
  id: string;
  type: 'pret' | 'location' | 'assurance' | 'autre';
  montant_mensuel: number; // cents
  montant_total_restant: number; // cents
  taux_interet: number; // 0-100
  duree_mois: number;
  date_fin: Date;
}

export type RiskCategory =
  | 'emploi'
  | 'santé'
  | 'résidentiel'
  | 'familial'
  | 'endettement'
  | 'inflation';

export interface RiskAssessment {
  emploi: number; // 1-5 score
  santé: number; // 1-5 score
  résidentiel: number; // 1-5 score
  familial: number; // 1-5 score
  endettement: number; // 1-5 score
  inflation: number; // 1-5 score
}

// ============================================================================
// EKH SCORE (Épargne/Endettement/Kompetences/Horizon)
// ============================================================================

export interface EKHScore {
  score: number; // 0-10 (not 0-100)
  epargne: number; // 1-5
  endettement: number; // 1-5
  competences: number; // 1-5
  horizon: number; // months
}

// ============================================================================
// IMPROVEMENT LEVERS
// ============================================================================

export type LeverType =
  | 'urgence'
  | 'dette'
  | 'investissement'
  | 'plaisir';

export interface ImprovementLever {
  id: string;
  type: LeverType;
  priority: number; // 1-4
  target_amount: number; // cents
  current_amount: number; // cents
  pct_total: number; // percentage of total
}

// ============================================================================
// PROFILE & CONTEXT
// ============================================================================

export type ProfileType =
  | 'Salarié'
  | 'Freelance'
  | 'Entrepreneur'
  | 'Retraité';

export interface Profile {
  type: ProfileType;
  age: number;
  dependents: number;
  risk_tolerance: 'Conservative' | 'Modéré' | 'Agressif';
  locale: string; // en-US, fr-FR, etc.
}

// ============================================================================
// STEP 1: POTENTIALS CALCULATION
// ============================================================================

export interface PotentialsResult {
  total_revenue_potential: number; // cents
  fixed_potential: number; // cents
  variable_potential: number; // cents
  breakdown_by_type: {
    [key in RevenueType]?: number; // cents
  };
}

// ============================================================================
// STEP 2: EXPECTED LOSS
// ============================================================================

export interface ExpectedLossDetail {
  category: RiskCategory;
  probability: number; // 0-1
  impact: number; // 0-1
  revenue_affected: number; // cents
  expected_loss: number; // cents
}

export interface ExpectedLossResult {
  total_expected_loss: number; // cents
  details: ExpectedLossDetail[];
  default_impact_ranges: {
    [key in RiskCategory]?: [number, number]; // min-max impact
  };
}

// ============================================================================
// STEP 3: VOLATILITY CALCULATION
// ============================================================================

export interface VolatilityResult {
  sigma_revenus: number; // standard deviation
  sigma_depenses: number; // standard deviation
  sigma_total: number; // combined volatility
  sufficient_history: boolean;
  years_of_data: number;
  used_default: boolean;
}

// ============================================================================
// STEP 4: UNEXPECTED LOSS
// ============================================================================

export interface ContextualCoefficientBreakdown {
  ekh_factor: number; // 0.5-1.5
  horizon_factor: number; // 0.5-1.5
  profile_factor: number; // 0.5-1.5
  final_coefficient: number; // clamped [0.5, 1.5]
}

export interface UnexpectedLossResult {
  contextual_coefficient: number; // 0.5-1.5 clamped
  coefficient_breakdown: ContextualCoefficientBreakdown;
  unexpected_loss: number; // cents
  revenue_base: number; // cents
}

// ============================================================================
// STEP 5: HISTORICAL VAR
// ============================================================================

export interface HistoricalVaRResult {
  var_percentile: number; // 5th percentile
  worst_variation: number; // cents
  sufficient_history: boolean;
  used_default: boolean;
  sorted_variations: number[];
}

// ============================================================================
// STEP 6: VAR 95
// ============================================================================

export interface VaR95Result {
  var95: number; // cents
  calculation_method: 'formula' | 'historical';
  formula_components?: {
    ul_plus_el: number;
    sigma_sqrt: number;
    zscore: number; // 1.645
  };
}

// ============================================================================
// STEP 7: PRL (Reste-à-vivre)
// ============================================================================

export interface PRLResult {
  reste_a_vivre: number; // cents
  acceptance_threshold: number; // 0-1
  prl_limit: number; // cents
  var95_exceeds_prl: boolean;
  alert_level: 'green' | 'yellow' | 'red';
}

// ============================================================================
// STEP 8: POB & FORECAST
// ============================================================================

export interface POBForecastResult {
  pob: number; // 0-100 percentage
  el_36_months: number; // cents
  inflation_applied: number; // 0-1
  formula_revenue_base: number; // cents
}

// ============================================================================
// STEP 9: DISTRIBUTION BY LEVERS
// ============================================================================

export interface LeverAllocation {
  lever_id: string;
  lever_type: LeverType;
  allocated_amount: number; // cents
  priority: number; // 1-4
  percentage_of_total: number; // 0-100
}

export interface DistributionResult {
  reserve_amount: number; // cents (EL_36M + emergency buffer)
  distributions: LeverAllocation[];
  total_distributed: number; // cents
  remaining: number; // cents
}

// ============================================================================
// STEP 10: MONTHLY VENTILATION (36 MONTHS)
// ============================================================================

export interface COICOPAllocation {
  coicop_code: string; // 01-08
  montant: number; // cents
  flexibilite: number; // 0-100
  progression_mensuelle: number; // 5-11%
}

export interface MonthlyVentilation {
  month: number; // 1-36
  date: Date;
  progression_pct: number; // 5% (M1) to 11% (M36)
  allocations: COICOPAllocation[];
  total_month: number; // cents
}

export interface VentilationResult {
  monthly_ventilations: MonthlyVentilation[];
  total_36_months: number; // cents
  progression_formula: string; // documentation
}

// ============================================================================
// GLOBAL OUTPUT
// ============================================================================

export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'E';

export interface StepAudit {
  step: number; // 1-10
  step_name: string;
  duration_ms: number;
  inputs_summary: Record<string, unknown>;
  result_summary: Record<string, unknown>;
}

export interface EngineOutput {
  step1: PotentialsResult;
  step2: ExpectedLossResult;
  step3: VolatilityResult;
  step4: UnexpectedLossResult;
  step5: HistoricalVaRResult;
  step6: VaR95Result;
  step7: PRLResult;
  step8: POBForecastResult;
  step9: DistributionResult;
  step10: VentilationResult;
  globalScore: number; // 0-100
  grade: Grade;
  executionTimeMs: number;
  auditTrail: StepAudit[];
  timestamp: Date;
}

export interface EngineInput {
  revenues: Revenue[];
  expenses: Expense[];
  financialHistory: FinancialHistory[];
  commitments: FinancialCommitment[];
  riskAssessment: RiskAssessment;
  ekhScore: EKHScore;
  levers: ImprovementLever[];
  profile: Profile;
}

// ============================================================================
// FLEXIBILITY & EPR CALCULATION
// ============================================================================

export interface FlexibilityScores {
  f1: number; // 0-21
  f2: number; // 0-21
  f3: number; // 0-21
  total_score: number; // 0-100
}

export interface EPRTransaction {
  transaction_id: string;
  montant: number; // cents
  taux_incompressibilite: number; // 0-100
  score_flexibilite: number; // 0-100
  epr: number; // cents
}

// ============================================================================
// WATERFALL DISTRIBUTION
// ============================================================================

export interface WaterfallAllocation {
  p1_urgence: number; // cents
  p2_dette: number; // cents
  p3_investissement: number; // cents
  p4_plaisir: number; // cents
  p1_pct: number; // 0-100
  p2_pct: number; // 0-100
  p3_pct: number; // 0-100
  p4_pct: number; // 0-100
  total_pct: number; // should be 100
  valid: boolean;
}

// ============================================================================
// SCORE & GRADING
// ============================================================================

export interface WeeklyScoreInput {
  ekh_score: number; // 0-10
  completion_rate: number; // 0-1
  budget_respect: number; // 0-1
  variation_smoothness: number; // 0-1
}

export interface WeeklyScoreResult {
  raw_score: number; // 0-10
  grade: Grade;
  components: {
    ekh_contribution: number; // 0-4
    completion_contribution: number; // 0-3
    budget_contribution: number; // 0-2
    variation_contribution: number; // 0-1
  };
}
