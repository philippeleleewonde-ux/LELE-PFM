// ===== USER (Auth) =====
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  currency: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

// ===== ENUMS (types + runtime objects) =====
export type TransactionType = 'Fixe' | 'Variable' | 'Imprévue' | 'Épargne-Dette';
export const TransactionType = {
  FIXE: 'Fixe' as const,
  VARIABLE: 'Variable' as const,
  'IMPRÉVUE': 'Imprévue' as const,
  'ÉPARGNE_DETTE': 'Épargne-Dette' as const,
};

export type Nature = 'Essentielle' | 'Discrétionnaire';
export const Nature = {
  ESSENTIELLE: 'Essentielle' as const,
  'DISCRÉTIONNAIRE': 'Discrétionnaire' as const,
};

export type PaymentMethod = 'CarteBancaire' | 'Espèces' | 'Virement' | 'Prélèvement';
export type ProfileType =
  | 'Salarié'
  | 'Indépendant'
  | 'Fonctionnaire'
  | 'Étudiant'
  | 'Retraité'
  | 'Entrepreneur'
  | 'Intérimaire'
  | 'Auto-entrepreneur'
  | 'Sans emploi'
  | 'Cadre'
  | 'Profession libérale'
  | 'Agriculteur';
export type RiskProfile = 'Conservative' | 'Modéré' | 'Agressif';

export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'E';
export const Grade = {
  A_PLUS: 'A+' as const,
  A: 'A' as const,
  B: 'B' as const,
  C: 'C' as const,
  D: 'D' as const,
  E: 'E' as const,
};

export type COICOPCode = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08';
export const COICOPCategory = {
  FOOD: '01' as const,
  CLOTHING: '02' as const,
  HOUSING: '03' as const,
  HEALTH: '04' as const,
  TRANSPORT: '05' as const,
  COMMUNICATIONS: '06' as const,
  RECREATION: '07' as const,
  EDUCATION: '08' as const,
};

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOCK' | 'UNLOCK';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';
export type LeverType =
  | 'reduction_depenses'
  | 'optimisation_assurances'
  | 'augmentation_revenus'
  | 'remboursement_dette'
  | 'boost_epargne'
  | 'optimisation_fiscale';

// ===== TABLE 1: Profile =====
export interface Profile {
  id: string; // UUID
  user_id: string; // UUID (auth.users.id)
  profile_type: ProfileType;
  situation: string; // Description of situation
  budget_period: number; // Monthly budget in FCFA
  weekly_target_epr: number; // Weekly EPR target in FCFA
  incompressibility_rate: number; // Percentage 0-100
  flexibility_score: number; // Percentage 0-100
  dependents: number; // Count
  experience_years: number; // Years
  age: number; // Years
  risk_profile: RiskProfile;
  country_code: string; // ISO 3166-1 alpha-2 (ex: 'CI', 'FR')
  urban_rural: 'urban' | 'rural'; // Contexte géographique
  income_source: 'formal' | 'mixed' | 'informal' | 'seasonal'; // Source principale de revenus
  extended_family_obligations: boolean; // Obligations familiales élargies (tontines, famille élargie)
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ===== TABLE 2: Revenue =====
export interface Revenue {
  id: string; // UUID
  profile_id: string; // UUID
  type: TransactionType;
  label: string;
  amount: number; // In CENTS
  frequency: 'monthly' | 'annual' | 'irregular';
  probability: number; // Percentage 0-100
  start_date: string; // ISO 8601
  end_date: string | null; // ISO 8601 or null
  growth_rate: number; // Percentage, can be negative
  notes: string | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ===== TABLE 3: Expense =====
export interface Expense {
  id: string; // UUID
  profile_id: string; // UUID
  type: TransactionType;
  nature: Nature;
  label: string;
  amount: number; // In CENTS
  frequency: 'weekly' | 'monthly' | 'annual' | 'irregular';
  probability: number; // Percentage 0-100
  payment_method: PaymentMethod;
  coicop_code: COICOPCode;
  start_date: string; // ISO 8601
  end_date: string | null; // ISO 8601 or null
  elasticity: number; // Percentage, can be negative (compression potential)
  notes: string | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ===== TABLE 4: FinancialHistory =====
export interface FinancialHistory {
  id: string; // UUID
  profile_id: string; // UUID
  period: string; // ISO 8601 (YYYY-MM or YYYY-W##)
  actual_revenue: number; // In CENTS
  actual_expenses: number; // In CENTS
  epr_actual: number; // In CENTS
  epr_planned: number; // In CENTS
  savings_rate: number; // Percentage
  inflation_index: number; // Base 100
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ===== TABLE 5: FinancialCommitment =====
export interface FinancialCommitment {
  id: string; // UUID
  profile_id: string; // UUID
  commitment_type: 'loan' | 'insurance' | 'subscription' | 'lease' | 'lease_auto' | 'other';
  label: string;
  monthly_payment: number; // In CENTS
  remaining_amount: number; // In CENTS
  interest_rate: number; // Percentage, annual
  start_date: string; // ISO 8601
  end_date: string; // ISO 8601
  is_locked: boolean;
  impact_epr: number; // In CENTS (reduction)
  notes: string | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ===== TABLE 6: RiskAssessment =====
export interface RiskAssessment {
  id: string; // UUID
  profile_id: string; // UUID
  employment_stability: number; // Percentage 0-100
  income_predictability: number; // Percentage 0-100
  expense_predictability: number; // Percentage 0-100
  emergency_fund_months: number; // Months of expenses
  debt_to_income_ratio: number; // Percentage
  liquidity_score: number; // Percentage 0-100
  health_insurance: boolean;
  unemployment_insurance: boolean;
  liability_insurance: boolean;
  property_insurance: boolean;
  life_insurance: boolean;
  auto_insurance: boolean;
  risk_notes: string | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ===== TABLE 7: EKHScore =====
export interface EKHScore {
  id: string; // UUID
  profile_id: string; // UUID
  e_score: number; // 0-5 (Employment/Economique)
  k_score: number; // 0-5 (Kompetence/Capabilities)
  h_score: number; // 0-5 (Home/Household)
  combined_score: number; // 0-15 (E+K+H)
  interpretation: string; // Text summary
  assessment_date: string; // ISO 8601
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ===== TABLE 8: ImprovementLever =====
export interface ImprovementLever {
  id: string; // UUID
  profile_id: string; // UUID
  lever_type: LeverType;
  label: string;
  description: string;
  estimated_impact: number; // In CENTS (monthly)
  priority: number; // 1-10
  implementation_timeline: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  is_active: boolean;
  actual_impact: number | null; // In CENTS, after implementation
  implementation_date: string | null; // ISO 8601
  notes: string | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ===== TABLE 9: PFEResult =====
export interface PFEResult {
  id: string; // UUID
  profile_id: string; // UUID
  calculation_version: string; // e.g., "1.0.0"
  step1_potentials: number; // In CENTS
  step2_el: number; // Expected Loss in CENTS
  step3_volatility: number; // Volatility percentage
  step4_ul: number; // Unexpected Loss in CENTS
  step5_historical_var: number; // In CENTS
  step6_var95: number; // VaR 95% in CENTS
  step7_prl: number; // Protective Reserve Level in CENTS
  step8_pob: number; // Probability of Break-even percentage
  step8_el_36m: number; // Expected Loss 36 months in CENTS
  step9_distribution: Record<string, number>; // Lever distribution in CENTS
  step10_ventilation: Record<string, number[]>; // 36-month matrix
  global_score: number; // 0-100
  grade: Grade;
  calculated_at: string; // ISO 8601
  execution_time_ms: number;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ===== TABLE 10: CategoryConfig =====
export interface CategoryConfig {
  id: string; // UUID
  profile_id: string; // UUID
  coicop_code: COICOPCode;
  monthly_budget: number; // In CENTS
  is_essential: boolean;
  priority: number; // 1-10
  elasticity: number; // Percentage (compression potential)
  notes: string | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ===== TABLE 11: Transaction =====
export interface Transaction {
  id: string; // UUID
  profile_id: string; // UUID
  type: TransactionType;
  category: COICOPCode;
  label: string;
  amount: number; // In CENTS
  payment_method: PaymentMethod;
  transaction_date: string; // ISO 8601
  week_number: number; // 1-52
  year: number;
  is_reconciled: boolean;
  notes: string | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ===== TABLE 12: WeeklyPerformance =====
export interface WeeklyPerformance {
  id: string; // UUID
  profile_id: string; // UUID
  week_number: number; // 1-52
  year: number;
  epr_actual: number; // In CENTS
  epr_target: number; // In CENTS
  ekh_percent: number; // Percentage 0-100
  completion_percent: number; // Percentage 0-100
  budget_respect_percent: number; // Percentage 0-100
  epr_variation_percent: number; // Percentage
  weekly_score: number; // 0-10
  weekly_grade: Grade;
  notes: string | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ===== TABLE 13: DistributionConfig =====
export interface DistributionConfig {
  id: string; // UUID
  profile_id: string; // UUID
  config_name: string;
  p1_percent: number; // Percentage
  p2_percent: number; // Percentage
  p3_percent: number; // Percentage
  p4_percent: number; // Percentage
  is_active: boolean;
  notes: string | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ===== TABLE 14: AuditLog =====
export interface AuditLog {
  id: string; // UUID
  profile_id: string; // UUID
  table_name: string;
  record_id: string; // UUID of affected record
  action: AuditAction;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown>;
  user_id: string; // UUID
  timestamp: string; // ISO 8601
  ip_address: string | null;
  created_at: string; // ISO 8601
}

// ===== TABLE 15: SyncQueue =====
export interface SyncQueue {
  id: string; // UUID
  profile_id: string; // UUID
  table_name: string;
  record_id: string; // UUID
  action: AuditAction;
  status: SyncStatus;
  payload: Record<string, unknown>;
  error_message: string | null;
  retry_count: number;
  last_attempt: string | null; // ISO 8601
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ===== TABLE 16: NotificationPreference =====
export interface NotificationPreference {
  id: string; // UUID
  profile_id: string; // UUID
  budget_alert: boolean;
  budget_alert_threshold: number; // Percentage (e.g., 90 for 90%)
  weekly_summary: boolean;
  weekly_summary_day: number; // 0-6 (Sunday-Saturday)
  monthly_report: boolean;
  monthly_report_date: number; // 1-31
  expense_over_limit: boolean;
  expense_over_limit_threshold: number; // In CENTS
  sync_notifications: boolean;
  email: string | null;
  phone: string | null;
  push_enabled: boolean;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

