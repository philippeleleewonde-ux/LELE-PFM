import {
  Profile,
  Revenue,
  Expense,
  FinancialHistory,
  FinancialCommitment,
  RiskAssessment,
  EKHScore,
  ImprovementLever,
  Grade,
} from './database';

// ===== STEP RESULT INTERFACES =====

export interface PotentialsResult {
  fixed_potential: number; // In FCFA
  variable_potential: number; // In FCFA
  total_potential: number; // In FCFA
  avg_revenue_growth_rate: number;   // Taux croissance moyen revenus (%)
  avg_expense_growth_rate: number;   // Taux croissance moyen dépenses (%)
  revenue_gaps: number[];            // Écarts revenus par année (5 valeurs)
  expense_gaps: number[];            // Écarts dépenses par année (5 valeurs)
}

export interface ExpectedLossResult {
  total_el: number; // In FCFA
  el_revenue: number;                // EL moyen revenus
  el_expense: number;                // EL moyen dépenses
  el_by_category: Record<string, number>; // In FCFA
  coherence_ratio: number;           // Ratio Dep/Rev moyen (%)
}

export interface VolatilityResult {
  revenue_volatility: number; // Percentage
  expense_volatility: number; // Percentage
  combined_volatility: number; // Percentage
}

export interface UnexpectedLossResult {
  base_ul: number; // In FCFA
  coefficient_contextuel: number; // 0.5-1.5
  adjusted_ul: number; // In FCFA
}

export interface HistoricalVaRResult {
  percentile_5: number; // In FCFA
  annual_variation: number; // Percentage
}

export interface VaR95Result {
  var95: number; // In FCFA
  formula_breakdown: {
    ul: number;
    el: number;
    volatility: number;
    z_score: number; // 1.645
  };
}

export interface PRLResult {
  prl: number; // In FCFA
  threshold_percent: number; // 5, 10, 15, or 30
  threshold_reason: string; // Based on risk and EKH profile
}

export interface POBForecastResult {
  pob: number; // Probability of Break-even in percentage
  el_36m: number; // Expected Loss 36 months in FCFA
  inflation_adjusted: number; // Adjusted for inflation
}

export interface DistributionResult {
  total_distributed: number; // In FCFA
  by_lever: Record<string, number>; // In FCFA
  reserve: number; // In FCFA
  // Plan triennal HCM-style
  epr_n1: number;                    // EPR An 1 = EPR × 30%
  epr_n2: number;                    // EPR An 2 = EPR × 60%
  epr_n3: number;                    // EPR An 3 = EPR × 100%
  epargne_n1: number;                // 67% du gain An 1
  epargne_n2: number;                // 67% du gain An 2
  epargne_n3: number;                // 67% du gain An 3
  discretionnaire_n1: number;        // 33% du gain An 1
  discretionnaire_n2: number;        // 33% du gain An 2
  discretionnaire_n3: number;        // 33% du gain An 3
  weekly_target_n1: number;          // EPR An 1 / 48 (objectif EPARGNE hebdo)
  weekly_target_n2: number;          // EPR An 2 / 48
  weekly_target_n3: number;          // EPR An 3 / 48
  monthly_target_n1: number;         // EPR An 1 / 12
  monthly_target_n2: number;
  monthly_target_n3: number;
  // Budget variable hebdomadaire (Reste a vivre / 4) — plafond de DEPENSE
  weekly_budget: number;             // Reste a vivre × 12 / 48
  monthly_budget: number;            // Reste a vivre mensuel (budget_period - commitments)
  // Investissement (defaut 0 = pas de split investissement)
  investissement_n1: number;         // Part investissement An 1
  investissement_n2: number;         // Part investissement An 2
  investissement_n3: number;         // Part investissement An 3
  weekly_invest_n1: number;          // Objectif hebdo investissement An 1
  weekly_invest_n2: number;
  weekly_invest_n3: number;
  monthly_invest_n1: number;         // Objectif mensuel investissement An 1
  monthly_invest_n2: number;
  monthly_invest_n3: number;
  investment_ratio: number;          // Ratio investi (0-100, defaut 0)
}

export interface CategoryVentilation {
  category_key: string;
  budget_rate: number;               // Poids budgétaire (%)
  annual_target_n1: number;          // Objectif An 1
  annual_target_n2: number;
  annual_target_n3: number;
  quarterly: {                       // Distribution trimestrielle An 1
    T1: number;                      // 20%
    T2: number;                      // 23%
    T3: number;                      // 27%
    T4: number;                      // 30%
  };
  quarterly_n2: {                    // Distribution trimestrielle An 2
    T1: number;
    T2: number;
    T3: number;
    T4: number;
  };
  quarterly_n3: {                    // Distribution trimestrielle An 3
    T1: number;
    T2: number;
    T3: number;
    T4: number;
  };
  elasticity: number;                // Potentiel compression
  nature: string;                    // Essentielle/Discrétionnaire
}

// Distribution EPR par indicateur comportemental (parallèle HCM PPR × indicateur)
export interface IndicatorDistribution {
  code: string;       // REG, PRE, SEC, EFF, LIT
  rate: number;       // Poids normalisé (%, somme = 100)
  rawWeight: number;  // Poids brut (0-100)
  epr_n1: number;     // EPR An 1 × rate
  epr_n2: number;     // EPR An 2 × rate
  epr_n3: number;     // EPR An 3 × rate
  quarterly_n1: { T1: number; T2: number; T3: number; T4: number };
  quarterly_n2: { T1: number; T2: number; T3: number; T4: number };
  quarterly_n3: { T1: number; T2: number; T3: number; T4: number };
  monthly_target_n1: number;
  monthly_target_n2: number;
  monthly_target_n3: number;
}

export interface VentilationResult {
  matrix_36months: number[][]; // 36 x 4 matrix (weeks x priorities)
  progression_5_to_11: boolean; // Validates 5% to 11% progression
  // Distribution par catégorie × indicateur (parallèle HCM PPR)
  by_category: Record<string, CategoryVentilation>;
  // Distribution EPR par indicateur comportemental (5 indicateurs PFM)
  by_indicator: IndicatorDistribution[];
}

export interface EngineInput {
  profile: Profile;
  revenues: Revenue[];
  expenses: Expense[];
  history: FinancialHistory[];
  commitments: FinancialCommitment[];
  riskAssessment: RiskAssessment;
  ekhScore: EKHScore;
  levers: ImprovementLever[];
  // Scores bruts du wizard (6 domaines : emploi, logement, sante, endettement, epargne, juridique)
  // Nécessaires pour le calcul des 5 indicateurs PFM (parallèle HCM)
  rawRiskScores: Record<string, number>;
  // Investment ratio (0-100, default 0) — set by investor profile
  investmentRatio?: number;
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
  calculatedAt: string; // ISO 8601
  executionTimeMs: number;
}

export interface StepPerformance {
  stepNumber: number;
  duration_ms: number;
  success: boolean;
  error?: string;
}

export interface EngineMetrics {
  steps: StepPerformance[];
  total_duration_ms: number;
  cache_hits: number;
}
