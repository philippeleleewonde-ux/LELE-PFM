// Types for CFO's SAF FinTech Platform - Modern Rebuild
// All types match exactly the original application structure

export type Currency =
  | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF'
  | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK' | 'HUF'
  | 'MXN' | 'BRL' | 'ARS' | 'CLP' | 'COP'
  | 'CNY' | 'INR' | 'KRW' | 'HKD' | 'SGD' | 'THB' | 'MYR' | 'IDR' | 'PHP' | 'VND'
  | 'ZAR' | 'NGN' | 'GHS' | 'KES' | 'MAD' | 'TND' | 'EGP' | 'DZD' | 'XOF' | 'XAF'
  | 'AED' | 'SAR' | 'TRY';

export interface CompanyInfo {
  email: string;
  companyName: string;
  activity: string;
  businessSector: string;
}

export interface BusinessLine {
  id: number;
  activityName: string;
  staffCount: number;
  teamCount: number;
  budget: number; // in thousands
  budgetRate?: number; // calculated field
}

// Financial history item (matches modern UI and source app)
export interface FinancialData {
  year: string;
  sales: number;    // in thousands
  spending: number; // in thousands
}

export interface EmployeeEngagementData {
  annualHoursPerPerson: number;
  financialHistory: FinancialData[];
}

export interface RiskData {
  totalUL: number;
  yearsOfCollection: number;
  riskCategories: {
    operationalRisk: number;
    creditRisk: number;
    marketRisk: number;
    liquidityRisk: number;
    reputationalRisk: number;
    strategicRisk: number;
  };
}

export interface QualitativeAssessment {
  operationalRiskIncidents: string | number;
  creditRiskAssessment: string | number;
  marketVolatility: string | number;
  liquidityPosition: string | number;
  reputationalFactors: string;
  strategicAlignment: string;
}

export interface SocioeconomicImprovement {
  keyArea1_workingConditions: string;
  keyArea2_workOrganization: string;
  keyArea3_communication: string;
  keyArea4_timeManagement: string;
  keyArea5_training: string;
  keyArea6_strategy: string;
}

// Calculated fields that match the original application exactly
export interface CalculatedFields {
  // Evolution rates
  tauxL1Budget: number;
  tauxL2Budget: number;
  tauxL3Budget: number;
  tauxL4Budget: number;
  tauxL5Budget: number;

  // Average rates
  tauxMoyenL1: number;
  tauxMoyenL2: number;
  tauxMoyenL3: number;
  tauxMoyenL4: number;
  tauxMoyenL5: number;

  // Potential values
  valeurPotentielleL1: number;
  valeurPotentielleL2: number;
  valeurPotentielleL3: number;
  valeurPotentielleL4: number;
  valeurPotentielleL5: number;

  // Risk metrics
  totalEL: number;
  totalELHistorique: number;
  var: number;
  var95: number;
  var99: number;
  ulCalcul: number;
  totalSeuilHistorique: number;
  historicRiskAppetite: number;

  // Employee engagement
  totalHours: number;
  averageHoursPerPerson: number;
  engagementScore: number;

  // Financial metrics
  prl: number;
  prlAmount: number;
  totalBudget: number;
  totalPotential: number;

  // Projections
  weeklyBonusN1: number;
  weeklyBonusN2: number;
  weeklyBonusN3: number;
  quarterlyBonusN1: number;
  quarterlyBonusN2: number;
  quarterlyBonusN3: number;
  monthlyBonusN1: number;
  monthlyBonusN2: number;
  monthlyBonusN3: number;
  gainsN1: number;
  gainsN2: number;
  gainsN3: number;
  forecastEL: number;

  // Statistical measures
  stdDevSales: number;
  stdDevSpending: number;
  variance: number;
  standardDeviation: number;

  // EL fields for risks
  ELrisqueop: number;
  ELnoncompliance: number;
  ELcyberattack: number;
  ELmacroeconomic: number;
  ELactivity: number;

  // Financial projections
  gainsPrevus: number;
  gainsResteRecupererN1: number;
  gainsResteRecupererN2: number;
  gainsResteRecupererN3: number;
  cashFlowN1: number;
  cashFlowN2: number;
  cashFlowN3: number;
  primesN1: number;
  primesN2: number;
  primesN3: number;
  prime_n1: number;
  prime_n2: number;
  prime_n3: number;

  // 🆕 Performance Indicators for Page 14 (ACTIONS PRIORITAIRES N+1)
  // Poids des 5 indicateurs de performance (0-4 scale)
  indicator_absenteeism_weight: number;        // Absentéisme (Domaine 4: Gestion du temps)
  indicator_productivity_weight: number;       // Ecarts productivité (Domaine 6: Stratégie)
  indicator_quality_weight: number;            // Défauts qualité (Domaine 2: Organisation travail)
  indicator_accidents_weight: number;          // Accidents travail (Domaine 1: Conditions travail)
  indicator_knowhow_weight: number;            // Ecarts know-how (Domaines 3+5: Formation/3C)

  // Taux relatifs des indicateurs (%)
  indicator_absenteeism_rate: number;          // Pourcentage relatif Absentéisme
  indicator_productivity_rate: number;         // Pourcentage relatif Productivité
  indicator_quality_rate: number;              // Pourcentage relatif Qualité
  indicator_accidents_rate: number;            // Pourcentage relatif Accidents
  indicator_knowhow_rate: number;              // Pourcentage relatif Know-how

  // 🆕 Added for Global Reporting Page Refactoring
  // Savings Distribution
  totalEconomies?: number;
  ee?: number;
  iple?: number;

  // Basel II Risk Categories
  basel_internal_fraud?: number;
  basel_external_fraud?: number;
  basel_employment?: number;
  basel_clients?: number;
  basel_damage?: number;
  basel_disruption?: number;
  basel_execution?: number;

  // Historic Data
  prl_n_minus_2?: number;
  ul_n_minus_2?: number;
  prl_n_minus_1?: number;
  ul_n_minus_1?: number;
  totalUL?: number; // Ensure this exists or use totalEL if intended
  tolerance_threshold?: number;
  total_overcosts?: number;

  // SCR Impact
  scr_factor?: number;
  capital_cost_rate?: number;

  // UL Breakdown
  ul_absenteeism?: number;
  ul_accidents?: number;
  ul_turnover?: number;
  ul_quality?: number;
  ul_productivity?: number;
  ul_knowhow?: number;

  // 🆕 PPR par personne par indicateur par business line (Page 14, 15, 16)
  // Ces données sont utilisées par le Module 3 pour calculer PPR PREVUES
  priorityActionsN1?: PriorityActionEntry[];
  priorityActionsN2?: PriorityActionEntry[];
  priorityActionsN3?: PriorityActionEntry[];
}

/**
 * Structure PPR par trimestre pour sélection dynamique
 * Permet d'avoir des valeurs DIFFÉRENTES pour T1, T2, T3, T4
 */
export interface QuarterlyPPRData {
  T1: number;  // PPR par personne Trimestre 1
  T2: number;  // PPR par personne Trimestre 2
  T3: number;  // PPR par personne Trimestre 3
  T4: number;  // PPR par personne Trimestre 4
}

/**
 * Distribution PPR par indicateur avec données trimestrielles
 */
export interface PriorityActionDistribution {
  indicator: string;  // 'absenteeism' | 'productivity' | 'quality' | 'accidents' | 'knowhow'
  perLine: number;    // PPR total pour la ligne (ANNUEL)
  perPerson: number;  // PPR par personne ANNUEL (= perLine / staffCount)
  // 🆕 PPR par personne PAR TRIMESTRE (pour sélection dynamique Module 3)
  perPersonByQuarter?: QuarterlyPPRData;
  perLineByQuarter?: QuarterlyPPRData;
}

/**
 * Entrée Priority Actions par ligne d'activité
 */
export interface PriorityActionEntry {
  businessLine: string;
  staffCount: number;
  budgetRate: number;
  distributions: PriorityActionDistribution[];
}

// Budget data interface
export interface BudgetData {
  operationalRisk: number;
  complianceRisk: number;
  cyberRisk: number;
  macroRisk: number;
  activityRisk: number;
}

// Qualitative scores interface
export interface QualitativeData {
  operationalScore: number;
  complianceScore: number;
  cyberScore: number;
  macroScore: number;
  activityScore: number;
}

export interface FormData {
  selectedCurrency: Currency;
  companyInfo: CompanyInfo;
  businessLines: BusinessLine[];
  employeeEngagement: EmployeeEngagementData;
  riskData: RiskData;
  qualitativeAssessment: QualitativeAssessment;
  socioeconomicImprovement: SocioeconomicImprovement;
  calculatedFields: CalculatedFields;
  budgetData?: BudgetData;
  qualitativeData?: QualitativeData;
}

export interface FormStep {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ReportData {
  formData: FormData;
  generatedAt: Date;
  reportType: 'summary' | 'detailed' | 'analysis';
}

// Business sector options (matching original)
export const BUSINESS_SECTORS = [
  'Electronics industry',
  'Metal industry',
  'Glass factory',
  'Electrical appliances',
  'Food-processing industry',
  'Banking sector',
  'Insurances',
  'Maintenance',
  'Telecommunication',
  'Public sector',
  'Service and distribution',
  'No choice'
] as const;

export type BusinessSector = typeof BUSINESS_SECTORS[number];

// Risk appetite thresholds (matching original specifications)
export const RISK_APPETITE_THRESHOLDS = {
  BANKS_FINANCIAL: 0.0002, // 0.02%
  INSURANCE_CREDIT: 0.005,  // 0.5%
  MITIGATION_RATE_BANKS: 0.9998, // 99.98%
  MITIGATION_RATE_INSURANCE: 0.955, // 95.5%
} as const;


